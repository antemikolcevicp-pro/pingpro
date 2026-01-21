"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
    const { data: session, status, update } = useSession();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // If user already has a phone number, send them to dashboard
        // @ts-ignore
        if (session?.user?.phoneNumber) {
            router.push("/dashboard");
        }
    }, [session, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber }),
            });

            if (res.ok) {
                // Update the session client side
                await update({ phoneNumber });
                router.push("/dashboard");
            } else {
                alert("Neuspješno spremanje broja. Pokušajte ponovno.");
            }
        } catch (error) {
            console.error(error);
            alert("Došlo je do greške.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return <div className="container" style={{ textAlign: 'center', padding: '10rem' }}><Loader2 className="animate-spin" size={48} /></div>;

    return (
        <div className="container" style={{ maxWidth: '500px', padding: '6rem 0' }}>
            <div className="card glass" style={{ textAlign: 'center' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'rgba(57, 255, 20, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <Phone size={32} color="var(--primary)" />
                </div>

                <h1 style={{ marginBottom: '1rem' }}>Još samo korak!</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
                    Unesite svoj broj mobitela kako bismo vam mogli poslati WhatsApp podsjetnike za vaše termine.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="tel"
                            placeholder="+385 9x xxx xxxx"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'rgba(0,0,0,0.3)',
                                color: '#fff',
                                fontSize: '1.1rem'
                            }}
                        />
                        <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', gap: '0.5rem' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Završi Registraciju <ArrowRight size={20} /></>}
                    </button>
                </form>
            </div>

            <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
