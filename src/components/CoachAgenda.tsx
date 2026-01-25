"use client";

import { useState } from "react";
import { Clock, User, Phone, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { hr } from "date-fns/locale";

export default function CoachAgenda({ bookings, onUpdate }: { bookings: any[], onUpdate: () => void }) {
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const today = new Date();
    const todayBookings = bookings.filter(b => isSameDay(new Date(b.startDateTime), today));

    const markAsCompleted = async (id: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch("/api/admin/confirm-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId: id, action: 'COMPLETE' })
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    if (todayBookings.length === 0) return null;

    return (
        <section style={{ marginBottom: '3rem' }}>
            <div className="agenda-header">
                <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 color="var(--primary)" size={24} /> Današnji Raspored
                </h2>
                <span className="agenda-count">{todayBookings.length} treninga</span>
            </div>

            <div className="agenda-list">
                {todayBookings.map(b => {
                    const isCompleted = b.status === 'COMPLETED';
                    return (
                        <div key={b.id} className={`agenda-card glass ${isCompleted ? 'completed' : ''}`}>
                            <div className="agenda-time">
                                <Clock size={16} />
                                <span>{format(new Date(b.startDateTime), "HH:mm")}</span>
                            </div>

                            <div className="agenda-user">
                                <div className="user-name">{b.user?.name || "Nepoznato"}</div>
                                {b.user?.phoneNumber && (
                                    <a href={`tel:${b.user.phoneNumber}`} className="user-phone">
                                        <Phone size={12} /> {b.user.phoneNumber}
                                    </a>
                                )}
                            </div>

                            <div className="agenda-actions">
                                {!isCompleted ? (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => markAsCompleted(b.id)}
                                        disabled={updatingId === b.id}
                                    >
                                        {updatingId === b.id ? <Loader2 className="animate-spin" size={16} /> : "Odrađeno"}
                                    </button>
                                ) : (
                                    <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>✓ Odrađeno</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .agenda-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .agenda-count { font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; }
                
                .agenda-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .agenda-card { 
                    display: flex; align-items: center; padding: 1rem 1.5rem; gap: 1.5rem; border-radius: 16px; 
                    border: 1px solid rgba(255,255,255,0.05); transition: 0.2s;
                }
                .agenda-card.completed { opacity: 0.6; grayscale(0.5); }
                
                .agenda-time { display: flex; flex-direction: column; align-items: center; font-weight: 800; color: var(--primary); min-width: 50px; }
                .agenda-time span { font-size: 1.1rem; }
                
                .agenda-user { flex: 1; }
                .user-name { font-weight: 700; font-size: 1rem; margin-bottom: 2px; }
                .user-phone { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; text-decoration: none; }
                .user-phone:hover { color: var(--primary); }
                
                .agenda-actions { display: flex; align-items: center; gap: 1rem; }
                
                @media (max-width: 600px) {
                    .agenda-card { padding: 0.75rem 1rem; gap: 1rem; }
                    .agenda-time span { font-size: 1rem; }
                    .user-name { font-size: 0.9rem; }
                }
            `}</style>
        </section>
    );
}
