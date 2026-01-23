"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { User, LogOut, Calendar, Users, Settings, TrendingUp, Bell } from "lucide-react";

export default function Navigation() {
    const { data: session } = useSession();
    const [pendingCount, setPendingCount] = useState(0);
    // @ts-ignore
    const isCoachOrAdmin = session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN';

    useEffect(() => {
        if (isCoachOrAdmin) {
            const fetchPending = async () => {
                try {
                    const res = await fetch('/api/admin/pending-bookings');
                    if (res.ok) {
                        const data = await res.json();
                        setPendingCount(data.length);
                    }
                } catch (e) { }
            };
            fetchPending();
            const interval = setInterval(fetchPending, 60000);
            return () => clearInterval(interval);
        }
    }, [isCoachOrAdmin]);

    return (
        <nav className="glass" style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '0.75rem 0',
            marginBottom: '2rem'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="logo-container">
                        <img src="/images/club-logo.jpg" alt="HSTK Velika Gorica" style={{ height: '40px', width: 'auto' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }} className="desktop-only">
                        <span className="gradient-text" style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>PingPro</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>HSTK Velika Gorica</span>
                    </div>
                </Link>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    {session ? (
                        <>
                            <Link href="/dashboard" className="nav-link" title="Dashboard">
                                <Calendar size={20} /> <span className="nav-labels">Dashboard</span>
                            </Link>
                            <Link href={isCoachOrAdmin ? "/admin/teams" : "/teams"} className="nav-link" title="Timovi">
                                <Users size={20} /> <span className="nav-labels">Timovi</span>
                            </Link>
                            {isCoachOrAdmin && (
                                <>
                                    <Link href="/admin/reports" className="nav-link" title="Izvještaji">
                                        <TrendingUp size={20} /> <span className="nav-labels">Izvještaji</span>
                                    </Link>
                                    <Link href="/admin/availability" className="nav-link" title="Kalendar">
                                        <Settings size={20} /> <span className="nav-labels">Kalendar</span>
                                    </Link>
                                    <Link href="/admin/users" className="nav-link desktop-only" title="Korisnici">
                                        <User size={20} /> <span className="nav-labels">Korisnici</span>
                                    </Link>
                                </>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
                                {isCoachOrAdmin && (
                                    <Link href="/admin/availability" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title="Obavijesti">
                                        <Bell size={20} />
                                        {pendingCount > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                right: '-5px',
                                                background: 'var(--primary)',
                                                color: '#fff',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                border: '2px solid #000'
                                            }}>
                                                {pendingCount}
                                            </span>
                                        )}
                                    </Link>
                                )}
                                <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="user-profile-link">
                                    {session.user?.image && (
                                        <img
                                            src={session.user.image}
                                            alt="Profile"
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    )}
                                    <span className="desktop-only" style={{
                                        color: 'var(--text-muted)',
                                        fontSize: '0.85rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100px'
                                    }}>
                                        {session.user?.name?.split(' ')[0]}
                                    </span>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}
                                    className="logout-btn"
                                    title="Odjava"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            Prijava
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    color: #fff;
                    transition: color 0.2s;
                    font-size: 0.95rem;
                    font-weight: 500;
                }
                .nav-link:hover { color: var(--primary); }
                .user-profile-link:hover span { color: var(--primary) !important; }
                .logout-btn:hover { transform: scale(1.1); }
            `}</style>
        </nav>
    );
}
