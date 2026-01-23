"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, Shield, Save, Loader2, ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            // @ts-ignore
            setPhoneNumber(session.user.phoneNumber || "");
        }
    }, [session]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phoneNumber }),
            });

            if (res.ok) {
                await update({ name, phoneNumber });
                setMessage({ type: "success", text: "Profil uspješno spremljen!" });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            } else {
                setMessage({ type: "error", text: "Greška pri spremanju profila." });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Došlo je do greške." });
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '10rem' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="profile-page container" style={{ maxWidth: '800px', padding: '2rem 0' }}>
            <Link href="/dashboard" className="nav-link" style={{ marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <ArrowLeft size={18} /> Povratak na Dashboard
            </Link>

            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Moj Profil 👤</h1>
                <p style={{ color: 'var(--text-muted)' }}>Upravljaj svojim osobnim podacima i postavkama računa.</p>
            </header>

            <div className="grid-responsive" style={{ gap: '2rem' }}>
                {/* LEFT SIDE - AVATAR & INFO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card glass" style={{ textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                            {session.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={48} color="var(--primary)" />
                                </div>
                            )}
                        </div>
                        <h2 style={{ marginBottom: '0.25rem' }}>{session.user?.name}</h2>
                        <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            {/* @ts-ignore */}
                            {session.user?.role || "Player"}
                        </span>

                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <Mail size={16} /> <span>{session.user?.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <Shield size={16} /> <span>Verificiran račun</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - EDIT FORM */}
                <div style={{ flex: 1 }}>
                    <form onSubmit={handleSave} className="card glass" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Postavke Profila</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ime i prezime</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Broj mobitela</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Phone size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                </div>
                            </div>

                            {message.text && (
                                <div className={`badge ${message.type === 'success' ? 'badge-primary' : ''}`} style={{ padding: '1rem', width: '100%', textAlign: 'center', background: message.type === 'success' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,0,0,0.1)', color: message.type === 'success' ? 'var(--primary)' : '#ff4444' }}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ width: '100%', marginTop: '1rem', gap: '0.5rem' }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Spremi promjene</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .grid-responsive { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
