import Link from "next/link";
import { ChevronRight, Calendar, Users, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div style={{ padding: '4rem 0' }}>
      <section style={{ textAlign: 'center', marginBottom: '6rem' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', fontWeight: 900 }}>
          Postani <span className="gradient-text">Pro</span> u Stolnom Tenisu
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          Rezervirajte privatne treninge, pratite napredak svog tima i unaprijedite svoju igru s vrhunskim trenerima.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary">
            Započni Rezervaciju <ChevronRight size={20} />
          </Link>
          <Link href="/info" className="btn glass">
            Saznaj Više
          </Link>
        </div>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        <div className="card glass">
          <Calendar size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h3>Jednostavna Rezervacija</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Pregledan kalendar s dostupnim terminima. Rezervirajte svoj termin u par klikova.
          </p>
        </div>

        <div className="card glass">
          <Users size={32} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
          <h3>Timski Duh</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Pratite schedule svojih suigrača i koordinirajte zajedničke treninge.
          </p>
        </div>

        <div className="card glass">
          <Trophy size={32} color="#ffd700" style={{ marginBottom: '1rem' }} />
          <h3>Vrhunski Treneri</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Učite od najboljih uz personalizirani pristup svakom igraču.
          </p>
        </div>
      </section>

      <footer style={{ marginTop: '8rem', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', padding: '2rem 0' }}>
        <p>&copy; 2026 PingPro Booking. Sva prava pridržana.</p>
      </footer>
    </div>
  );
}
