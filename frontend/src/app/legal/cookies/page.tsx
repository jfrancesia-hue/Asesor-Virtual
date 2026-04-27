import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Qué cookies usamos y cómo gestionarlas.',
};

const COOKIES = [
  { name: 'session', type: 'Esencial', purpose: 'Mantenerte autenticado durante la sesión.', duration: 'Sesión (se borra al cerrar)' },
  { name: 'csrf_token', type: 'Esencial', purpose: 'Prevenir ataques de falsificación de solicitud entre sitios.', duration: '24 horas' },
  { name: 'tenant_id', type: 'Esencial', purpose: 'Identificar la organización asociada a tu cuenta multi-tenant.', duration: '30 días' },
  { name: 'consent', type: 'Esencial', purpose: 'Registrar tu decisión sobre cookies no esenciales.', duration: '6 meses' },
  { name: '_sentry', type: 'Diagnóstico', purpose: 'Monitorear errores de frontend (datos anonimizados).', duration: '30 días' },
  { name: '_analytics', type: 'Analítica', purpose: 'Métricas agregadas de uso del producto (no personales, no compartidas).', duration: '1 año' },
];

export default function CookiesPage() {
  return (
    <article className="max-w-[900px] mx-auto px-6 py-20">
      <div className="mb-12">
        <div className="font-mono text-[11px] uppercase tracking-editorial text-oxblood mb-4">
          Documento legal · Vigente desde abril 2026
        </div>
        <h1
          className="font-display text-ink leading-[0.98] tracking-display text-[clamp(2.2rem,5vw,4rem)]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
        >
          Política de cookies
        </h1>
        <p className="mt-6 text-[16px] leading-[1.7] text-ink-muted max-w-[60ch]">
          Una cookie es un archivo que el navegador guarda cuando visitás un sitio. Las usamos para mantenerte autenticado, proteger tu cuenta y entender cómo se usa el producto. Nada más.
        </p>
      </div>

      <section className="border-t border-ink/15 pt-8 mb-12">
        <div className="flex items-baseline gap-6">
          <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted shrink-0 w-10">
            I
          </span>
          <div className="flex-1">
            <h2
              className="font-display text-[26px] md:text-[32px] leading-[1.1] text-ink tracking-display"
              style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
            >
              Cookies activas
            </h2>
            <div className="mt-8 border-t-2 border-ink">
              <div className="grid grid-cols-12 gap-4 py-3 border-b border-ink/15 font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                <div className="col-span-3">Nombre</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-5">Finalidad</div>
                <div className="col-span-2">Duración</div>
              </div>
              {COOKIES.map((c) => (
                <div key={c.name} className="grid grid-cols-12 gap-4 py-5 border-b border-ink/15 text-[14px] text-ink">
                  <div className="col-span-3 font-mono text-oxblood">{c.name}</div>
                  <div className="col-span-2 text-ink-muted">{c.type}</div>
                  <div className="col-span-5 text-ink-muted leading-snug">{c.purpose}</div>
                  <div className="col-span-2 font-mono text-[12px] text-ink-muted">{c.duration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/15 pt-8 mb-12">
        <div className="flex items-baseline gap-6">
          <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted shrink-0 w-10">
            II
          </span>
          <div className="flex-1">
            <h2
              className="font-display text-[26px] md:text-[32px] leading-[1.1] text-ink tracking-display"
              style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
            >
              Tu control
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-[1.75] text-ink-muted max-w-[65ch]">
              <p>
                Las cookies esenciales no se pueden deshabilitar sin romper la funcionalidad del sitio (dejarías de poder iniciar sesión).
              </p>
              <p>
                Las cookies de diagnóstico y analítica se pueden rechazar desde el banner de consentimiento o ajustes de tu navegador. El rechazo no afecta tu experiencia como suscriptor.
              </p>
              <p>
                No usamos cookies publicitarias ni de terceros con fines de perfilado comercial. Tampoco vendemos datos a redes de anuncios.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/15 pt-8">
        <div className="flex items-baseline gap-6">
          <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted shrink-0 w-10">
            III
          </span>
          <div className="flex-1">
            <h2
              className="font-display text-[26px] md:text-[32px] leading-[1.1] text-ink tracking-display"
              style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
            >
              Cómo borrarlas
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-[1.75] text-ink-muted max-w-[65ch]">
              <p>
                Desde el navegador: en Chrome, Configuración → Privacidad y seguridad → Borrar datos de navegación. En Firefox y Safari el proceso es análogo.
              </p>
              <p>
                Desde tu cuenta: Panel → Configuración → Privacidad → &quot;Borrar rastro de sesión&quot;. Esta opción cierra la sesión en todos los dispositivos.
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
