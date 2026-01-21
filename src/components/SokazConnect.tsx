"use client";

import { useState } from "react";
import { Search, Loader2, Link as LinkIcon, Check, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SokazConnect({ initialInfo }: { initialInfo?: any }) {
    const { update } = useSession();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);
    const [linkedInfo, setLinkedInfo] = useState<any>(initialInfo);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length < 3) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/sokaz/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLink = async (sokazId: string) => {
        setLinking(true);
        try {
            const res = await fetch("/api/sokaz/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sokazId })
            });
            if (res.ok) {
                const data = await res.json();
                setLinkedInfo(data);
                setResults([]);
                // Trigger NextAuth to refresh the session token with new SOKAZ info
                update();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLinking(false);
        }
    };

    if (linkedInfo?.sokazId || linkedInfo?.success) {
        return (
            <div className="sokaz-linked glass card" style={{ borderColor: 'var(--primary)', background: 'rgba(57, 255, 20, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="icon-badge primary">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>Povezan sa SOKAZ-om</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Ekipa: <strong>{linkedInfo.sokazTeam || linkedInfo.team || "Nepoznato"}</strong>
                        </p>
                        {linkedInfo.sokazStats && (
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Statistika: {linkedInfo.sokazStats}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sokaz-connect glass card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                <LinkIcon size={20} color="var(--primary)" /> Poveži SOKAZ Profil
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Poveži svoj profil s official SOKAZ bazom za automatski ulazak u tim i praćenje skora.
            </p>

            <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Tvoje ime i prezime..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingLeft: '2.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        color: '#fff'
                    }}
                />
                <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ position: 'absolute', right: '5px', top: '5px', bottom: '5px', padding: '0 1rem', fontSize: '0.8rem' }}
                    disabled={loading || query.length < 3}
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : "Traži"}
                </button>
            </form>

            <div className="results-list">
                {results.map((r) => (
                    <button
                        key={r.sokazId}
                        onClick={() => handleLink(r.sokazId)}
                        disabled={linking}
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            marginBottom: '0.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '10px',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left'
                        }}
                    >
                        <span>{r.name}</span>
                        {linking ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} color="var(--primary)" />}
                    </button>
                ))}
            </div>

            <style jsx>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .sokaz-connect { padding: 1.5rem; transition: all 0.3s; }
                .results-list button:hover { background: rgba(255,255,0,0.05); border-color: var(--primary); }
                .icon-badge { 
                    width: 48px; height: 48px; border-radius: 12px; 
                    display: flex; align-items: center; justify-content: center;
                }
                .icon-badge.primary { background: rgba(57, 255, 20, 0.1); color: var(--primary); }
            `}</style>
        </div>
    );
}
