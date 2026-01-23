"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { User, LogOut, Calendar, Users, Settings, TrendingUp, Bell, Menu, X, Check, Loader2 } from "lucide-react";

export default function Navigation() {
    const { data: session } = useSession();
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingBookings, setPendingBookings] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // @ts-ignore
    const isCoachOrAdmin = session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN';

    useEffect(() => {
        if (isCoachOrAdmin) {
            fetchCount();
            const interval = setInterval(fetchCount, 60000);
            return () => clearInterval(interval);
        }
    }, [isCoachOrAdmin]);

    const fetchCount = async () => {
        try {
            const res = await fetch('/api/admin/pending-bookings');
            if (res.ok) {
                const data = await res.json();
                setPendingCount(data.length);
                if (isNotifOpen) setPendingBookings(data);
            }
        } catch (e) { }
    };

    const toggleNotif = async () => {
        const nextState = !isNotifOpen;
        setIsNotifOpen(nextState);
        if (nextState) {
            setIsMenuOpen(false);
            try {
                const res = await fetch('/api/admin/pending-bookings');
                if (res.ok) {
                    const data = await res.json();
                    setPendingBookings(data);
                }
            } catch (e) { }
        }
    };

    const handleConfirm = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch("/api/admin/confirm-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId: id, action: 'CONFIRM' })
            });
            if (res.ok) {
                setPendingBookings(prev => prev.filter(b => b.id !== id));
                setPendingCount(prev => prev - 1);
            }
        } catch (e) {
            alert("Greška pri potvrdi");
        } finally {
            setProcessingId(null);
        }
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const MainLinks = () => (
        <>
            <Link href="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <Calendar size={18} /> <span>Dashboard</span>
            </Link>
            <Link href={isCoachOrAdmin ? "/admin/teams" : "/teams"} className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <Users size={18} /> <span>Timovi</span>
            </Link>
            {isCoachOrAdmin && (
                <>
                    <Link href="/admin/reports" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        <TrendingUp size={18} /> <span>Izvještaji</span>
                    </Link>
                    <Link href="/admin/availability" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        <Settings size={18} /> <span>Kalendar</span>
                    </Link>
                    <Link href="/admin/users" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        <User size={18} /> <span>Korisnici</span>
                    </Link>
                </>
            )}
        </>
    );

    return (
        <nav className="glass navbar">
            <div className="container nav-content">
                <div className="nav-left">
                    {session && (
                        <button className="mobile-menu-btn" onClick={() => { setIsMenuOpen(!isMenuOpen); setIsNotifOpen(false); }}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    )}
                    <Link href="/" className="logo-section">
                        <img src="/images/club-logo.jpg" alt="Logo" className="logo-img" />
                        <div className="logo-text desktop-only">
                            <span className="brand">PingPro</span>
                            <span className="sub">HSTK Velika Gorica</span>
                        </div>
                    </Link>
                </div>

                <div className="nav-center desktop-only">
                    {session && <MainLinks />}
                </div>

                <div className="nav-right">
                    {session ? (
                        <div className="user-controls">
                            {isCoachOrAdmin && (
                                <div className="notif-wrapper" ref={notifRef}>
                                    <button className={`notif-btn ${isNotifOpen ? 'active' : ''}`} onClick={toggleNotif}>
                                        <Bell size={20} />
                                        {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
                                    </button>

                                    {isNotifOpen && (
                                        <div className="notif-dropdown card glass">
                                            <div className="notif-header">
                                                <span>Zahtjevi na čekanju</span>
                                                {pendingCount > 0 && <span className="count-pill">{pendingCount}</span>}
                                            </div>
                                            <div className="notif-body">
                                                {pendingBookings.length === 0 ? (
                                                    <div className="empty-notif">Nema novih zahtjeva</div>
                                                ) : (
                                                    pendingBookings.map(b => (
                                                        <div key={b.id} className="notif-item">
                                                            <div className="notif-info">
                                                                <span className="p-name">{b.user.name}</span>
                                                                <span className="p-time">{new Date(b.startDateTime).toLocaleTimeString("hr-HR", { hour: '2-digit', minute: '2-digit' })}h • {new Date(b.startDateTime).toLocaleDateString("hr-HR", { day: 'numeric', month: 'numeric' })}</span>
                                                            </div>
                                                            <button
                                                                className="accept-btn"
                                                                onClick={() => handleConfirm(b.id)}
                                                                disabled={processingId === b.id}
                                                            >
                                                                {processingId === b.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <Link href="/admin/availability" className="notif-footer" onClick={() => setIsNotifOpen(false)}>
                                                Otvori cijeli kalendar
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Link href="/profile" className="profile-pill">
                                {session.user?.image && <img src={session.user.image} alt="Avatar" className="avatar" />}
                                <span className="username desktop-only">{session.user?.name?.split(' ')[0]}</span>
                            </Link>

                            <button onClick={() => signOut()} className="logout-icon" title="Odjava">
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => signIn('google')} className="btn btn-primary btn-sm">Prijava</button>
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="mobile-overlay glass animate-fade-in">
                    <div className="mobile-links">
                        <MainLinks />
                    </div>
                </div>
            )}

            <style jsx>{`
                .navbar { position: sticky; top: 0; z-index: 1000; padding: 0.6rem 0; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .nav-content { display: flex; justify-content: space-between; align-items: center; }
                .nav-left, .nav-right { display: flex; align-items: center; gap: 1rem; }
                .nav-center { display: flex; gap: 1.5rem; align-items: center; }
                
                .logo-section { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
                .logo-img { height: 36px; width: auto; border-radius: 4px; }
                .logo-text { display: flex; flex-direction: column; line-height: 1; }
                .brand { font-size: 1.1rem; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
                .sub { font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }

                .nav-link { display: flex; align-items: center; gap: 0.5rem; color: #eee; font-size: 0.9rem; font-weight: 500; transition: 0.2s; text-decoration: none; }
                .nav-link:hover { color: var(--primary); }

                .user-controls { display: flex; align-items: center; gap: 1rem; }
                .profile-pill { display: flex; align-items: center; gap: 0.6rem; padding: 0.3rem 0.6rem; border-radius: 20px; transition: 0.2s; text-decoration: none; }
                .profile-pill:hover { background: rgba(255,255,255,0.05); }
                .avatar { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--border); }
                .username { font-size: 0.85rem; color: #fff; }

                .notif-wrapper { position: relative; }
                .notif-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; position: relative; padding: 0.4rem; border-radius: 8px; transition: 0.2s; }
                .notif-btn:hover, .notif-btn.active { color: #fff; background: rgba(255,255,255,0.08); }
                .badge { position: absolute; top: 0; right: 0; background: var(--primary); color: #000; font-size: 0.65rem; font-weight: 900; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #000; }

                .notif-dropdown { position: absolute; top: calc(100% + 15px); right: -10px; width: 280px; padding: 0; z-index: 1001; animation: slideUp 0.3s ease-out; }
                .notif-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 0.9rem; }
                .count-pill { background: var(--primary); color: #000; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }
                .notif-body { max-height: 320px; overflow-y: auto; }
                .notif-item { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: space-between; transition: 0.2s; }
                .notif-item:hover { background: rgba(255,255,255,0.02); }
                .notif-info { display: flex; flex-direction: column; gap: 2px; }
                .p-name { font-weight: 600; font-size: 0.85rem; color: #fff; }
                .p-time { font-size: 0.75rem; color: var(--text-muted); }
                .accept-btn { background: var(--primary); color: #000; border: none; padding: 6px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
                .accept-btn:hover { transform: scale(1.1); }
                .notif-footer { display: block; padding: 0.75rem; text-align: center; font-size: 0.75rem; color: var(--primary); font-weight: 600; background: rgba(0,0,0,0.2); text-decoration: none; }
                .empty-notif { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; }

                .logout-icon { background: none; border: none; color: var(--error); cursor: pointer; opacity: 0.7; transition: 0.2s; display: flex; align-items: center; }
                .logout-icon:hover { opacity: 1; transform: scale(1.1); }

                .mobile-menu-btn { display: none; background: none; border: none; color: #fff; cursor: pointer; padding: 0.4rem; }
                .mobile-overlay { position: fixed; top: 62px; inset: 0; background: rgba(0,0,0,0.95); z-index: 999; display: flex; flex-direction: column; padding: 2rem; }
                .mobile-links { display: flex; flex-direction: column; gap: 2rem; }
                .mobile-links :global(.nav-link) { font-size: 1.5rem; gap: 1rem; }

                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                    .mobile-menu-btn { display: block; }
                    .navbar { padding: 0.4rem 0; }
                    .user-controls { gap: 0.5rem; }
                    .profile-pill { padding: 0.2rem; }
                    .nav-right { gap: 0.5rem; }
                }
            `}</style>
        </nav>
    );
}
