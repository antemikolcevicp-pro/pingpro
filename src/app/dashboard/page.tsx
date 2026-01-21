"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock, Plus, Users, Loader2, Trophy } from "lucide-react";
import SokazConnect from "@/components/SokazConnect";
import SokazResults from "@/components/SokazResults";

const DashboardRightSection = ({ session }: { session: any }) => {
    const [activeTab, setActiveTab] = useState<'activity' | 'sokaz'>('activity');
    const isSokazLinked = session?.user?.sokazId;

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <SokazConnect initialInfo={session?.user} />

            <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setActiveTab('activity')}
                        style={{
                            padding: '0.5rem 0',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'activity' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'activity' ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Users size={18} /> Aktivnost Tima
                    </button>
                    {isSokazLinked && (
                        <button
                            onClick={() => setActiveTab('sokaz')}
                            style={{
                                padding: '0.5rem 0',
                                background: 'none',
                                border: 'none',
                                color: activeTab === 'sokaz' ? 'var(--secondary)' : 'var(--text-muted)',
                                borderBottom: activeTab === 'sokaz' ? '2px solid var(--secondary)' : '2px solid transparent',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Trophy size={18} /> SOKAZ Rezultati
                        </button>
                    )}
                </div>

                {activeTab === 'activity' ? (
                    <div className="card glass">
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            Nema novih aktivnosti u tvom timu.
                        </p>
                    </div>
                ) : (
                    <SokazResults />
                )}
            </div>
        </section>
    );
};

export default function Dashboard() {
    const { data: session } = useSession();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            fetch("/api/user/bookings")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setBookings(data);
                    setLoading(false);
                });
        }
    }, [session]);

    return (
        <div style={{ padding: '2rem 0' }}>
            <header className="flex-responsive" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1>Pozdrav, <span className="gradient-text">{session?.user?.name || "Igraču"}</span>! 👋</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {/* @ts-ignore */}
                        {session?.user?.role === 'COACH'
                            ? "Evo tvojih nadolazećih treninga s igračima."
                            : "Evo tvojih nadolazećih treninga."}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: 'max-content' }} className="dashboard-actions">
                    {/* @ts-ignore */}
                    {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') && (
                        <Link href="/admin/availability" className="btn glass" style={{ gap: '0.5rem', flex: 1 }}>
                            <CalendarIcon size={20} /> Kalendar
                        </Link>
                    )}
                    <Link href="/book" className="btn btn-primary" style={{ gap: '0.5rem', flex: 1 }}>
                        <Plus size={20} /> Rezerviraj
                    </Link>
                </div>
            </header>

            <div className="grid-responsive">
                <section>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarIcon size={24} color="var(--primary)" /> Moji Treningi
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? (
                            <div className="card glass" style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>
                        ) : bookings.length === 0 ? (
                            <div className="card glass" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                Nemaš nadolazećih treninga.
                            </div>
                        ) : bookings.map(b => (
                            <div
                                key={b.id}
                                className="card glass"
                                /* @ts-ignore */
                                style={{ borderLeft: `4px solid ${session?.user?.id === b.coachId ? 'var(--secondary)' : 'var(--primary)'}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                                            {/* @ts-ignore */}
                                            {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') ? `Trening s: ${b.user.name}` : `Trening s trenerom: ${b.coach.name}`}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Clock size={16} /> {new Date(b.startDateTime).toLocaleDateString('hr-HR')} @ {new Date(b.startDateTime).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-primary' : ''}`} style={{ fontSize: '0.7rem' }}>
                                        {b.status === 'CONFIRMED' ? 'POTVRĐENO' : b.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <DashboardRightSection session={session} />
            </div>
        </div>
    );
}
