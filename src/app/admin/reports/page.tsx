"use client";

import { useState, useEffect } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { hr } from "date-fns/locale";
import {
    Clock,
    Calendar,
    User,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Loader2,
    TrendingUp,
    Download
} from "lucide-react";

export default function CoachStatsPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

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

    return (
        <div className="stats-page">
            <header className="stats-header">
                <div>
                    <h1>Izvještaj Rada Trenera 📊</h1>
                    <p>Pregled odrađenih sati i treninga po mjesecima.</p>
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
                                <span className="label">Ukupno Sati</span>
                                <span className="value">{report?.totalHours} h</span>
                            </div>
                        </div>
                        <div className="stat-card glass border-secondary">
                            <div className="icon-box"><TrendingUp size={24} color="var(--secondary)" /></div>
                            <div className="stat-info">
                                <span className="label">Broj Treninga</span>
                                <span className="value">{report?.totalSessions}</span>
                            </div>
                        </div>
                        <div className="stat-card glass">
                            <div className="icon-box"><User size={24} /></div>
                            <div className="stat-info">
                                <span className="label">Prosječno trajanje</span>
                                <span className="value">{(report?.totalHours / (report?.totalSessions || 1)).toFixed(1)} h</span>
                            </div>
                        </div>
                    </div>

                    {/* DETAILS TABLE */}
                    <div className="report-container card glass">
                        <div className="table-header">
                            <h3>Detaljan Ispis Termina</h3>
                        </div>
                        <div className="table-scroll">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Datum</th>
                                        <th>Igrač</th>
                                        <th>Trener</th>
                                        <th>Početak</th>
                                        <th>Trajanje</th>
                                        <th>Sati</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report?.details.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="bold">{format(parseISO(item.date), "dd.MM.yyyy.")}</td>
                                            <td>{item.playerName}</td>
                                            <td>{item.coachName}</td>
                                            <td>{format(parseISO(item.date), "HH:mm")}h</td>
                                            <td><span className="duration-tag">{item.durationMinutes} min</span></td>
                                            <td className="bold highlight">{item.hours}h</td>
                                        </tr>
                                    ))}
                                    {report?.details.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="empty-row">Nema podataka za ovaj mjesec.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                .nav-btn { background: rgba(57, 255, 20, 0.1); border: none; color: var(--primary); padding: 0.75rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
                .nav-btn:hover { background: var(--primary); color: #000; transform: scale(1.1); }

                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
                .stat-card { padding: 2rem; border-radius: 24px; display: flex; align-items: center; gap: 1.5rem; }
                .border-primary { border-left: 4px solid var(--primary); }
                .border-secondary { border-left: 4px solid var(--secondary); }
                .icon-box { background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 16px; }
                .stat-info .label { display: block; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
                .stat-info .value { font-size: 2rem; font-weight: 800; color: #fff; line-height: 1; margin-top: 0.4rem; }

                .report-container { padding: 0; overflow: hidden; border-radius: 24px; }
                .table-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); }
                .report-table { width: 100%; border-collapse: collapse; text-align: left; }
                .report-table th { padding: 1.25rem 2.25rem; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); background: rgba(0,0,0,0.2); }
                .report-table td { padding: 1.25rem 2.25rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 1rem; }
                .report-table tr:hover { background: rgba(255,255,255,0.02); }
                .bold { font-weight: 700; color: #fff; }
                .highlight { color: var(--primary); }
                .duration-tag { background: rgba(255,126,33,0.1); color: var(--secondary); padding: 4px 8px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
                
                .loading-state { display: flex; justify-content: center; padding: 10rem; color: var(--primary); }
                .empty-row { text-align: center; color: var(--text-muted); padding: 4rem !important; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 800px) {
                    .stats-header h1 { font-size: 1.8rem; }
                    .month-nav { padding: 0.75rem 1rem; }
                    .current-month h2 { font-size: 1.2rem; }
                    .stat-card { padding: 1.25rem; }
                    .stat-info .value { font-size: 1.5rem; }
                    
                    .report-table th, .report-table td { padding: 1rem; font-size: 0.9rem; }
                    .report-table th:nth-child(4), .report-table td:nth-child(4) { display: none; }
                }
                @media (max-width: 500px) {
                    .report-table th:nth-child(2), .report-table td:nth-child(2) { display: none; }
                }
            `}</style>
        </div>
    );
}
