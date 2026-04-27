import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentos legales',
  description: 'Privacidad, términos y cookies de TuAsesor.',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="editorial-body min-h-screen font-body selection:bg-oxblood selection:text-paper">
      <header className="border-b border-ink/15 bg-paper/95">
        <div className="max-w-[900px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/landing" className="font-brand text-[18px] text-ink" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            TuAsesor
          </Link>
          <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-editorial text-ink-muted">
            <Link href="/legal/privacidad" className="editorial-link">Privacidad</Link>
            <Link href="/legal/terminos" className="editorial-link">Términos</Link>
            <Link href="/legal/cookies" className="editorial-link">Cookies</Link>
            <Link href="/status" className="editorial-link">Estado</Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-ink/15 bg-paper">
        <div className="max-w-[900px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
            © 2026 TuAsesor · Buenos Aires
          </div>
          <Link href="/landing" className="editorial-link font-mono text-[11px] uppercase tracking-editorial text-oxblood">
            ← Volver a la portada
          </Link>
        </div>
      </footer>
    </div>
  );
}
