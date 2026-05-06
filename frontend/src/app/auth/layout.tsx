import { ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';

const VALUE_BULLETS = [
  { icon: Sparkles, title: '5 asesores IA en uno', desc: 'Legal, salud, finanzas, bienestar y hogar — sin pagar cinco suscripciones.' },
  { icon: ShieldCheck, title: 'Privacidad primero', desc: 'Tus documentos no se usan para entrenar modelos. Borrables en cualquier momento.' },
  { icon: Zap, title: 'Hecho para LATAM', desc: 'Conoce el monotributo, la Ley 27.551 y las realidades del bolsillo argentino.' },
  { icon: Users, title: '+1.000 personas', desc: 'Resolviendo dudas de contratos, salud y plata en menos de un minuto.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen dashboard-bg">
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* Form column */}
        <div className="flex items-center justify-center px-6 py-12 md:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Value column (mesh hero) */}
        <aside
          className="relative hidden md:flex items-center px-12 py-12 overflow-hidden"
          aria-hidden="false"
        >
          <div className="mesh-hero absolute inset-0" aria-hidden="true">
            <div
              className="absolute -top-12 right-0 h-96 w-96 rounded-full blur-3xl opacity-60"
              style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-0 left-12 h-80 w-80 rounded-full blur-3xl opacity-50"
              style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
            />
            <div
              className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full blur-3xl opacity-45"
              style={{ background: 'radial-gradient(circle, var(--cta) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative z-10 max-w-md">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
              TuAsesor · Cinco especialistas IA
            </p>
            <h2 className="mt-4 font-display text-[clamp(28px,4vw,40px)] font-bold leading-[1.1] tracking-[-0.025em] text-[var(--text-strong)]">
              Asesoría que entiende{' '}
              <span className="gradient-text">tu realidad</span>.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-medium)]">
              Una sola suscripción para resolver tus dudas legales, de salud, finanzas, bienestar y hogar. Sin agendar, sin esperar, sin que te miren mal por preguntar.
            </p>

            <ul className="mt-10 space-y-5">
              {VALUE_BULLETS.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.title} className="flex gap-3.5">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white/85 backdrop-blur shadow-soft border border-[var(--border)]"
                      aria-hidden="true"
                    >
                      <Icon className="w-4.5 h-4.5 text-[var(--primary)]" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-[14.5px] text-[var(--text-strong)]">{b.title}</p>
                      <p className="text-[13.5px] leading-relaxed text-[var(--text-medium)]">{b.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
