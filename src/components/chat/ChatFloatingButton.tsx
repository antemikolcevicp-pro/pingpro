"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, User, Plus, Loader2 } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function ChatFloatingButton() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [showNewChatPanel, setShowNewChatPanel] = useState(false);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // @ts-ignore
    const userTeamId = session?.user?.teamId;
    // @ts-ignore
    const userTeamName = session?.user?.sokazTeam || "Moj Tim";

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/chat/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoaches = async () => {
        setLoading(true);
        setShowNewChatPanel(true);
        try {
            const res = await fetch("/api/users/coaches");
            if (res.ok) {
                const data = await res.json();
                setCoaches(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startConversation = async (coachId?: string, coachName?: string, teamId?: string) => {
        try {
            const body = teamId ? { teamId } : { participantId: coachId };
            const res = await fetch("/api/chat/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                const data = await res.json();
                setActiveChat({ id: data.id, name: teamId ? userTeamName : (coachName || "Chat") });
                setShowNewChatPanel(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <div className={`chat-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </div>

            {isOpen && !activeChat && (
                <div className="conversations-panel card">
                    <div className="panel-header">
                        <h3>Poruke</h3>
                        <button className="new-chat-btn" title="Nova poruka" onClick={fetchCoaches}><Plus size={18} /></button>
                    </div>

                    <div className="convo-list scroll-area">
                        {loading ? (
                            <div className="flex-center" style={{ height: '200px' }}><Loader2 className="animate-spin" /></div>
                        ) : showNewChatPanel ? (
                            <div className="new-chat-list">
                                <div className="back-link" onClick={() => setShowNewChatPanel(false)}>← Povratak</div>

                                {userTeamId && (
                                    <div className="team-convo-start" onClick={() => startConversation(undefined, undefined, userTeamId)}>
                                        <div className="team-icon">🏆</div>
                                        <div className="convo-info">
                                            <div className="convo-name">Grupni chat tima</div>
                                            <div className="convo-sub">{userTeamName}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="section-title">Treneri</div>
                                {coaches.map(coach => (
                                    <div key={coach.id} className="convo-item" onClick={() => startConversation(coach.id, coach.name)}>
                                        <div className="avatar-placeholder"><User size={20} /></div>
                                        <div className="convo-info">
                                            <div className="convo-name">{coach.name}</div>
                                            <div className="convo-sub">Pošalji poruku treneru</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="empty-state-mini">
                                <p>Nemaš aktivnih razgovora.</p>
                                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={fetchCoaches}>Kontaktiraj trenera</button>
                            </div>
                        ) : (
                            conversations.map(convo => {
                                // @ts-ignore
                                const isTeam = !!convo.teamId;
                                // @ts-ignore
                                const otherUser = convo.users.find(u => u.id !== session?.user?.id);
                                const chatName = isTeam ? (convo.team?.name || userTeamName) : (otherUser?.name || "Korisnik");

                                return (
                                    <div key={convo.id} className="convo-item" onClick={() => setActiveChat({ id: convo.id, name: chatName })}>
                                        <div className={`avatar-placeholder ${isTeam ? 'team' : ''}`}>
                                            {isTeam ? "🏆" : <User size={20} />}
                                        </div>
                                        <div className="convo-info">
                                            <div className="convo-name">{chatName}</div>
                                            <div className="convo-last-msg">{convo.messages[0]?.text || "Nema poruka..."}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {activeChat && (
                <ChatWindow
                    conversationId={activeChat.id}
                    recipientName={activeChat.name}
                    onClose={() => setActiveChat(null)}
                />
            )}

            <style jsx>{`
        .chat-trigger {
          position: fixed; bottom: 25px; right: 25px; width: 65px; height: 65px;
          background: var(--primary); color: #000; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 8px 30px rgba(0,0,0,0.6);
          z-index: 1002; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 2px solid rgba(255,255,255,0.1);
        }
        .chat-trigger:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(227, 6, 19, 0.4); }
        .chat-trigger.active { background: #fff; color: #000; transform: rotate(90deg); }

        .conversations-panel {
          position: fixed; bottom: 105px; right: 25px; width: 350px; max-height: 550px;
          z-index: 1001; animation: slideUp 0.3s ease; border-radius: 28px;
          display: flex; flex-direction: column; overflow: hidden;
          background: #111; border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 15px 50px rgba(0,0,0,0.8);
        }

        .panel-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .panel-header h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #fff; }
        .new-chat-btn { background: var(--primary); border: none; color: #000; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .new-chat-btn:hover { transform: scale(1.1); }

        .convo-list { flex: 1; overflow-y: auto; padding: 0.75rem; background: #0c0c0c; }
        .convo-item { padding: 1rem; display: flex; gap: 1rem; align-items: center; border-radius: 16px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
        .convo-item:hover { background: #1a1a1a; border-color: rgba(255,255,255,0.05); }
        
        .team-convo-start { 
            padding: 1.25rem; background: linear-gradient(135deg, rgba(227, 6, 19, 0.2) 0%, rgba(0,0,0,0) 100%);
            border: 1.5px solid var(--primary); margin-bottom: 1rem; border-radius: 18px; 
            display: flex; gap: 1rem; align-items: center; cursor: pointer;
            transition: 0.3s;
        }
        .team-convo-start:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(227, 6, 19, 0.2); }
        .team-icon { font-size: 1.5rem; }

        .section-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); padding: 1rem 1rem 0.5rem; font-weight: 800; }

        .avatar-placeholder { width: 44px; height: 44px; background: #222; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); }
        .avatar-placeholder.team { background: rgba(227, 6, 19, 0.1); border-color: var(--primary); border-radius: 50%; }
        
        .convo-info { flex: 1; overflow: hidden; }
        .convo-name { font-weight: 700; font-size: 1rem; margin-bottom: 0.15rem; color: #fff; }
        .convo-last-msg, .convo-sub { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .back-link { padding: 0.5rem 1rem; font-size: 0.85rem; color: var(--primary); cursor: pointer; font-weight: 800; margin-bottom: 0.5rem; }
        .empty-state-mini { padding: 4rem 1rem; text-align: center; color: var(--text-muted); font-size: 1rem; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 600px) {
            .conversations-panel {
                width: 100%; height: 100dvh; bottom: 0; right: 0;
                border-radius: 0; border: none; z-index: 1001;
            }
            .chat-trigger { right: 20px; bottom: 20px; }
        }
        }
      `}</style>
        </>
    );
}
