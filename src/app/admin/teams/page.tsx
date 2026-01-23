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
    const [viewingTeam, setViewingTeam] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [filterLeague, setFilterLeague] = useState<string>("ALL");

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

    const fetchMembers = async (teamId: string) => {
        setLoadingMembers(true);
        try {
            const res = await fetch(`/api/admin/teams/${teamId}`);
            if (res.ok) {
                const data = await res.json();
                setViewingTeam(data);
                setTeamMembers(data.members || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMembers(false);
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
                if (viewingTeam?.id === teamId) setViewingTeam(null);
            }
        } catch (error) {
            alert("Greška pri brisanju.");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Ukloniti igrača iz tima?")) return;
        try {
            const res = await fetch(`/api/admin/teams/${viewingTeam.id}?userId=${userId}`, { method: "DELETE" });
            if (res.ok) {
                setTeamMembers(prev => prev.filter(m => m.id !== userId));
                fetchTeams(); // Refresh counts
            }
        } catch (error) {
            alert("Greška.");
        }
    };

    const filteredTeams = teams.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
        const matchesLeague = filterLeague === "ALL" || t.league === filterLeague;
        return matchesSearch && matchesLeague;
    });

    const uniqueLeagues = Array.from(new Set(teams.map(t => t.league).filter(Boolean)));

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
                        <div className="search-input">
                            <Search size={20} />
                            <input
                                placeholder="Pretraži timove..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="league-filter"
                            value={filterLeague}
                            onChange={(e) => setFilterLeague(e.target.value)}
                        >
                            <option value="ALL">Sve lige</option>
                            {uniqueLeagues.map(l => (
                                <option key={l as string} value={l as string}>{l as string}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="loader-container">
                            <Loader2 className="animate-spin" size={48} />
                        </div>
                    ) : (
                        <div className="teams-grid">
                            {filteredTeams.map(team => (
                                <div key={team.id} className="team-card card glass" onClick={() => fetchMembers(team.id)}>
                                    <div className="team-info">
                                        <div className="team-head">
                                            <h3>{team.name}</h3>
                                            <div className="badge">
                                                <Users size={14} /> {team._count?.members || 0} članova
                                            </div>
                                            {team.league && <span className="league-badge">{team.league}</span>}
                                        </div>
                                        <div className="invite-info">
                                            <Hash size={14} /> Kod: <span>{team.inviteCode}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="del-btn"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(team.id); }}
                                    >
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

            {/* MEMBER DETAILS MODAL */}
            {viewingTeam && (
                <div className="modal-overlay" onClick={() => setViewingTeam(null)}>
                    <div className="modal-content glass card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{viewingTeam.name} <span className="highlight">Članovi</span></h2>
                            <button className="close-btn" onClick={() => setViewingTeam(null)}>Zapravo, zatvori</button>
                        </div>

                        {loadingMembers ? (
                            <div className="loader-container"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="members-list">
                                {teamMembers.map(m => (
                                    <div key={m.id} className="member-row">
                                        <div className="member-info">
                                            <UserCircle size={24} />
                                            <div>
                                                <strong>{m.name}</strong>
                                                <div className="sub-text">{m.email} {m.sokazTeam ? `(${m.sokazTeam})` : ''}</div>
                                            </div>
                                        </div>
                                        <button className="remove-btn" onClick={() => handleRemoveMember(m.id)}>
                                            Izbaci
                                        </button>
                                    </div>
                                ))}
                                {teamMembers.length === 0 && <p className="empty-text">Nema članova u ovom timu.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}

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

                .search-bar { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; border-radius: 15px; flex-wrap: wrap; }
                .search-input { display: flex; align-items: center; gap: 1rem; flex: 1; }
                .search-bar input { background: none; border: none; color: #fff; width: 100%; outline: none; font-size: 1rem; }
                .league-filter { padding: 0.5rem; border-radius: 8px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); outline: none; }

                .teams-grid { display: flex; flex-direction: column; gap: 1rem; }
                .team-card { 
                    padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; 
                    transition: all 0.2s; cursor: pointer;
                }
                .team-card:hover { border-color: var(--primary); transform: translateX(5px); background: rgba(255,255,255,0.05); }
                
                .team-info { display: flex; flex-direction: column; gap: 0.5rem; }
                .team-head { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
                .team-head h3 { margin: 0; font-size: 1.2rem; }
                .badge { 
                    background: rgba(57, 255, 20, 0.1); color: var(--primary); 
                    padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; 
                    display: flex; align-items: center; gap: 0.4rem; font-weight: 600;
                }
                .league-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,165,0,0.15); color: #ffa500; border: 1px solid rgba(255,165,0,0.3); }

                .invite-info { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; }
                .invite-info span { color: var(--secondary); font-family: monospace; font-size: 1rem; }

                .del-btn { 
                    background: rgba(255,68,68,0.1); color: #ff4444; border: none; 
                    padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s; z-index: 10;
                }
                .del-btn:hover { background: #ff4444; color: #fff; transform: scale(1.1); }

                /* MODAL */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(5px); }
                .modal-content { width: 100%; max-width: 600px; padding: 2rem; max-height: 80vh; overflow-y: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .highlight { color: var(--primary); margin-left: 8px; }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline; }
                
                .members-list { display: flex; flex-direction: column; gap: 1rem; }
                .member-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .member-info { display: flex; align-items: center; gap: 1rem; }
                .sub-text { font-size: 0.8rem; color: var(--text-muted); }
                .remove-btn { background: rgba(255,68,68,0.1); color: #ff4444; border: 1px solid rgba(255,68,68,0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
                .remove-btn:hover { background: #ff4444; color: #fff; }
                .empty-text { text-align: center; color: var(--text-muted); padding: 2rem; }

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
