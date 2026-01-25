"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock, Plus, Users, Loader2, Trophy, Activity, Phone, Edit2, Check, X, History, Search, Filter } from "lucide-react";
import SokazConnect from "@/components/SokazConnect";
import SokazResults from "@/components/SokazResults";
import TeamActivities from "@/components/TeamActivities";
import { useRouter } from "next/navigation";

const DashboardRightSection = ({ session }: { session: any }) => {
    const [userStatus, setUserStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'activity' | 'sokaz'>('activity');

    useEffect(() => {
        // Fetch fresh status to handle "stale session" issues (e.g. admin removed team)
        fetch('/api/user/status')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) setUserStatus(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // If we have fresh data, use it. Otherwise fall back to session (initial load)
    const effectiveUser = userStatus || session?.user;

    // Show SOKAZ tab if user has linked profile OR belongs to a team (can see team results)
    const hasSokazProfile = !!effectiveUser?.sokazId;
    const hasTeam = !!effectiveUser?.teamId || !!effectiveUser?.sokazTeam;
    const canShowSokaz = hasSokazProfile || hasTeam;

    // Reset tab to SOKAZ if it just got linked
    useEffect(() => {
        if (hasSokazProfile && !loading) setActiveTab('sokaz');
    }, [hasSokazProfile, loading]);

    if (loading) return <div className="card glass flex-center" style={{ minHeight: '200px' }}><Loader2 className="animate-spin" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <SokazConnect initialInfo={effectiveUser} onLinkSuccess={(newData: any) => setUserStatus(newData)} />

            <div className="card glass" style={{ padding: '1.5rem', minHeight: '400px' }}>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                    >
                        <Activity size={18} /> Aktivnost
                    </button>
                    {canShowSokaz && (
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
                        <TeamActivities />
                    ) : (
                        <SokazResults
                            sokazId={effectiveUser?.sokazId}
                            teamName={effectiveUser?.sokazTeam || effectiveUser?.team?.name}
                        />
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
                .flex-center { display: flex; align-items: center; justify-content: center; }
            `}</style>
        </div>
    );
};

export default function Dashboard() {
    const { data: session, update } = useSession();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Name Editing State
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [savingName, setSavingName] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState("");
    const router = useRouter();

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

    const saveName = async () => {
        if (!newName.trim()) return;
        setSavingName(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                await update({ name: newName }); // Update session
                setIsEditingName(false);
                router.refresh();
            } else {
                alert("Greška pri promjeni imena.");
            }
        } catch (error) {
            console.error(error);
            alert("Greška.");
        } finally {
            setSavingName(false);
        }
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcomingBookings = bookings.filter(b => new Date(b.endDateTime) >= startOfToday);
    const pastBookings = bookings.filter(b => new Date(b.endDateTime) < startOfToday);

    const filteredHistory = pastBookings.filter(b => {
        const coachName = b.coach?.name?.toLowerCase() || "";
        const playerName = b.user?.name?.toLowerCase() || "";
        const search = historySearch.toLowerCase();
        return coachName.includes(search) || playerName.includes(search);
    }).sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

    return (
        <div style={{ padding: '2rem 0' }}>
            <header className="flex-responsive" style={{ marginBottom: '3rem' }}>
                <div>
                    {!isEditingName ? (
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span>Pozdrav, <span className="gradient-text">{session?.user?.name || "Igraču"}</span>! 👋</span>
                            <button
                                onClick={() => {
                                    setNewName(session?.user?.name || "");
                                    setIsEditingName(true);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}
                                title="Uredi ime"
                            >
                                <Edit2 size={18} />
                            </button>
                        </h1>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid var(--border)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '1.2rem',
                                    maxWidth: '250px'
                                }}
                            />
                            <button
                                onClick={saveName}
                                className="btn btn-primary"
                                style={{ padding: '0.5rem', minWidth: '40px' }}
                                disabled={savingName}
                            >
                                {savingName ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            </button>
                            <button
                                onClick={() => setIsEditingName(false)}
                                className="btn glass"
                                style={{ padding: '0.5rem', minWidth: '40px' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

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
                    <Link href="/book" className="btn btn-primary" style={{ gap: '0.5rem', flex: 1 }}>
                        <Plus size={20} /> Rezerviraj
                    </Link>
                </div>
            </header>

            <div className="grid-responsive">
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarIcon size={24} color="var(--primary)" /> Moji Treningi
                        </h2>
                        <button
                            className="btn glass"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', gap: '0.4rem' }}
                            onClick={() => setIsHistoryOpen(true)}
                        >
                            <History size={16} /> Povijest
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? (
                            <div className="card glass flex-center" style={{ padding: '3rem' }}><Loader2 className="animate-spin" /></div>
                        ) : upcomingBookings.length === 0 ? (
                            <div className="card glass" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                <CalendarIcon size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p>Nemaš nadolazećih treninga.</p>
                                <Link href="/book" style={{ color: 'var(--primary)', fontSize: '0.9rem', marginTop: '1rem', display: 'inline-block' }}>Rezerviraj termin →</Link>
                            </div>
                        ) : (
                            upcomingBookings.map(b => (
                                <div
                                    key={b.id}
                                    className="card glass training-card"
                                    /* @ts-ignore */
                                    style={{ borderLeft: `4px solid ${session?.user?.id === b.coachId ? '#a855f7' : 'var(--primary)'}` }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                                                {/* @ts-ignore */}
                                                {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') ? `Trening s: ${b.user?.name || 'Nepoznato'}` : (b.coach ? `Trening s trenerom: ${b.coach.name}` : 'Samostalni trening')}
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

            {/* HISTORY MODAL */}
            {isHistoryOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass card history-modal">
                        <div className="modal-header">
                            <div>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <History size={24} color="var(--primary)" /> Povijest Treninga
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Svi tvoji prošli termini i odrađeni treninzi.</p>
                            </div>
                            <button className="close-btn" onClick={() => setIsHistoryOpen(false)}><X /></button>
                        </div>

                        <div className="history-filters">
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    placeholder="Pretraži po imenu..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="history-list scroll-area">
                            {filteredHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                                    <p>Nema pronađenih treninga u povijesti.</p>
                                </div>
                            ) : (
                                filteredHistory.map(b => (
                                    <div key={b.id} className="history-item glass">
                                        <div className="h-left" style={{ borderLeft: `3px solid ${b.coachId ? '#a855f7' : '#fff'}` }}>
                                            <span className="h-date">{new Date(b.startDateTime).toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                            <span className="h-title">
                                                {/* @ts-ignore */}
                                                {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') ? `Gost: ${b.user?.name || 'Nepoznato'}` : (b.coach ? `Trener: ${b.coach.name}` : 'Samostalni trening')}
                                            </span>
                                        </div>
                                        <div className="h-right">
                                            <span className="h-time"><Clock size={12} /> {new Date(b.startDateTime).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className={`h-status ${b.status}`}>{b.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .training-card { padding: 1.25rem; transition: transform 0.2s; position: relative; overflow: hidden; }
                .training-card:hover { transform: translateX(5px); background: rgba(255,255,255,0.05); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .flex-center { display: flex; align-items: center; justify-content: center; }

                /* History Modal */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .history-modal { width: 100%; max-width: 600px; max-height: 80vh; display: flex; flexDirection: column; padding: 2rem; }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .close-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: 0.2s; }
                .close-btn:hover { background: rgba(255,255,255,0.1); }

                .history-filters { margin-bottom: 1.5rem; }
                .search-box { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.05); padding: 0.75rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                .search-box input { background: none; border: none; color: #fff; outline: none; width: 100%; font-size: 0.95rem; }

                .history-list { overflow-y: auto; flex: 1; display: flex; flexDirection: column; gap: 0.75rem; padding-right: 0.5rem; }
                .history-list::-webkit-scrollbar { width: 6px; }
                .history-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

                .history-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-radius: 12px; }
                .h-left { display: flex; flex-direction: column; gap: 0.25rem; padding-left: 1rem; }
                .h-date { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
                .h-title { font-weight: 600; font-size: 0.95rem; }
                .h-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
                .h-time { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem; }
                .h-status { font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); font-weight: 800; border: 1px solid rgba(255,255,255,0.1); }
                .h-status.CONFIRMED { color: var(--primary); border-color: rgba(227, 6, 19, 0.2); }
                .h-status.CANCELLED { color: #ff4444; border-color: rgba(255,68,68,0.2); }

                @media (max-width: 600px) {
                    .modal-overlay { padding: 1rem; }
                    .history-modal { padding: 1.5rem; max-height: 90vh; }
                }
            `}</style>
        </div>
    );
}
