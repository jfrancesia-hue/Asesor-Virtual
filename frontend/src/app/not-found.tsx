import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="dashboard-bg min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-[var(--text-strong)]">
          Esta página{' '}
          <span className="gradient-text">no existe</span>.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-medium)]">
          El recurso que buscás puede haberse movido o nunca existió. Volvé a la portada para empezar de nuevo.
        </p>
        <Link
          href="/landing"
          className="magnetic-btn inline-flex items-center gap-2 mt-8 rounded-2xl bg-[var(--cta)] px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_rgba(230,126,34,0.4)] hover:bg-[var(--cta-dark)] transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
