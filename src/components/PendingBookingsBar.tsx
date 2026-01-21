"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { hr } from "date-fns/locale";
import { Bell, Check, X, Loader2, Calendar } from "lucide-react";

export default function PendingBookingsBar() {
    const [pending, setPending] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchPending();
        // Refresh every minute
        const interval = setInterval(fetchPending, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchPending = async () => {
        try {
            const res = await fetch("/api/admin/confirm-booking");
            if (res.ok) {
                const data = await res.json();
                setPending(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = async (bookingId: string, action: 'CONFIRM' | 'CANCEL') => {
        setProcessing(bookingId);
        try {
            const res = await fetch("/api/admin/confirm-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, action })
            });

            if (res.ok) {
                setPending(prev => prev.filter(b => b.id !== bookingId));
                // Optional: trigger a global event or refresh the calendar if visible
                window.dispatchEvent(new Event('bookingUpdated'));
            }
        } catch (error) {
            alert("Greška pri obradi.");
        } finally {
            setProcessing(null);
        }
    };

    if (pending.length === 0) return null;

    return (
        <div className="pending-bar glass">
            <div className="container">
                <div className="header">
                    <div className="title">
                        <Bell className="icon pulse" size={20} />
                        <span>Imate <strong>{pending.length}</strong> nove rezervacije na čekanju!</span>
                    </div>
                </div>

                <div className="pending-list">
                    {pending.map(b => (
                        <div key={b.id} className="pending-item card">
                            <div className="info">
                                <span className="player-name">{b.user.name}</span>
                                <span className="time-info">
                                    <Calendar size={14} />
                                    {format(parseISO(b.startDateTime), "dd.MM. HH:mm")}h
                                </span>
                            </div>
                            <div className="actions">
                                <button
                                    className="btn-confirm"
                                    onClick={() => handleAction(b.id, 'CONFIRM')}
                                    disabled={processing === b.id}
                                >
                                    {processing === b.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                                </button>
                                <button
                                    className="btn-cancel"
                                    onClick={() => handleAction(b.id, 'CANCEL')}
                                    disabled={processing === b.id}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .pending-bar {
                    background: rgba(255, 126, 33, 0.1);
                    border-bottom: 2px solid var(--secondary);
                    padding: 1rem 0;
                    margin-bottom: 2rem;
                    animation: slideDown 0.5s ease-out;
                }
                .container { display: flex; flex-direction: column; gap: 1rem; }
                .header { display: flex; align-items: center; justify-content: center; }
                .title { display: flex; align-items: center; gap: 0.75rem; color: #fff; font-size: 1rem; }
                .icon { color: var(--secondary); }
                .pulse { animation: bellPulse 2s infinite; }

                .pending-list { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; }
                .pending-item { 
                    flex: 0 0 auto; display: flex; align-items: center; gap: 1.5rem; 
                    padding: 0.75rem 1.25rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                }
                .info { display: flex; flex-direction: column; }
                .player-name { font-weight: 700; color: #fff; font-size: 0.95rem; }
                .time-info { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }

                .actions { display: flex; gap: 0.5rem; }
                .actions button { 
                    width: 36px; height: 36px; border-radius: 10px; border: none; 
                    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .btn-confirm { background: var(--primary); color: #000; }
                .btn-confirm:hover { transform: scale(1.1); box-shadow: 0 0 15px var(--primary); }
                .btn-cancel { background: rgba(255,0,0,0.1); color: #ff4444; }
                .btn-cancel:hover { background: #ff4444; color: #fff; transform: scale(1.1); }

                @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes bellPulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
