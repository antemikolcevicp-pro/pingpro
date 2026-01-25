"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { hr } from "date-fns/locale";
import {
    Clock,
    Calendar,
    User,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Loader2,
    TrendingUp
} from "lucide-react";

export default function CoachStatsPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Filter states
    const [coachFilter, setCoachFilter] = useState("all");
    const [teamFilter, setTeamFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchReport();
    }, [currentMonth]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const monthStr = format(currentMonth, "yyyy-MM");
            const res = await fetch(`/api/admin/reports/coach-hours?month=${monthStr}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (offset: number) => {
        const next = new Date(currentMonth);
        next.setMonth(next.getMonth() + offset);
        setCurrentMonth(next);
    };

    // Filtered data calculation
    const filteredDetails = (report?.details || []).filter((item: any) => {
        const matchesCoach = coachFilter === "all" ||
            (coachFilter === "none" ? !item.coachId : item.coachId === coachFilter);
        const matchesTeam = teamFilter === "all" || item.teamName === teamFilter;
        const matchesSearch = item.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.coachName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCoach && matchesTeam && matchesSearch;
    });

    const totalHoursFiltered = filteredDetails.reduce((acc: number, curr: any) => acc + parseFloat(curr.hours), 0).toFixed(1);
    const totalSessionsFiltered = filteredDetails.length;

    // Get unique coaches and teams for filter options
    const coaches = Array.from(new Set(report?.details?.map((i: any) => JSON.stringify({ id: i.coachId, name: i.coachName })) || [])).map((s: any) => JSON.parse(s)).filter(c => c.id);
    const teams = Array.from(new Set(report?.details?.map((i: any) => i.teamName) || []));

    return (
        <div className="stats-page">
            <header className="stats-header">
                <div>
                    <h1>Izvještaj Rada 📊</h1>
                    <p>Detaljan pregled treninga i sati HSTK Velika Gorica</p>
                </div>
            </header>

            {/* MONTH SELECTOR */}
            <div className="month-nav card glass">
                <button onClick={() => changeMonth(-1)} className="nav-btn"><ChevronLeft /></button>
                <div className="current-month">
                    <Calendar size={20} color="var(--primary)" />
                    <h2>{format(currentMonth, "MMMM yyyy.", { locale: hr })}</h2>
                </div>
                <button onClick={() => changeMonth(1)} className="nav-btn"><ChevronRight /></button>
            </div>

            {loading ? (
                <div className="loading-state"><Loader2 className="animate-spin" size={48} /></div>
            ) : (
                <>
                    {/* SUMMARY CARDS */}
                    <div className="summary-grid">
                        <div className="stat-card glass border-primary">
                            <div className="icon-box"><Clock size={24} color="var(--primary)" /></div>
                            <div className="stat-info">
                                <span className="label">Filtrirano Sati</span>
                                <span className="value">{totalHoursFiltered} h</span>
                            </div>
                        </div>
                        <div className="stat-card glass border-secondary">
                            <div className="icon-box"><TrendingUp size={24} color="var(--secondary)" /></div>
                            <div className="stat-info">
                                <span className="label">Filtrirano Treninga</span>
                                <span className="value">{totalSessionsFiltered}</span>
                            </div>
                        </div>
                        <div className="stat-card glass">
                            <div className="icon-box"><BarChart3 size={24} color="#a855f7" /></div>
                            <div className="stat-info">
                                <span className="label">Prosječno trajanje</span>
                                <span className="value">{(parseFloat(totalHoursFiltered) / (totalSessionsFiltered || 1)).toFixed(1)} h</span>
                            </div>
                        </div>
                    </div>

                    {/* FILTERS BAR */}
                    <div className="filters-bar card glass">
                        <div className="filter-group">
                            <User size={16} />
                            <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)}>
                                <option value="all">Svi Treneri</option>
                                <option value="none">Bez trenera (Samo dvorana)</option>
                                {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <TrendingUp size={16} />
                            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                                <option value="all">Svi Timovi</option>
                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="search-group">
                            <input
                                type="text"
                                placeholder="Pretraži igrača..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* DETAILS TABLE */}
                    <div className="report-container card glass">
                        <div className="table-header">
                            <h3>Popis Treninga</h3>
                            <span className="count-badge">{filteredDetails.length} stavki</span>
                        </div>

                        {/* Desktop Table */}
                        <div className="table-wrapper desktop-only">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Datum</th>
                                        <th>Igrač</th>
                                        <th>Tim</th>
                                        <th>Trener</th>
                                        <th>Trajanje</th>
                                        <th>Sati</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDetails.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="bold">{format(parseISO(item.date), "dd.MM.yyyy.")} <span className="sub">{format(parseISO(item.date), "HH:mm")}h</span></td>
                                            <td>{item.playerName}</td>
                                            <td><span className="team-pill">{item.teamName}</span></td>
                                            <td>
                                                <div className="coach-cell">
                                                    <div className={`status-dot ${item.coachId ? 'active' : ''}`}></div>
                                                    {item.coachName}
                                                </div>
                                            </td>
                                            <td><span className="duration-tag">{item.durationMinutes} min</span></td>
                                            <td className="bold highlight">{item.hours}h</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="mobile-only cards-list">
                            {filteredDetails.map((item: any) => (
                                <div key={item.id} className="mobile-report-card">
                                    <div className="card-top">
                                        <span className="c-date">{format(parseISO(item.date), "dd.MM.yyyy. HH:mm")}</span>
                                        <span className="c-hours">{item.hours}h</span>
                                    </div>
                                    <div className="c-player">{item.playerName}</div>
                                    <div className="c-meta">
                                        <span className="c-team">{item.teamName}</span>
                                        <span className="c-coach">{item.coachName}</span>
                                    </div>
                                    <div className="duration-tag">{item.durationMinutes} min</div>
                                </div>
                            ))}
                        </div>

                        {filteredDetails.length === 0 && (
                            <div className="empty-state">
                                <BarChart3 size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p>Nema rezultata za odabrane filtre.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            <style jsx>{`
                .stats-page { padding: 2rem 0; animation: fadeIn 0.5s ease; }
                .stats-header { margin-bottom: 2rem; }
                .stats-header h1 { font-size: 2.2rem; margin: 0; }
                
                .month-nav { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; margin-bottom: 2rem; border-radius: 20px; }
                .current-month { display: flex; align-items: center; gap: 1rem; }
                .current-month h2 { margin: 0; text-transform: capitalize; font-size: 1.5rem; }
                .nav-btn { background: rgba(255,255,255,0.05); border: none; color: #fff; padding: 0.75rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
                .nav-btn:hover { background: var(--primary); color: #000; transform: scale(1.1); }

                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .stat-card { padding: 2rem; border-radius: 24px; display: flex; align-items: center; gap: 1.5rem; }
                .border-primary { border-left: 4px solid var(--primary); }
                .border-secondary { border-left: 4px solid var(--secondary); }
                .icon-box { background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 16px; }
                .stat-info .label { display: block; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
                .stat-info .value { font-size: 2rem; font-weight: 800; color: #fff; line-height: 1; margin-top: 0.4rem; }

                .filters-bar { padding: 1rem 1.5rem; border-radius: 20px; display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
                .filter-group { 
                    flex: 1; min-width: 180px; display: flex; align-items: center; gap: 0.75rem; 
                    background: rgba(0,0,0,0.2); padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); 
                }
                .filter-group select { background: none; border: none; color: #fff; width: 100%; outline: none; font-size: 0.9rem; cursor: pointer; }
                .search-group { flex: 1.5; min-width: 250px; }
                .search-group input { 
                    width: 100%; padding: 0.6rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); 
                    background: rgba(0,0,0,0.2); color: #fff; outline: none; transition: 0.2s;
                }
                .search-group input:focus { border-color: var(--primary); background: rgba(0,0,0,0.4); }

                .report-container { border-radius: 28px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
                .table-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; }
                .table-header h3 { margin: 0; font-size: 1.2rem; }
                .count-badge { background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }

                .report-table { width: 100%; border-collapse: collapse; }
                .report-table th { padding: 1.25rem 1.5rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); background: rgba(0,0,0,0.1); font-weight: 800; }
                .report-table td { padding: 1.1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.95rem; }
                .report-table tr:hover { background: rgba(255,255,255,0.015); }
                .bold { font-weight: 700; color: #fff; }
                .bold .sub { font-weight: 400; color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem; }
                .highlight { color: var(--primary); }
                .duration-tag { display: inline-block; background: rgba(168, 85, 247, 0.1); color: #a855f7; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; border: 1px solid rgba(168, 85, 247, 0.2); }
                .team-pill { background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; color: #eee; font-weight: 600; }
                
                .coach-cell { display: flex; align-items: center; gap: 0.75rem; }
                .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #555; }
                .status-dot.active { background: #a855f7; box-shadow: 0 0 10px #a855f7; }

                .loading-state { display: flex; justify-content: center; padding: 10rem; color: var(--primary); }
                .empty-state { display: flex; flex-direction: column; align-items: center; padding: 5rem 0; color: var(--text-muted); }

                .mobile-only { display: none; }
                .mobile-report-card { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 0.75rem; }
                .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
                .c-date { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); }
                .c-hours { font-size: 1.2rem; font-weight: 950; color: var(--primary); }
                .c-player { font-size: 1.1rem; font-weight: 700; color: #fff; }
                .c-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .c-team { font-size: 0.75rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
                .c-coach { font-size: 0.75rem; color: #a855f7; font-weight: 700; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 950px) {
                    .desktop-only { display: none; }
                    .mobile-only { display: block; }
                    .filters-bar { padding: 1rem; }
                    .search-group { order: -1; width: 100%; flex: none; }
                }
                
                @media (max-width: 600px) {
                    .stats-header h1 { font-size: 1.8rem; }
                    .summary-grid { grid-template-columns: 1fr; }
                    .stat-info .value { font-size: 1.6rem; }
                }
            `}</style>
        </div>
    );
}
