"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar, User, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";

export default function TeamActivities() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/team/activities")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setActivities(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex-center" style={{ padding: '3rem' }}>
            <Loader2 className="animate-spin" size={24} color="var(--primary)" />
        </div>
    );

    if (activities.length === 0) return (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
            <User size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Nema novih aktivnosti tima.</p>
        </div>
    );

    return (
        <div className="team-activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.map(booking => (
                <div key={booking.id} className="activity-card glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="avatar-placeholder" style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', fontWeight: 'bold'
                    }}>
                        {booking.user.name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                            {booking.user.name}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> {format(new Date(booking.startDateTime), "d.MMM", { locale: hr })}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {format(new Date(booking.startDateTime), "HH:mm")}
                            </span>
                            {booking.location && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} /> {booking.location.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <style jsx>{`
                .activity-card { border: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; }
                .activity-card:hover { background: rgba(255,255,255,0.05); }
                .flex-center { display: flex; align-items: center; justify-content: center; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
