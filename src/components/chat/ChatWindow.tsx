"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { X, Send, User, Loader2 } from "lucide-react";
import { pusherClient } from "@/lib/pusher";

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
    sender: {
        name: string;
        image?: string;
    };
}

interface Conversation {
    id: string;
    users: any[];
}

export default function ChatWindow({
    conversationId,
    onClose,
    recipientName
}: {
    conversationId: string;
    onClose: () => void;
    recipientName: string;
}) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();

        // Subscribe to Pusher
        const channel = pusherClient.subscribe(conversationId);
        channel.bind("new-message", (newMessage: Message) => {
            setMessages((prev) => {
                // Avoid duplicates if we sent it ourselves and already added locally (optional optimization)
                if (prev.find(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
        });

        return () => {
            pusherClient.unsubscribe(conversationId);
        };
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chat/messages/${conversationId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const text = input;
        setInput("");

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, conversationId }),
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="chat-window card">
            <div className="chat-header">
                <div className="recipient-info">
                    <div className="avatar-mini"><User size={14} /></div>
                    <span>{recipientName}</span>
                </div>
                <button className="chat-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="chat-messages scroll-area">
                {loading ? (
                    <div className="flex-center" style={{ height: '100%' }}><Loader2 className="animate-spin" /></div>
                ) : messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>Započni razgovor s {recipientName}...</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        // @ts-ignore
                        const isMe = msg.senderId === session?.user?.id;
                        return (
                            <div key={msg.id} className={`message-bubble ${isMe ? "me" : "them"}`}>
                                <div className="msg-content">{msg.text}</div>
                                <div className="msg-time">{new Date(msg.createdAt).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
                <input
                    placeholder="Upiši poruku..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    autoFocus
                />
                <button type="submit" className="send-btn" disabled={!input.trim()}>
                    <Send size={18} />
                </button>
            </form>

            <style jsx>{`
        .chat-window {
          position: fixed; bottom: 90px; right: 20px; width: 380px; height: 550px;
          display: flex; flex-direction: column; z-index: 1001; animation: slideUp 0.3s ease;
          border-radius: 20px; box-shadow: 0 15px 50px rgba(0,0,0,0.6); overflow: hidden;
          background: #111; border: 1px solid rgba(255,255,255,0.1);
        }

        .chat-header { 
          padding: 1.25rem 1.5rem; background: #1a1a1a; 
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .recipient-info { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; color: #fff; }
        .avatar-mini { width: 26px; height: 26px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; }
        .chat-close { background: none; border: none; color: #fff; cursor: pointer; opacity: 0.6; transition: 0.2s; }
        .chat-close:hover { opacity: 1; transform: scale(1.1); }

        .chat-messages { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; background: #0c0c0c; }
        
        .message-bubble { max-width: 85%; padding: 0.8rem 1rem; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; position: relative; }
        .message-bubble.me { 
          align-self: flex-end; background: var(--primary); color: #000; font-weight: 600;
          border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(227, 6, 19, 0.2);
        }
        .message-bubble.them { 
          align-self: flex-start; background: #222; color: #fff;
          border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05);
        }
        
        .msg-time { font-size: 0.65rem; margin-top: 0.4rem; opacity: 0.6; text-align: right; }
        .message-bubble.me .msg-time { color: rgba(0,0,0,0.6); }

        .chat-input { 
          padding: 1.25rem; display: flex; gap: 0.75rem; background: #1a1a1a;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .chat-input input { 
          flex: 1; background: #252525; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 0.75rem 1.2rem; color: #fff; outline: none; font-size: 1rem;
        }
        .chat-input input:focus { border-color: var(--primary); background: #333; }
        .send-btn { 
          background: var(--primary); border: none; color: #000; width: 45px; height: 45px;
          border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: 0.2s; box-shadow: 0 4px 15px rgba(227, 6, 19, 0.2);
        }
        .send-btn:hover { transform: scale(1.05); background: #ff1a1a; }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }

        .empty-chat { text-align: center; color: var(--text-muted); padding: 5rem 0; font-style: italic; font-size: 0.9rem; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 600px) {
          .chat-window { 
            width: 100%; height: 100dvh; bottom: 0; right: 0; 
            border-radius: 0; border: none; z-index: 2000;
          }
          .chat-header { padding: 1.5rem; position: sticky; top: 0; z-index: 10; }
          .chat-input { padding: 1.5rem; padding-bottom: calc(1.5rem + env(safe-area-inset-bottom)); position: sticky; bottom: 0; }
        }
      `}</style>
        </div>
    );
}
