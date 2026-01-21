"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock, Plus, Users, Loader2, Trophy, Activity, Phone } from "lucide-react";
import SokazConnect from "@/components/SokazConnect";
import SokazResults from "@/components/SokazResults";

const DashboardRightSection = ({ session }: { session: any }) => {
    const [activeTab, setActiveTab] = useState<'activity' | 'sokaz'>('activity');
    const isSokazLinked = session?.user?.sokazId;

    // Reset tab to SOKAZ if it just got linked
    useEffect(() => {
        if (isSokazLinked) setActiveTab('sokaz');
    }, [isSokazLinked]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <SokazConnect initialInfo={session?.user} />

            <div className="card glass" style={{ padding: '1.5rem', minHeight: '400px' }}>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                    >
                        <Activity size={18} /> Aktivnost
                    </button>
                    {isSokazLinked && (
                        <button
                            onClick={() => setActiveTab('sokaz')}
                            className={`tab-btn ${activeTab === 'sokaz' ? 'active-sokaz' : ''}`}
                        >
                            <Trophy size={18} /> SOKAZ
                        </button>
                    )}
                </div>

                <div className="tab-content">
                    {activeTab === 'activity' ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                            <Users size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Nema novih aktivnosti u tvom timu.</p>
                        </div>
                    ) : (
                        <SokazResults />
                    )}
                </div>
            </div>

            <style jsx>{`
                .tab-btn {
                    background: none; border: none; padding: 0.5rem 0;
                    color: var(--text-muted); cursor: pointer; font-weight: 600;
                    display: flex; align-items: center; gap: 0.5rem;
                    border-bottom: 2px solid transparent; transition: all 0.2s;
                }
                .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
                .tab-btn.active-sokaz { color: var(--secondary); border-bottom-color: var(--secondary); }
                .tab-btn:hover { color: #fff; }
            `}</style>
        </div>
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
                        {/* @ts-ignore */}
                        {session?.user?.phoneNumber && (
                            <span style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.7 }}>
                                {/* @ts-ignore */}
                                <Phone size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {(session.user as any).phoneNumber}
                            </span>
                        )}
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
                            <div className="card glass flex-center" style={{ padding: '3rem' }}><Loader2 className="animate-spin" /></div>
                        ) : bookings.length === 0 ? (
                            <div className="card glass" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                <CalendarIcon size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p>Nemaš nadolazećih treninga.</p>
                                <Link href="/book" style={{ color: 'var(--primary)', fontSize: '0.9rem', marginTop: '1rem', display: 'inline-block' }}>Rezerviraj termin →</Link>
                            </div>
                        ) : (
                            bookings.map(b => (
                                <div
                                    key={b.id}
                                    className="card glass training-card"
                                    /* @ts-ignore */
                                    style={{ borderLeft: `4px solid ${session?.user?.id === b.coachId ? 'var(--secondary)' : 'var(--primary)'}` }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                                                {/* @ts-ignore */}
                                                {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') ? `Trening s: ${b.user.name}` : `Trening s trenerom: ${b.coach.name}`}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Clock size={14} /> {new Date(b.startDateTime).toLocaleDateString('hr-HR')} @ {new Date(b.startDateTime).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-primary' : ''}`} style={{ fontSize: '0.65rem' }}>
                                            {b.status === 'CONFIRMED' ? 'POTVRĐENO' : b.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <DashboardRightSection session={session} />
            </div>

            <style jsx>{`
                .training-card { padding: 1.25rem; transition: transform 0.2s; }
                .training-card:hover { transform: translateX(5px); background: rgba(255,255,255,0.05); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .flex-center { display: flex; align-items: center; justify-content: center; }
            `}</style>
        </div>
    );
}
