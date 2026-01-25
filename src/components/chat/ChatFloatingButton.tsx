"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, User, Plus, Loader2 } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function ChatFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [showNewChatPanel, setShowNewChatPanel] = useState(false);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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

    const startConversation = async (coachId: string, coachName: string) => {
        try {
            const res = await fetch("/api/chat/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantId: coachId }),
            });
            if (res.ok) {
                const data = await res.json();
                setActiveChat({ id: data.id, name: coachName });
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
                <div className="conversations-panel glass card">
                    <div className="panel-header">
                        <h3>Poruke</h3>
                        <button className="new-chat-btn" onClick={fetchCoaches}><Plus size={18} /></button>
                    </div>

                    <div className="convo-list scroll-area">
                        {loading ? (
                            <div className="flex-center" style={{ height: '200px' }}><Loader2 className="animate-spin" /></div>
                        ) : showNewChatPanel ? (
                            <div className="new-chat-list">
                                <div className="back-link" onClick={() => setShowNewChatPanel(false)}>← Povratak</div>
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
                                const otherUser = convo.users[0]; // Logic might need adjustment for current user check
                                return (
                                    <div key={convo.id} className="convo-item" onClick={() => setActiveChat({ id: convo.id, name: otherUser.name })}>
                                        <div className="avatar-placeholder"><User size={20} /></div>
                                        <div className="convo-info">
                                            <div className="convo-name">{otherUser.name}</div>
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
          position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
          background: var(--primary); color: #000; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          z-index: 1002; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chat-trigger:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 8px 30px rgba(227, 6, 19, 0.4); }
        .chat-trigger.active { background: #fff; color: #000; transform: rotate(180deg); }

        .conversations-panel {
          position: fixed; bottom: 90px; right: 20px; width: 320px; max-height: 450px;
          z-index: 1001; animation: slideUp 0.3s ease; border-radius: 24px;
          display: flex; flex-direction: column; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .panel-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .panel-header h3 { margin: 0; font-size: 1.1rem; }
        .new-chat-btn { background: rgba(255,255,255,0.05); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .convo-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
        .convo-item { padding: 0.75rem 1rem; display: flex; gap: 1rem; align-items: center; border-radius: 12px; cursor: pointer; transition: 0.2s; }
        .convo-item:hover { background: rgba(255,255,255,0.05); }
        
        .avatar-placeholder { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .convo-info { flex: 1; overflow: hidden; }
        .convo-name { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.1rem; }
        .convo-last-msg, .convo-sub { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .back-link { padding: 0.5rem 1rem; font-size: 0.8rem; color: var(--primary); cursor: pointer; font-weight: 700; }
        .empty-state-mini { padding: 3rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </>
    );
}
