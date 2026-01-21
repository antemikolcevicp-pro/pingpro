import BookingCalendar from "@/components/BookingCalendar";

export default function BookingPage() {
    return (
        <div style={{ padding: '2rem 0' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem' }}>Rezervacija Treninga</h1>
                <p style={{ color: 'var(--text-muted)' }}>Odaberite datum i slobodan termin za vaš sljedeći trening.</p>
            </header>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <BookingCalendar />
            </div>

            <section style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(57, 255, 20, 0.05)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Informacije:</h3>
                <ul style={{ color: 'var(--text-muted)', listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '0.5rem' }}>• Trajanje treninga: 60, 90 ili 120 min</li>
                    <li style={{ marginBottom: '0.5rem' }}>
                        • Lokacija:
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=45.72000335406738,16.072960801695174"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--secondary)', textDecoration: 'underline', marginLeft: '0.5rem' }}
                        >
                            Stolnoteniska Dvorana Bakarić, Ul. kralja Stjepana Tomaševića 21, 10410, Velika Gorica
                        </a>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>• Otkazivanje: Do 4 sata prije termina</li>
                </ul>
            </section>
        </div>
    );
}
