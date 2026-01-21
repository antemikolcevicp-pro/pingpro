"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Users,
    Plus,
    Trash2,
    Shield,
    Loader2,
    Search,
    Hash,
    UserCircle
} from "lucide-react";

export default function AdminTeamsPage() {
    const { data: session } = useSession();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [newTeamName, setNewTeamName] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/teams");
            if (res.ok) {
                const data = await res.json();
                setTeams(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch("/api/admin/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTeamName })
            });

            if (res.ok) {
                setNewTeamName("");
                fetchTeams();
            }
        } catch (error) {
            alert("Greška pri stvaranju tima.");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (teamId: string) => {
        if (!confirm("Sigurno želite obrisati ovaj tim? Svi članovi će biti uklonjeni iz tima.")) return;

        try {
            const res = await fetch(`/api/admin/teams?id=${teamId}`, { method: "DELETE" });
            if (res.ok) {
                setTeams(prev => prev.filter(t => t.id !== teamId));
            }
        } catch (error) {
            alert("Greška pri brisanju.");
        }
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="admin-teams">
            <header className="page-header">
                <div>
                    <h1>Upravljanje Timovima 🏆</h1>
                    <p>Stvori, obriši ili pregledaj sve timove u bazi.</p>
                </div>
            </header>

            <div className="management-grid">
                {/* CREATE TEAM */}
                <div className="create-box card glass">
                    <h3><Plus size={20} /> Novi Tim</h3>
                    <form onSubmit={handleCreate}>
                        <input
                            placeholder="Ime novog tima..."
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={creating}>
                            {creating ? <Loader2 className="animate-spin" size={18} /> : "Stvori Tim"}
                        </button>
                    </form>
                </div>

                {/* SEARCH & LIST */}
                <div className="list-box">
                    <div className="search-bar glass card">
                        <Search size={20} />
                        <input
                            placeholder="Pretraži timove..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="loader-container">
                            <Loader2 className="animate-spin" size={48} />
                        </div>
                    ) : (
                        <div className="teams-grid">
                            {filteredTeams.map(team => (
                                <div key={team.id} className="team-card card glass">
                                    <div className="team-info">
                                        <div className="team-head">
                                            <h3>{team.name}</h3>
                                            <div className="badge">
                                                <Users size={14} /> {team._count.members} članova
                                            </div>
                                        </div>
                                        <div className="invite-info">
                                            <Hash size={14} /> Kod: <span>{team.inviteCode}</span>
                                        </div>
                                        {team.coach && (
                                            <div className="coach-info">
                                                <Shield size={14} color={team.coach.role === 'ADMIN' ? '#ff4444' : 'var(--primary)'} />
                                                <span>{team.coach.role === 'ADMIN' ? 'Admin' : 'Trener'}: <strong>{team.coach.name}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                    <button className="del-btn" onClick={() => handleDelete(team.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {filteredTeams.length === 0 && (
                                <div className="empty-state">Nema pronađenih timova.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .admin-teams { padding: 2rem 0; animation: fadeIn 0.5s ease; }
                .page-header { margin-bottom: 2.5rem; }
                .page-header h1 { font-size: 2.2rem; margin: 0; }

                .management-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; align-items: start; }

                .create-box { padding: 2rem; position: sticky; top: 100px; }
                .create-box h3 { margin-top: 0; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
                .create-box form { display: flex; flexDirection: column; gap: 1rem; }
                .create-box input { 
                    padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border); 
                    border-radius: 12px; color: #fff; font-size: 1rem;
                }

                .search-bar { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; border-radius: 15px; }
                .search-bar input { background: none; border: none; color: #fff; width: 100%; outline: none; font-size: 1rem; }

                .teams-grid { display: flex; flex-direction: column; gap: 1rem; }
                .team-card { 
                    padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; 
                    transition: all 0.2s;
                }
                .team-card:hover { border-color: var(--primary); transform: translateX(5px); }
                
                .team-info { display: flex; flex-direction: column; gap: 0.5rem; }
                .team-head { display: flex; align-items: center; gap: 1rem; }
                .team-head h3 { margin: 0; font-size: 1.2rem; }
                .badge { 
                    background: rgba(57, 255, 20, 0.1); color: var(--primary); 
                    padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; 
                    display: flex; align-items: center; gap: 0.4rem; font-weight: 600;
                }
                .invite-info { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; }
                .invite-info span { color: var(--secondary); font-family: monospace; font-size: 1rem; }
                .coach-info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem; }
                .coach-info strong { color: #fff; }

                .del-btn { 
                    background: rgba(255,68,68,0.1); color: #ff4444; border: none; 
                    padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s;
                }
                .del-btn:hover { background: #ff4444; color: #fff; transform: scale(1.1); }

                .empty-state { text-align: center; padding: 5rem; color: var(--text-muted); }
                .loader-container { padding: 5rem; display: flex; justify-content: center; color: var(--primary); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                @media (max-width: 900px) {
                    .management-grid { grid-template-columns: 1fr; }
                    .create-box { position: static; }
                }
            `}</style>
        </div>
    );
}
