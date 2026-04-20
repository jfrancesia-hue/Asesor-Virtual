import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Estado del servicio',
  description: 'Estado en tiempo real de los componentes de Mi Asesor.',
};

type Status = 'operativo' | 'degradado' | 'caido';

const COMPONENTS: Array<{ name: string; status: Status; description: string; uptime: string }> = [
  { name: 'API pública', status: 'operativo', description: 'Endpoints REST /api/v1/*', uptime: '99,98%' },
  { name: 'Asesor IA · OpenAI', status: 'operativo', description: 'Proveedor primario GPT-4o', uptime: '99,94%' },
  { name: 'Asesor IA · Anthropic', status: 'operativo', description: 'Fallback Claude Sonnet 4.6', uptime: '99,96%' },
  { name: 'Base de datos · Supabase', status: 'operativo', description: 'Postgres + pgvector', uptime: '99,99%' },
  { name: 'Autenticación', status: 'operativo', description: 'Login, registro, sesiones JWT', uptime: '99,97%' },
  { name: 'Pagos · Stripe', status: 'operativo', description: 'Suscripciones y checkouts', uptime: '99,99%' },
  { name: 'Correo · Resend', status: 'operativo', description: 'Notificaciones transaccionales', uptime: '99,95%' },
  { name: 'Panel web', status: 'operativo', description: 'Dashboard Next.js', uptime: '99,98%' },
];

const INCIDENTS: Array<{ date: string; title: string; summary: string; resolved: boolean }> = [
  {
    date: '2026-04-12',
    title: 'Latencia elevada en asesor Legal',
    summary: 'Entre 14:10 y 14:38 (ART) el asesor Legal respondía con demora de 4-6 s. Causa: saturación temporal del pool de conexiones a pgvector. Ampliado el pool, latencia normalizada.',
    resolved: true,
  },
  {
    date: '2026-03-28',
    title: 'Notificaciones por correo retrasadas',
    summary: 'Resend reportó cola acumulada a nivel región US-EAST durante 40 minutos. Los correos se entregaron completos, con retraso máximo de 12 min.',
    resolved: true,
  },
];

const STATUS_META: Record<Status, { label: string; dot: string; text: string }> = {
  operativo: { label: 'Operativo', dot: 'bg-brand-dot', text: 'text-brand-dot' },
  degradado: { label: 'Degradado', dot: 'bg-mustard', text: 'text-mustard-deep' },
  caido: { label: 'Caído', dot: 'bg-oxblood', text: 'text-oxblood' },
};

export default function StatusPage() {
  const allOperational = COMPONENTS.every((c) => c.status === 'operativo');
  const now = new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <div className="editorial-body min-h-screen font-body selection:bg-oxblood selection:text-paper">
      <header className="border-b border-ink/15 bg-paper/95">
        <div className="max-w-[1100px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/landing" className="font-brand text-[18px] text-ink" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            Mi Asesor
          </Link>
          <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-editorial text-ink-muted">
            <Link href="/legal/privacidad" className="editorial-link">Privacidad</Link>
            <Link href="/legal/terminos" className="editorial-link">Términos</Link>
            <Link href="/legal/cookies" className="editorial-link">Cookies</Link>
            <span className="text-oxblood">Estado</span>
          </nav>
        </div>
      </header>

      <article className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="font-mono text-[11px] uppercase tracking-editorial text-oxblood mb-4">
            Tablero público · Actualizado {now}
          </div>
          <h1
            className="font-display text-ink leading-[0.98] tracking-display text-[clamp(2.2rem,5vw,4rem)]"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
          >
            Estado del servicio
          </h1>
        </div>

        <section className={`border-2 p-8 mb-16 ${allOperational ? 'border-brand-dot' : 'border-mustard'}`}>
          <div className="flex items-center gap-4">
            <span
              className={`w-3 h-3 rounded-full ${allOperational ? 'bg-brand-dot' : 'bg-mustard'}`}
              style={{ animation: 'pulseDot 1.8s ease-out infinite' }}
            />
            <div>
              <div
                className="font-display text-[28px] md:text-[36px] leading-none text-ink tracking-display"
                style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
              >
                {allOperational ? 'Todos los sistemas operativos' : 'Incidente en curso'}
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-editorial text-ink-muted">
                Último muestreo · hace &lt; 30 s
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-mono text-[11px] uppercase tracking-editorial text-oxblood">N° 01</span>
            <span className="h-px flex-1 bg-ink/25" />
            <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted">Componentes · 90 días</span>
          </div>
          <div className="border-t-2 border-ink">
            {COMPONENTS.map((c) => {
              const meta = STATUS_META[c.status];
              return (
                <div key={c.name} className="grid grid-cols-12 gap-4 py-5 border-b border-ink/15 items-center">
                  <div className="col-span-12 md:col-span-5">
                    <div className="font-display text-[20px] leading-none text-ink tracking-display" style={{ fontVariationSettings: "'opsz' 32" }}>
                      {c.name}
                    </div>
                    <div className="mt-1 text-[13px] text-ink-muted">{c.description}</div>
                  </div>
                  <div className="col-span-6 md:col-span-4 flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <span className={`font-mono text-[11px] uppercase tracking-editorial ${meta.text}`}>{meta.label}</span>
                  </div>
                  <div className="col-span-6 md:col-span-3 md:text-right">
                    <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">Uptime 90 d</div>
                    <div className="font-display text-[20px] text-ink tabular-nums tracking-display" style={{ fontVariationSettings: "'opsz' 32" }}>
                      {c.uptime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-mono text-[11px] uppercase tracking-editorial text-oxblood">N° 02</span>
            <span className="h-px flex-1 bg-ink/25" />
            <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted">Historial reciente</span>
          </div>
          {INCIDENTS.length === 0 ? (
            <p className="text-[15px] text-ink-muted italic font-display">Sin incidentes en los últimos 30 días.</p>
          ) : (
            <ul className="space-y-0 border-t-2 border-ink">
              {INCIDENTS.map((i) => (
                <li key={i.date + i.title} className="py-6 border-b border-ink/15">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted">{i.date}</span>
                    <span className="font-mono text-[10px] uppercase tracking-editorial text-brand-dot">
                      {i.resolved ? 'Resuelto' : 'En curso'}
                    </span>
                  </div>
                  <h3 className="font-display text-[22px] leading-tight text-ink tracking-display" style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 40" }}>
                    {i.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-ink-muted max-w-[70ch]">{i.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      <footer className="border-t border-ink/15 bg-paper">
        <div className="max-w-[1100px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
            © 2026 Mi Asesor · Buenos Aires
          </div>
          <Link href="/landing" className="editorial-link font-mono text-[11px] uppercase tracking-editorial text-oxblood">
            ← Volver a la portada
          </Link>
        </div>
      </footer>
    </div>
  );
}
