'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Home as HomeIcon,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Spinner, Badge } from '@/components/ui';

const CONTRACT_SHORTCUTS = [
  { type: 'alquiler', label: 'Alquiler', icon: HomeIcon, hint: 'Ley 27.551 lista' },
  { type: 'servicios', label: 'Servicios', icon: Briefcase, hint: 'Honorarios profesionales' },
  { type: 'nda', label: 'NDA', icon: Lock, hint: 'Confidencialidad' },
  { type: 'freelance', label: 'Freelance', icon: FileText, hint: 'Trabajo por proyecto' },
];

const HOME_BACKGROUND_IMAGE =
  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1800&h=1200&fit=crop&crop=faces&auto=format&q=82';

const ADVISOR_VISUALS: Record<string, string> = {
  legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=280&h=280&fit=crop&auto=format&q=80',
  health: '/advisors/maria-belen-acosta.jpeg',
  nutrition: '/advisors/ana-sofia-rosalia-valdiviezo-portrait.jpeg',
  finance: '/advisors/fernando-martinis.jpeg',
  psychology: '/advisors/luciana-francesia.jpeg',
  home: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=280&h=280&fit=crop&auto=format&q=80',
};

const ADVISOR_PROFILE_ORDER = ['psychology', 'health', 'nutrition', 'finance', 'home', 'legal'];

const ADVISOR_PROFILE_DETAILS: Record<string, {
  brand: string;
  professional: string;
  credentials: string;
  focus: string;
  summary: string;
  trust: string;
  badges: string[];
  services: string[];
  featured?: boolean;
}> = {
  psychology: {
    brand: 'Alma Bienestar',
    professional: 'Lic. Luciana Francesia',
    credentials: 'Psicologa | Bienestar emocional y conciencia corporal',
    focus: 'Ansiedad, gestion emocional, autoestima, mindfulness y Pole Terapeutico.',
    summary:
      'Acompana procesos de autoconocimiento integrando salud mental, respiracion consciente y trabajo corporal desde una mirada calida, terapeutica e integral.',
    trust: 'Profesional matriculada',
    badges: ['Enfoque integral', 'Escucha empatica', 'Cuerpo y emociones'],
    services: ['Ansiedad y estres', 'Mindfulness', 'Conciencia corporal'],
    featured: true,
  },
  health: {
    brand: 'Salud Familiar',
    professional: 'Dra. Maria Belen Acosta',
    credentials: 'Medica Generalista | Especialista en Medicina Familiar',
    focus: 'Atencion integral, prevencion, salud familiar y habitos saludables.',
    summary:
      'Acompana a personas y familias en el cuidado integral de su salud, con una mirada preventiva, humana y centrada en cada etapa de la vida.',
    trust: 'Especialista en Medicina Familiar',
    badges: ['Atencion integral', 'Prevencion', 'Escucha activa'],
    services: ['Consultas generales', 'Habitos saludables', 'Salud familiar'],
  },
  nutrition: {
    brand: 'Nutricion Clara',
    professional: 'Ana Sofía Rosalía Valdiviezo',
    credentials: 'Licenciada en Nutricion | Mat. Salta 851 · Jujuy 240',
    focus: 'Nutricion integral, alimentacion consciente, habitos reales y enfoque no peso centrista.',
    summary:
      'Acompana a mejorar la relacion con la alimentacion desde un enfoque integral, real y consciente, adaptado al estilo de vida y necesidades de cada persona.',
    trust: 'Licenciada en Nutricion',
    badges: ['No peso centrista', 'Alimentacion consciente', 'Ciencia y empatia'],
    services: ['Salud digestiva', 'Embarazo y lactancia', 'Nutricion deportiva'],
  },
  finance: {
    brand: 'Finanzas Claras',
    professional: 'Fernando Martinis',
    credentials: 'Contador Publico | Finanzas, gestion e impuestos',
    focus: 'Planificacion financiera, asesoramiento contable, gestion y optimizacion de recursos.',
    summary:
      'Contador Publico con amplia experiencia en asesoramiento a personas, empresas e instituciones. Aporta una mirada clara para ordenar numeros, tomar mejores decisiones y planificar con seguridad.',
    trust: 'Contador Publico con experiencia institucional',
    badges: ['Gestion financiera', 'Asesor universitario', 'Criterio contable'],
    services: ['Impuestos', 'Presupuestos', 'Empresas y emprendedores'],
  },
  home: {
    brand: 'Hogar y Servicios',
    professional: 'Red Toori Servicios Ya',
    credentials: 'IA de orientacion | Derivacion a profesionales',
    focus: 'Mantenimiento, arreglos, diagnostico inicial y busqueda de expertos.',
    summary:
      'La IA ayuda a entender el problema y, si hace falta resolverlo en casa, deriva a un profesional de servicios.',
    trust: 'Conexion con humanos',
    badges: ['Diagnostico inicial', 'Profesionales', 'Soluciones practicas'],
    services: ['Plomeria', 'Electricidad segura', 'Mantenimiento'],
  },
  legal: {
    brand: 'Legal Simple',
    professional: 'Abogado/a en incorporacion',
    credentials: 'Orientacion legal | Documentos y pasos iniciales',
    focus: 'Contratos, reclamos, documentos, derechos y preparacion de consultas.',
    summary:
      'Ordena el caso, explica opciones en lenguaje claro y deja preparado el material para validar con un profesional.',
    trust: 'Perfil profesional pendiente',
    badges: ['Contratos', 'Reclamos', 'Documentos'],
    services: ['Revision inicial', 'Preguntas clave', 'Borradores'],
  },
};
const CONTRACT_VISUALS: Record<string, string> = {
  alquiler: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=260&h=220&fit=crop&auto=format&q=80',
  servicios: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=260&h=220&fit=crop&auto=format&q=80',
  nda: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=260&h=220&fit=crop&auto=format&q=80',
  freelance: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=260&h=220&fit=crop&auto=format&q=80',
};

// Fallback si el backend no responde
const ADVISORS_FALLBACK = [
  { id: 'legal', name: 'Asesor Legal', title: 'Experto en Derecho LATAM', description: 'Contratos, análisis jurídico y consultas legales para Argentina, México y Colombia.', icon: '⚖️', color: 'var(--primary)', available: true },
  { id: 'health', name: 'Asesor de Salud', title: 'Orientación en Salud', description: 'Síntomas, nutrición, prevención y bienestar general.', icon: '🏥', color: 'var(--accent)', available: true },
  { id: 'nutrition', name: 'Ana Sofía Nutrición', title: 'Licenciada en Nutricion Integral', description: 'Alimentacion consciente, habitos reales y educacion nutricional.', icon: '🥗', color: '#2F9E44', available: true },
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
  const orderedAdvisors = [...advisors].sort((a, b) => {
    const aIndex = ADVISOR_PROFILE_ORDER.indexOf(a.id);
    const bIndex = ADVISOR_PROFILE_ORDER.indexOf(b.id);

    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10 md:px-8 md:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src={HOME_BACKGROUND_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.42]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,251,243,0.82)] via-[rgba(254,246,234,0.7)] to-[rgba(245,248,247,0.78)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.66),rgba(255,255,255,0.1)_48%,rgba(255,255,255,0.5))]" />
      </div>

      <div className="mx-auto max-w-6xl">
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
          Asesores IA con criterio humano detras. Empeza una consulta, usa una guia o pedi derivacion profesional cuando lo necesites.
        </p>
      </header>

      {/* Advisors Grid */}
      <section className="mb-12" aria-labelledby="advisors-heading">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
              Equipo profesional
            </p>
            <h2 id="advisors-heading" className="mt-1 font-display text-[24px] font-bold leading-tight text-[var(--text-strong)] tracking-normal">
              Tus asesores con respaldo humano
            </h2>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">Toca un perfil para entrar</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-6">
            {orderedAdvisors.map((advisor) => {
              const profile = ADVISOR_PROFILE_DETAILS[advisor.id];
              const visual = ADVISOR_VISUALS[advisor.id] || ADVISOR_VISUALS.legal;
              const cardColor = advisor.color || 'var(--primary)';
              const isFullProfile = ['psychology', 'health', 'nutrition', 'finance'].includes(advisor.id);

              return (
                <button
                  key={advisor.id}
                  onClick={() => handleAdvisorClick(advisor)}
                  disabled={!advisor.available}
                  className={`bento-card group grid min-h-[460px] w-full overflow-hidden rounded-2xl border bg-[var(--surface)] text-left transition-all lg:grid-cols-[minmax(420px,0.86fr)_1fr] ${
                    advisor.available
                      ? 'cursor-pointer border-[var(--border)] hover:-translate-y-0.5 hover:shadow-medium'
                      : 'cursor-not-allowed border-[var(--border)] opacity-60'
                  }`}
                >
                  <div className={`relative min-h-[360px] overflow-hidden lg:min-h-full ${isFullProfile ? 'bg-[#f8f5ef]' : ''}`}>
                    <div className="absolute inset-0 p-4 sm:p-5">
                      <div className="relative h-full w-full overflow-hidden rounded-xl bg-[var(--surface-subtle)]">
                        <Image
                          src={visual}
                          alt={profile ? profile.professional : advisor.name}
                          fill
                          sizes="(min-width: 1024px) 46vw, 100vw"
                          className={`transition-transform duration-700 group-hover:scale-[1.015] ${
                            isFullProfile ? 'object-contain' : 'object-cover'
                          } ${
                            advisor.id === 'psychology'
                              ? 'object-left'
                              : advisor.id === 'health'
                                ? 'object-[58%_18%]'
                                : advisor.id === 'nutrition'
                                  ? 'object-[50%_42%]'
                                  : advisor.id === 'finance'
                                    ? 'object-[54%_12%]'
                                    : 'object-center'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,46,61,0.72)] via-transparent to-transparent pointer-events-none" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-strong)] shadow-soft">
                      <UserRound className="h-3.5 w-3.5" strokeWidth={2.4} />
                      {profile?.featured ? 'Perfil destacado' : 'Profesional'}
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <p className="font-display text-[clamp(22px,3vw,32px)] font-bold leading-tight text-white tracking-normal">
                        {profile?.professional || advisor.name}
                      </p>
                      <p className="mt-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] leading-snug text-white/84">
                        {profile?.credentials || advisor.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-h-full flex-col p-7 sm:p-9">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-soft"
                          style={{ background: `color-mix(in srgb, ${cardColor} 14%, var(--surface))` }}
                          aria-hidden="true"
                        >
                          {advisor.icon}
                        </div>
                        <div>
                          <h3 className="font-display text-[clamp(28px,4vw,44px)] font-bold leading-tight text-[var(--text-strong)] tracking-normal">
                            {profile?.brand || advisor.name}
                          </h3>
                          <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: cardColor }}>
                            {advisor.name}
                          </p>
                        </div>
                      </div>
                      {!advisor.available && <Badge color="orange">Pro</Badge>}
                    </div>

                    <p className="mt-6 text-[17px] leading-relaxed text-[var(--text-medium)]">
                      {profile?.summary || advisor.description}
                    </p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                      {(profile?.badges || [advisor.title]).slice(0, 3).map((badge) => (
                        <div
                          key={badge}
                          className="flex min-h-[76px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3"
                        >
                          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: cardColor }} strokeWidth={2.4} />
                          <span className="text-[13.5px] font-semibold leading-snug text-[var(--text-strong)]">{badge}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {(profile?.services || []).map((service) => (
                        <span
                          key={service}
                          className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{
                            background: `color-mix(in srgb, ${cardColor} 10%, var(--surface-subtle))`,
                            color: cardColor,
                          }}
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text-muted)]">
                        <ShieldCheck className="h-4 w-4" style={{ color: cardColor }} strokeWidth={2.4} />
                        {profile?.trust || 'Orientacion asistida por IA'}
                      </div>
                      {advisor.available && (
                        <div
                          className="inline-flex items-center gap-2 text-[13px] font-bold"
                          style={{ color: cardColor }}
                        >
                          Entrar al asesor <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
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
                className="bento-card overflow-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-left"
              >
                <div className="relative h-20 overflow-hidden">
                  <Image
                    src={CONTRACT_VISUALS[s.type]}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 22vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,46,61,0.55)] to-transparent" />
                  <div className="absolute left-4 top-4 w-10 h-10 rounded-xl bg-white/88 text-[var(--primary)] flex items-center justify-center shadow-soft" aria-hidden="true">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                </div>
                <div className="p-5 pt-4">
                  <p className="font-display font-semibold text-[14.5px] text-[var(--text-strong)] tracking-tight">{s.label}</p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{s.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
      </div>
    </div>
  );
}
