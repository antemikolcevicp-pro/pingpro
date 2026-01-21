"use client";

import { useState, useEffect } from "react";
import { Trophy, Calendar, ExternalLink, Loader2, AlertCircle } from "lucide-react";

export default function SokazResults() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/sokaz/results")
            .then(res => {
                if (!res.ok) throw new Error("Neuspješno dohvaćanje rezultata.");
                return res.json();
            })
            .then(data => {
                setResults(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="card glass flex-center" style={{ padding: '3rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
    );

    if (error) return (
        <div className="card glass" style={{ padding: '2rem', textAlign: 'center', color: '#ff4444' }}>
            <AlertCircle size={32} style={{ marginBottom: '1rem' }} />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="sokaz-results-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '450px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
        }}>
            {results.map((match, idx) => (
                <div key={idx} className="match-card card glass" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', opacity: 0.8 }}>
                        {match.round}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: '500' }}>{match.home}</div>
                        <div style={{
                            padding: '0 1.5rem',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: match.score === 'Nije odigrano' ? 'var(--text-muted)' : '#fff'
                        }}>
                            {match.score === 'Nije odigrano' ? 'vs' : match.score}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: '500' }}>{match.away}</div>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <a
                            href={match.reportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn glass"
                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', gap: '0.4rem' }}
                        >
                            <ExternalLink size={14} /> Zapisnik
                        </a>
                    </div>
                </div>
            ))}

            {results.length === 0 && (
                <div className="card glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nema pronađenih mečeva za tvoj tim u ovoj sezoni.
                </div>
            )}

            <style jsx>{`
                .match-card { border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s; }
                .match-card:hover { transform: scale(1.02); border-color: rgba(57, 255, 20, 0.2); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .flex-center { display: flex; align-items: center; justify-content: center; }
                .sokaz-results-list::-webkit-scrollbar { width: 4px; }
                .sokaz-results-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                .sokaz-results-list::-webkit-scrollbar-thumb { background: rgba(57, 255, 20, 0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}
