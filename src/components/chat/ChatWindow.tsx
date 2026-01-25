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

            if (!res.ok) {
                // Handle error, maybe revert input
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="chat-window glass card">
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
                />
                <button type="submit" className="send-btn" disabled={!input.trim()}>
                    <Send size={18} />
                </button>
            </form>

            <style jsx>{`
        .chat-window {
          position: fixed; bottom: 90px; right: 20px; width: 350px; height: 500px;
          display: flex; flex-direction: column; z-index: 1001; animation: slideUp 0.3s ease;
          border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.4); overflow: hidden;
        }

        .chat-header { 
          padding: 1rem 1.5rem; background: rgba(255,255,255,0.05); 
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .recipient-info { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; }
        .avatar-mini { width: 24px; height: 24px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; }
        .chat-close { background: none; border: none; color: #fff; cursor: pointer; opacity: 0.6; transition: 0.2s; }
        .chat-close:hover { opacity: 1; transform: scale(1.1); }

        .chat-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        
        .message-bubble { max-width: 80%; padding: 0.75rem 1rem; border-radius: 16px; font-size: 0.9rem; line-height: 1.4; position: relative; }
        .message-bubble.me { 
          align-self: flex-end; background: var(--primary); color: #000; font-weight: 500;
          border-bottom-right-radius: 4px;
        }
        .message-bubble.them { 
          align-self: flex-start; background: rgba(255,255,255,0.08); color: #fff;
          border-bottom-left-radius: 4px;
        }
        
        .msg-time { font-size: 0.65rem; margin-top: 0.25rem; opacity: 0.6; text-align: right; }
        .message-bubble.me .msg-time { color: rgba(0,0,0,0.5); }

        .chat-input { 
          padding: 1rem; display: flex; gap: 0.75rem; background: rgba(0,0,0,0.2);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .chat-input input { 
          flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0.6rem 1rem; color: #fff; outline: none; font-size: 0.9rem;
        }
        .chat-input input:focus { border-color: var(--primary); }
        .send-btn { 
          background: var(--primary); border: none; color: #000; width: 40px; height: 40px;
          border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: 0.2s;
        }
        .send-btn:hover { transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .empty-chat { text-align: center; color: var(--text-muted); padding: 5rem 0; font-style: italic; font-size: 0.85rem; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 450px) {
          .chat-window { width: calc(100% - 40px); bottom: 80px; }
        }
      `}</style>
        </div>
    );
}
