"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Users,
    UserPlus,
    Trash2,
    Shield,
    ShieldCheck,
    User,
    Search,
    Loader2,
    MoreVertical,
    Check,
    X,
    UserCircle
} from "lucide-react";

export default function UserManagement() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTeams(data.teams);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (userId: string, data: any) => {
        setUpdating(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, ...data })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
                // If team name changed, we'd need to re-fetch or find in teams list
                if (data.teamId) {
                    const selectedTeam = teams.find(t => t.id === data.teamId);
                    setUsers(prev => prev.map(u => u.id === userId ? { ...u, team: selectedTeam || null } : u));
                }
            }
        } catch (error) {
            alert("Greška pri ažuriranju.");
        } finally {
            setUpdating(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Sigurno želite obrisati ovog korisnika? Ova akcija je nepovratna.")) return;

        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                const msg = await res.text();
                alert(msg);
            }
        } catch (error) {
            alert("Greška pri brisanju.");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="users-page">
            <header className="page-header">
                <div>
                    <h1>Upravljanje Korisnicima 👥</h1>
                    <p>Mijenjaj uloge, timove i upravljaj bazu korisnika.</p>
                </div>
            </header>

            {/* SEARCH & STATS */}
            <div className="top-bar glass">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        placeholder="Traži po imenu ili emailu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="stats">
                    <span>Ukupno: <strong>{users.length}</strong></span>
                    <span>Admini: <strong>{users.filter(u => u.role === 'ADMIN').length}</strong></span>
                </div>
            </div>

            {loading ? (
                <div className="loader-container">
                    <Loader2 className="animate-spin" size={48} />
                    <p>Učitavam korisnike...</p>
                </div>
            ) : (
                <div className="users-grid">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="user-card glass card">
                            <div className="user-header">
                                <div className="avatar">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} />
                                    ) : (
                                        <UserCircle size={40} />
                                    )}
                                </div>
                                <div className="user-basic">
                                    <h3>{user.name || "Nema imena"}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span className="email">{user.email}</span>
                                        {user.phoneNumber && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500' }}>
                                                {user.phoneNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {updating === user.id && <Loader2 className="animate-spin" size={16} />}
                            </div>

                            <div className="user-settings">
                                <div className="setting-group">
                                    <label>Rola</label>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleUpdate(user.id, { role: e.target.value })}
                                        className={`role-select ${user.role}`}
                                        /* @ts-ignore */
                                        disabled={user.role === 'ADMIN' && session?.user?.role === 'COACH'}
                                    >
                                        <option value="PLAYER">IGRAČ (Player)</option>
                                        <option value="COACH">TRENER (Coach)</option>
                                        {/* @ts-ignore */}
                                        {session?.user?.role === 'ADMIN' && (
                                            <option value="ADMIN">ADMINISTRATOR</option>
                                        )}
                                    </select>
                                </div>

                                <div className="setting-group">
                                    <label>Tim</label>
                                    <select
                                        value={user.teamId || "none"}
                                        onChange={(e) => handleUpdate(user.id, { teamId: e.target.value })}
                                    >
                                        <option value="none">Bez tima</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="user-footer">
                                <span className="date">Pristupio: {new Date(user.createdAt).toLocaleDateString('hr-HR')}</span>
                                <button
                                    className="trash-btn"
                                    onClick={() => handleDelete(user.id)}
                                    /* @ts-ignore */
                                    disabled={user.role === 'ADMIN' && session?.user?.role === 'COACH'}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .users-page { padding: 2rem 0; animation: fadeIn 0.5s ease; }
                .page-header { margin-bottom: 2rem; }
                .page-header h1 { font-size: 2.2rem; margin: 0; }
                
                .top-bar { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 1rem 2rem; border-radius: 20px; margin-bottom: 2rem;
                }
                .search-box { display: flex; align-items: center; gap: 1rem; flex: 1; max-width: 400px; }
                .search-box input { 
                    background: none; border: none; color: #fff; width: 100%; font-size: 1rem; outline: none;
                }
                .stats { display: flex; gap: 2rem; color: var(--text-muted); font-size: 0.9rem; }
                .stats strong { color: var(--primary); }

                .users-grid { 
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
                    gap: 1.5rem; 
                }
                .user-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                
                .user-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
                .avatar { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
                .avatar img { width: 100%; height: 100%; object-fit: cover; }
                .user-basic h3 { margin: 0; font-size: 1.1rem; }
                .email { font-size: 0.8rem; color: var(--text-muted); }

                .user-settings { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .setting-group label { display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 1px; }
                .setting-group select { 
                    width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); 
                    color: #fff; padding: 0.6rem; border-radius: 10px; font-size: 0.85rem; cursor: pointer;
                }
                .role-select.ADMIN { border-color: var(--primary); color: var(--primary); }
                .role-select.COACH { border-color: var(--secondary); color: var(--secondary); }

                .user-footer { 
                    display: flex; justify-content: space-between; align-items: center; 
                    border-top: 1px solid rgba(255,255,255,0.05); pt: 1rem; padding-top: 1rem;
                }
                .date { font-size: 0.75rem; color: var(--text-muted); }
                .trash-btn { 
                    background: rgba(255,68,68,0.1); color: #ff4444; border: none; 
                    padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
                }
                .trash-btn:hover { background: #ff4444; color: #fff; transform: scale(1.1); }

                .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10rem; color: var(--primary); gap: 1rem; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                @media (max-width: 700px) {
                    .top-bar { flex-direction: column; gap: 1rem; align-items: flex-start; }
                    .users-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
