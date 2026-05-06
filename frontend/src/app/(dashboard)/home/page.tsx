'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRight, FileText, Lock, Briefcase, Home as HomeIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Spinner, Badge } from '@/components/ui';

const CONTRACT_SHORTCUTS = [
  { type: 'alquiler', label: 'Alquiler', icon: HomeIcon, hint: 'Ley 27.551 lista' },
  { type: 'servicios', label: 'Servicios', icon: Briefcase, hint: 'Honorarios profesionales' },
  { type: 'nda', label: 'NDA', icon: Lock, hint: 'Confidencialidad' },
  { type: 'freelance', label: 'Freelance', icon: FileText, hint: 'Trabajo por proyecto' },
];

// Fallback si el backend no responde
const ADVISORS_FALLBACK = [
  { id: 'legal', name: 'Asesor Legal', title: 'Experto en Derecho LATAM', description: 'Contratos, análisis jurídico y consultas legales para Argentina, México y Colombia.', icon: '⚖️', color: 'var(--primary)', available: true },
  { id: 'health', name: 'Asesor de Salud', title: 'Orientación en Salud', description: 'Síntomas, nutrición, prevención y bienestar general.', icon: '🏥', color: 'var(--accent)', available: true },
  { id: 'finance', name: 'Asesor Financiero', title: 'Finanzas Personales LATAM', description: 'Presupuesto, inversiones, deudas e impuestos.', icon: '💰', color: 'var(--cta)', available: true },
  { id: 'psychology', name: 'Asesor de Bienestar', title: 'Apoyo Emocional', description: 'Escucha empática, ansiedad y mindfulness.', icon: '💜', color: 'var(--brand-lavender)', available: true },
  { id: 'home', name: 'Asesor del Hogar', title: 'Mantenimiento del Hogar', description: 'Plomería, electricidad básica, pintura y jardinería.', icon: '🏠', color: 'var(--cta-light)', available: true },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ai.listAdvisors()
      .then((data: any) => setAdvisors(data && data.length > 0 ? data : ADVISORS_FALLBACK))
      .catch(() => setAdvisors(ADVISORS_FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const handleAdvisorClick = (advisor: any) => {
    if (!advisor.available) {
      toast.error(`Necesitás plan Pro o superior para ${advisor.name}`);
      return;
    }
    router.push(`/advisor/${advisor.id}`);
  };

  const handleContractShortcut = (type: string) => {
    router.push(`/advisor?advisor=legal&mode=create&type=${type}`);
  };

  const firstName = user?.fullName?.split(' ')[0] || 'usuario';

  return (
    <div className="px-6 md:px-8 py-10 md:py-12 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Tu panel · {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-2 font-display text-[clamp(28px,4.5vw,40px)] font-bold leading-[1.1] tracking-[-0.025em] text-[var(--text-strong)]">
          Buen día, {firstName}.{' '}
          <span className="gradient-text">¿En qué te ayudamos?</span>
        </h1>
        <p className="mt-3 text-[15px] text-[var(--text-medium)] max-w-xl">
          Cinco asesores entrenados en realidad LATAM. Empezá una consulta o usá un atajo.
        </p>
      </header>

      {/* Advisors Grid */}
      <section className="mb-12" aria-labelledby="advisors-heading">
        <div className="flex items-end justify-between mb-5">
          <h2 id="advisors-heading" className="font-display font-bold text-lg text-[var(--text-strong)] tracking-tight">
            Tus asesores
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Tap para empezar</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advisors.map((advisor) => (
              <button
                key={advisor.id}
                onClick={() => handleAdvisorClick(advisor)}
                disabled={!advisor.available}
                className={`bento-card text-left p-6 rounded-2xl border bg-[var(--surface)] transition-all ${
                  advisor.available
                    ? 'border-[var(--border)] cursor-pointer'
                    : 'border-[var(--border)] cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-soft"
                    style={{
                      background: `color-mix(in srgb, ${advisor.color} 14%, var(--surface))`,
                    }}
                    aria-hidden="true"
                  >
                    {advisor.icon}
                  </div>
                  {!advisor.available && <Badge color="orange">Pro</Badge>}
                </div>
                <h3 className="font-display font-bold text-[var(--text-strong)] text-[15.5px] tracking-tight">
                  {advisor.name}
                </h3>
                <p className="text-[13px] text-[var(--text-medium)] mt-1.5 line-clamp-2 leading-relaxed">
                  {advisor.description}
                </p>
                {advisor.available && (
                  <div
                    className="flex items-center gap-1.5 mt-5 text-[13px] font-semibold"
                    style={{ color: advisor.color }}
                  >
                    Consultar <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Contract Shortcuts */}
      <section aria-labelledby="contracts-heading">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 id="contracts-heading" className="font-display font-bold text-lg text-[var(--text-strong)] tracking-tight">
              Contratos rápidos
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Generá un borrador en menos de un minuto.
            </p>
          </div>
          <button
            onClick={() => router.push('/contracts')}
            className="text-[13px] font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] inline-flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CONTRACT_SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.type}
                onClick={() => handleContractShortcut(s.type)}
                className="bento-card flex flex-col items-start gap-3 p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-bg)] text-[var(--primary)] flex items-center justify-center" aria-hidden="true">
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-display font-semibold text-[14.5px] text-[var(--text-strong)] tracking-tight">{s.label}</p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{s.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
