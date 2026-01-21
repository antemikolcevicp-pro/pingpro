"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Shield, Calendar, Loader2 } from "lucide-react";

export default function TeamsPage() {
    const { data: session } = useSession();
    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [teamName, setTeamName] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        const res = await fetch("/api/teams");
        const data = await res.json();
        setTeam(data);
        setLoading(false);
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'CREATE', name: teamName })
        });
        if (res.ok) fetchTeam();
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'JOIN', inviteCode })
        });
        if (res.ok) fetchTeam();
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '10rem' }}><Loader2 className="animate-spin" /></div>;

    return (
        <div style={{ padding: '2rem 0' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="gradient-text">Moj Tim</h1>
                <p style={{ color: 'var(--text-muted)' }}>Povežite se sa svojim suigračima.</p>
            </header>

            {!team ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                    <div className="card glass">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserPlus color="var(--primary)" /> Stvori Novi Tim
                        </h3>
                        <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Ime tima"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--accent)', color: '#fff', border: '1px solid var(--border)' }}
                                required
                            />
                            <button type="submit" className="btn btn-primary">Stvori Tim</button>
                        </form>
                    </div>

                    <div className="card glass">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield color="var(--secondary)" /> Pridruži se Timu
                        </h3>
                        <form onSubmit={handleJoinTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Pozivni kod"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--accent)', color: '#fff', border: '1px solid var(--border)' }}
                                required
                            />
                            <button type="submit" className="btn btn-secondary">Pridruži se</button>
                        </form>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    <aside>
                        <div className="card glass">
                            <h2 style={{ marginBottom: '0.5rem' }}>{team.name}</h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Pozivni kod: <code style={{ color: 'var(--primary)', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{team.inviteCode}</code>
                            </p>

                            <h4 style={{ marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>Članovi ({team.members.length})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {team.members.map((member: any) => (
                                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyItems: 'center', overflow: 'hidden' }}>
                                            {member.image ? <img src={member.image} alt="" style={{ width: '100%' }} /> : <Users size={16} style={{ margin: 'auto' }} />}
                                        </div>
                                        <span>{member.name}</span>
                                        {member.id === team.coachId && <Shield size={14} color="var(--primary)" title="Coach" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <main>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={24} color="var(--primary)" /> Nadolazeći Treningi Tima
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {team.members.flatMap((m: any) => m.bookings).length === 0 && (
                                <div className="card glass" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    Nema nadolazećih treninga u timu.
                                </div>
                            )}
                            {team.members.flatMap((m: any) => m.bookings.map((b: any) => ({ ...b, userName: m.name })))
                                .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                                .map((booking: any) => (
                                    <div key={booking.id} className="card glass" style={{ borderLeft: '4px solid var(--secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <strong>{booking.userName}</strong>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    {new Date(booking.startDateTime).toLocaleDateString('hr-HR')} @ {new Date(booking.startDateTime).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>REZERVIRANO</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </main>
                </div>
            )}

            <style jsx>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
