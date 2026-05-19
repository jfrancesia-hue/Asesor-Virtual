'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Apple,
  BadgeCheck,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  HeartPulse,
  LockKeyhole,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
  FileText,
  Bot,
} from 'lucide-react';
import { BrandBird } from '@/components/brand/BrandBird';

const advisors = [
  {
    name: 'Legal',
    title: 'Legal Simple',
    person: 'Abogado/a en incorporacion',
    credentials: 'Orientacion legal | Documentos y pasos iniciales',
    icon: Scale,
    color: 'var(--primary)',
    trust: 'Perfil profesional pendiente',
    highlights: ['Contratos', 'Reclamos', 'Borradores'],
    summary: 'Ordena contratos, reclamos y documentos en lenguaje claro para llegar mejor preparado a una consulta profesional.',
    copy: 'Contratos, riesgos, cláusulas y criterio jurídico para Argentina, México y Colombia.',
    image: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&h=900&fit=crop&auto=format&q=80',
    imagePosition: 'center',
    profileImage: false,
  },
  {
    name: 'Salud',
    title: 'Salud Familiar',
    person: 'Dra. Maria Belen Acosta',
    credentials: 'Medica Generalista | Especialista en Medicina Familiar',
    icon: HeartPulse,
    color: 'var(--accent)',
    trust: 'Especialista en Medicina Familiar',
    highlights: ['Atencion integral', 'Prevencion', 'Habitos saludables'],
    summary: 'Acompana a personas y familias en el cuidado integral de su salud, con una mirada preventiva, humana y centrada en cada etapa de la vida.',
    copy: 'Orientación preventiva, hábitos y triage responsable. Sin diagnósticos, con cabeza.',
    image: '/advisors/maria-belen-acosta.jpeg',
    imagePosition: '58% 18%',
    profileImage: true,
    imageWidth: 1024,
    imageHeight: 1536,
  },
  {
    name: 'Nutricion',
    title: 'Nutricion Clara',
    person: 'Ana Sofía Rosalía Valdiviezo',
    credentials: 'Licenciada en Nutricion | Mat. Salta 851 · Jujuy 240',
    icon: Apple,
    color: '#2F9E44',
    trust: 'Especialista en Nutricion Integral',
    highlights: ['No peso centrista', 'Habitos reales', 'Ciencia y empatia'],
    summary: 'Licenciada en Nutricion recibida en la Universidad Nacional de Salta. Acompana a mejorar la relacion con la alimentacion desde una mirada integral, consciente y adaptada a cada etapa de la vida.',
    copy: 'Alimentacion consciente, habitos reales y acompanamiento nutricional sin dietas extremas.',
    image: '/advisors/ana-sofia-rosalia-valdiviezo-portrait.jpeg',
    imagePosition: 'center',
    profileImage: true,
    imageWidth: 485,
    imageHeight: 555,
  },
  {
    name: 'Finanzas',
    title: 'Finanzas Claras',
    person: 'Fernando Martinis',
    credentials: 'Contador Publico | Finanzas, gestion e impuestos',
    icon: BriefcaseBusiness,
    color: 'var(--cta)',
    trust: 'Contador Publico con experiencia institucional',
    highlights: ['Gestion financiera', 'Asesor universitario', 'Criterio contable'],
    summary: 'Contador Publico con experiencia en asesoramiento a personas, empresas e instituciones. Ayuda a ordenar numeros y planificar con seguridad.',
    copy: 'Presupuestos, monotributo, inversiones y proyecciones adaptadas a la realidad LATAM.',
    image: '/advisors/fernando-martinis.jpeg',
    imagePosition: '54% 12%',
    profileImage: true,
    imageWidth: 1024,
    imageHeight: 1536,
    hideProfileFooter: true,
  },
  {
    name: 'Bienestar',
    title: 'Alma Bienestar',
    person: 'Lic. Luciana Francesia',
    credentials: 'Psicologa | Bienestar emocional y conciencia corporal',
    icon: Brain,
    color: 'var(--brand-lavender)',
    trust: 'Profesional matriculada',
    highlights: ['Ansiedad y estres', 'Mindfulness', 'Conciencia corporal'],
    summary: 'Acompana procesos de autoconocimiento integrando salud mental, respiracion consciente y trabajo corporal desde una mirada calida e integral.',
    copy: 'Acompañamiento emocional, manejo de ansiedad y ejercicios guiados de respiración.',
    image: '/advisors/luciana-francesia.jpeg',
    imagePosition: 'left center',
    profileImage: true,
    imageWidth: 1536,
    imageHeight: 1024,
  },
  {
    name: 'Hogar',
    title: 'Hogar y Servicios',
    person: 'Red Toori Servicios Ya',
    credentials: 'IA de orientacion | Derivacion a profesionales',
    icon: Wrench,
    color: 'var(--cta-light)',
    trust: 'Conexion con profesionales',
    highlights: ['Diagnostico inicial', 'Profesionales', 'Soluciones practicas'],
    summary: 'La IA ayuda a entender el problema del hogar y, si hace falta resolverlo en persona, deriva a profesionales de servicios.',
    copy: 'Plomería, electricidad básica, pintura y mantenimiento — como ese vecino que sabe.',
    image: 'https://images.unsplash.com/photo-1503594384566-461fe158e797?w=800&h=900&fit=crop&auto=format&q=80',
    imagePosition: 'center',
    profileImage: false,
  },
];

const advisorDisplayOrder = ['Bienestar', 'Salud', 'Nutricion', 'Finanzas', 'Hogar', 'Legal'];

const flow = [
  {
    title: 'Consulta natural',
    body: 'Hablás como hablarías con una persona de confianza: contexto, objetivo, urgencia. La plataforma ordena todo por vos.',
    icon: MessageSquareText,
  },
  {
    title: 'Criterio documentado',
    body: 'Cada asesor entrega pasos accionables, nivel de certeza y advertencias cuando hace falta derivar a un profesional matriculado.',
    icon: Bot,
  },
  {
    title: 'Historial reutilizable',
    body: 'Conversaciones, contratos, análisis y alertas quedan listos para volver, exportar a PDF o compartir con quien necesites.',
    icon: FileText,
  },
];

const plans = [
  {
    name: 'Gratis',
    price: '0',
    pricePost: 'ARS',
    copy: 'Para probar MiAsesor Legal sin tarjeta.',
    features: ['1 usuario', '2 consultas IA', '1 contrato / mes', '1 crédito de análisis'],
    free: true,
  },
  {
    name: 'Start',
    price: '7.900',
    pricePost: 'ARS/mes',
    copy: 'Para uso personal o primeras consultas.',
    features: ['1 usuario', '20 consultas IA / mes', '5 contratos / mes', '2 créditos de análisis'],
  },
  {
    name: 'Pro',
    price: '19.900',
    pricePost: 'ARS/mes',
    copy: 'El plan ideal para profesionales y equipos chicos.',
    features: ['5 usuarios', '100 consultas IA / mes', '25 contratos / mes', '10 créditos de análisis'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '59.900',
    pricePost: 'ARS/mes',
    copy: 'Operación completa con soporte y escalabilidad.',
    features: ['Usuarios ilimitados', '1.000 consultas IA / mes', 'API y SSO', '30 créditos incluidos'],
  },
];

const faqs = [
  ['¿Reemplaza a un profesional?', 'No. Acelera investigación, redacción y decisiones preliminares. Cuando una situación requiere firma o criterio humano, el asesor lo indica y deriva.'],
  ['¿Mis datos se usan para entrenar?', 'No. Tus conversaciones y documentos no entrenan ningún modelo. Cifrado en tránsito y en reposo, control de acceso por tenant.'],
  ['¿Cómo se maneja una emergencia médica o psicológica?', 'Antes de cualquier respuesta, el asesor de salud o bienestar deriva a las líneas oficiales (107, 911, 135) cuando detecta un caso crítico.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí. La cancelación es inmediata desde tu panel y surte efecto al final del período ya facturado. Sin letra chica.'],
];

const metrics = [
  ['6', 'asesores IA en uno'],
  ['24/7', 'respuesta inmediata'],
  ['LATAM', 'criterio regional'],
  ['AES-256', 'datos cifrados'],
];

const heroVisualImage =
  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1200&h=1400&fit=crop&crop=faces&auto=format&q=86';

export default function LandingPage() {
  return (
    <main className="dashboard-bg min-h-screen relative">
      <Navbar />
      <Hero />
      <AdvisorsSection />
      <FlowSection />
      <PlansSection />
      <GuaranteeStrip />
      <FaqSection />
      <FinalCta />
    </main>
  );
}

// ============================================================
// NAVBAR
// ============================================================
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all ${
        scrolled
          ? 'bg-[var(--surface)]/85 backdrop-blur-2xl border-b border-[var(--border)] shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/landing" className="flex items-center gap-2.5" aria-label="MiAsesor">
          <BrandBird className="h-10 w-12 shrink-0" />
          <span className="font-display text-[15px] font-bold tracking-tight text-[var(--text-strong)]">
            MiAsesor
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-[14px] text-[var(--text-medium)] md:flex">
          <a href="#asesores" className="font-medium hover:text-[var(--text-strong)] transition-colors">Asesores</a>
          <a href="#workflow" className="font-medium hover:text-[var(--text-strong)] transition-colors">Cómo funciona</a>
          <a href="#planes" className="font-medium hover:text-[var(--text-strong)] transition-colors">Planes</a>
          <a href="#faq" className="font-medium hover:text-[var(--text-strong)] transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex items-center rounded-xl px-3.5 py-2 text-[14px] font-semibold text-[var(--text-medium)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            Ingresar
          </Link>
          <Link
            href="/auth/register"
            className="magnetic-btn inline-flex items-center gap-2 rounded-xl bg-[var(--cta)] px-4 py-2 text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(230,126,34,0.35)] hover:bg-[var(--cta-dark)] transition-all"
          >
            Empezar <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// HERO
// ============================================================
function Hero() {
  return (
    <section className="mesh-hero relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 reveal in-view">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cta)]/25 bg-[var(--cta-bg)] px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--cta-dark)]"
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
            Profesionales reales + IA — una sola plataforma
          </div>

          <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-[var(--text-strong)]">
            Asesores humanos potenciados con{' '}
            <span className="gradient-text">IA</span>.
          </h1>

          <p className="mt-6 max-w-2xl text-[17px] leading-[1.65] text-[var(--text-medium)]">
            Salud, nutricion, bienestar, finanzas, hogar y legal en un solo lugar. Primero te orienta una IA preparada para cada area; cuando hace falta, el camino sigue con un profesional humano.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/register"
              className="magnetic-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--cta)] px-7 py-4 text-[15px] font-bold text-white shadow-[0_12px_32px_rgba(230,126,34,0.4)] hover:bg-[var(--cta-dark)] transition-all"
            >
              Crear cuenta <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </Link>
            <a
              href="#asesores"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)]/70 backdrop-blur px-7 py-4 text-[15px] font-bold text-[var(--text-strong)] hover:bg-[var(--surface)] transition-all"
            >
              Conoce a los especialistas
            </a>
          </div>

          <p className="mt-5 text-[13px] text-[var(--text-muted)]">
            Pagás con Mercado Pago — todos los métodos aceptados, cuotas con bancos AR.
          </p>

          <dl className="mt-12 grid max-w-2xl grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm px-4 py-3"
              >
                <dt className="font-display text-[20px] font-extrabold tracking-tight text-[var(--text-strong)]">{value}</dt>
                <dd className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual principal: asesoria real + senales de producto */}
        <div className="lg:col-span-5 hidden lg:block reveal in-view" aria-hidden="true">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative h-[540px]">
      <div className="absolute inset-0 translate-x-5 rotate-2 rounded-[28px] bg-[var(--primary)]/10" />
      <div className="relative h-full overflow-hidden rounded-[28px] border border-white/70 bg-[var(--surface)] shadow-strong">
        <div className="ethnic-corner absolute right-[-26px] top-[-28px] z-10 rotate-45" />
        <div className="ethnic-corner absolute bottom-[-32px] left-[-34px] z-10 -rotate-[135deg]" />
        <Image
          src={heroVisualImage}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,46,61,0.66)] via-[rgba(31,46,61,0.08)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="rounded-2xl border border-white/25 bg-white/18 p-5 text-white shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-[12px] font-bold uppercase tracking-[0.1em] text-white/75">
                  Consulta analizada
                </p>
                <p className="mt-1 font-display text-[22px] font-extrabold tracking-tight">
                  Respuesta clara, con criterio local.
                </p>
              </div>
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-soft">
                <BadgeCheck className="h-6 w-6" strokeWidth={2.4} />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-6 gap-2">
              {advisors.map((advisor) => {
                const Icon = advisor.icon;
                return (
                  <div
                    key={advisor.name}
                    className="flex h-14 items-center justify-center rounded-xl border border-white/20 bg-white/14"
                    title={advisor.name}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.3} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADVISORS SECTION
// ============================================================
function AdvisorsSection() {
  const orderedAdvisors = [...advisors].sort(
    (a, b) => advisorDisplayOrder.indexOf(a.name) - advisorDisplayOrder.indexOf(b.name),
  );

  return (
    <section id="asesores" className="relative bg-[var(--surface)] border-y border-[var(--border)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Equipo profesional"
          title="Asesores IA respaldados por personas reales."
          copy="Cada area combina una guia inteligente con criterio humano: profesionales, experiencia real y derivacion cuando la situacion necesita acompanamiento personal."
        />
        <div className="ethnic-divider mt-8 max-w-2xl" aria-hidden="true" />
        <div className="mt-12 space-y-8">
          {orderedAdvisors.map((advisor, i) => {
            const Icon = advisor.icon;
            if (advisor.profileImage) {
              return (
                <RevealItem key={advisor.name} delay={i * 60}>
                  <article className="bento-card overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="flex flex-col gap-4 border-b border-[var(--border)] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                      <div>
                        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: advisor.color }}>
                          {advisor.title}
                        </p>
                        <h3 className="mt-2 font-display text-[clamp(34px,5vw,58px)] font-extrabold leading-[1.02] text-[var(--text-strong)] tracking-normal">
                          {advisor.person}
                        </h3>
                        <p className="mt-3 max-w-3xl text-[16px] font-semibold leading-relaxed text-[var(--text-medium)]">{advisor.credentials}</p>
                      </div>
                      <span
                        className="inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-bold"
                        style={{
                          background: `color-mix(in srgb, ${advisor.color} 11%, var(--surface-subtle))`,
                          color: advisor.color,
                        }}
                      >
                        <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
                        {advisor.trust}
                      </span>
                    </div>

                    <div className="bg-[#f8f5ef] p-3 sm:p-5">
                      <div
                        className="mx-auto overflow-hidden rounded-xl border border-[var(--border)] shadow-soft"
                        style={{
                          aspectRatio: advisor.hideProfileFooter
                            ? `${advisor.imageWidth || 1536} / ${Math.round((advisor.imageHeight || 1024) * 0.92)}`
                            : `${advisor.imageWidth || 1536} / ${advisor.imageHeight || 1024}`,
                        }}
                      >
                        <Image
                          src={advisor.image}
                          alt={advisor.person}
                          width={advisor.imageWidth || 1536}
                          height={advisor.imageHeight || 1024}
                          sizes="(min-width: 1280px) 1180px, 94vw"
                          className="h-auto w-full"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div>
                        <h4 className="font-display text-[28px] font-extrabold leading-tight text-[var(--text-strong)] tracking-normal">
                          {advisor.name}
                        </h4>
                        <p className="mt-3 max-w-4xl text-[17px] leading-[1.75] text-[var(--text-medium)]">{advisor.summary}</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          {advisor.highlights.map((item) => (
                            <div
                              key={item}
                              className="flex min-h-[72px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3"
                            >
                              <Icon className="h-5 w-5 shrink-0" style={{ color: advisor.color }} strokeWidth={2.35} />
                              <span className="text-[14px] font-bold leading-snug text-[var(--text-strong)]">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Link
                        href="/auth/register"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5"
                        style={{ background: advisor.color }}
                      >
                        Entrar al asesor <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                      </Link>
                    </div>
                  </article>
                </RevealItem>
              );
            }

            return (
              <RevealItem key={advisor.name} delay={i * 60}>
                <article className="bento-card group grid min-h-[560px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:grid-cols-[minmax(520px,0.92fr)_1fr]">
                  <div className={`relative min-h-[420px] overflow-hidden lg:min-h-full ${advisor.profileImage ? 'bg-[#f8f5ef]' : ''}`}>
                    <div className="absolute inset-0 p-4 sm:p-6">
                      <div className="relative h-full w-full overflow-hidden rounded-xl bg-[var(--surface-subtle)]">
                        <Image
                          src={advisor.image}
                          alt={advisor.person}
                          fill
                          sizes="(min-width: 1024px) 52vw, 100vw"
                          className={`transition-transform duration-700 group-hover:scale-[1.015] ${
                            advisor.profileImage ? 'object-contain' : 'object-cover'
                          }`}
                          style={{ objectPosition: advisor.imagePosition }}
                        />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,46,61,0.7)] via-transparent to-transparent pointer-events-none" />
                    <div
                      className="absolute left-6 top-6 flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/15 backdrop-blur-md text-white"
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div className="absolute bottom-7 left-7 right-7">
                      <p className="font-display text-[clamp(25px,3vw,34px)] font-extrabold leading-tight text-white tracking-normal">{advisor.person}</p>
                      <p className="mt-2 max-w-[34rem] text-[13px] font-semibold uppercase tracking-[0.08em] text-white/82">{advisor.credentials}</p>
                    </div>
                  </div>
                  <div className="flex min-h-full flex-col p-8 sm:p-10 lg:p-12">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: advisor.color }}>
                          {advisor.title}
                        </p>
                        <h3 className="mt-2 font-display text-[clamp(34px,5vw,56px)] font-extrabold leading-[1.02] text-[var(--text-strong)] tracking-normal">
                          {advisor.name}
                        </h3>
                        <p className="mt-3 text-[16px] font-semibold leading-relaxed text-[var(--text-medium)]">{advisor.credentials}</p>
                      </div>
                      <span
                        className="inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-bold"
                        style={{
                          background: `color-mix(in srgb, ${advisor.color} 11%, var(--surface-subtle))`,
                          color: advisor.color,
                        }}
                      >
                        <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
                        {advisor.trust}
                      </span>
                    </div>

                    <p className="mt-8 max-w-3xl text-[18px] leading-[1.75] text-[var(--text-medium)]">{advisor.summary}</p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {advisor.highlights.map((item) => (
                        <div
                          key={item}
                          className="flex min-h-[82px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-4"
                        >
                          <Icon className="h-5 w-5 shrink-0" style={{ color: advisor.color }} strokeWidth={2.35} />
                          <span className="text-[14px] font-bold leading-snug text-[var(--text-strong)]">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-5 pt-10 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-2xl text-[14.5px] leading-relaxed text-[var(--text-muted)]">
                        La IA te orienta primero. Si tu consulta requiere criterio profesional o seguimiento humano, el asesor te indica el siguiente paso.
                      </p>
                      <Link
                        href="/auth/register"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5"
                        style={{ background: advisor.color }}
                      >
                        Entrar al asesor <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                      </Link>
                    </div>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FLOW SECTION
// ============================================================
function FlowSection() {
  return (
    <section id="workflow" className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Cómo funciona"
          title="Menos fricción. Más decisiones."
          copy="Pensado para operar: preguntar, resolver, guardar y seguir. Sin decoración que estorbe el trabajo."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {flow.map((item, index) => {
            const Icon = item.icon;
            return (
              <RevealItem key={item.title} delay={index * 80}>
                <article className="bento-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 h-full">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Paso 0{index + 1}
                    </span>
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                  </div>
                  <h3 className="mt-7 font-display text-[22px] font-bold tracking-tight text-[var(--text-strong)]">{item.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--text-medium)]">{item.body}</p>
                </article>
              </RevealItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PLANS SECTION
// ============================================================
function PlansSection() {
  return (
    <section id="planes" className="relative bg-[var(--surface)] border-y border-[var(--border)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Planes simples"
          title="Planes simples, en pesos."
          copy="Empezá gratis sin tarjeta y pasá a Start cuando necesites más consultas, historial y acceso completo."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => (
            <RevealItem key={plan.name} delay={i * 80}>
              <article
                className={`relative rounded-2xl border p-7 h-full flex flex-col ${
                  plan.featured
                    ? 'border-[var(--cta)] bg-[var(--cta-bg)] shadow-[0_30px_80px_-20px_rgba(230,126,34,0.35)]'
                    : 'bento-card border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-[var(--cta)] text-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] shadow-soft">
                    <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
                    Más popular
                  </span>
                )}
                <h3 className="font-display text-[22px] font-bold tracking-tight text-[var(--text-strong)]">{plan.name}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-medium)]">{plan.copy}</p>

                <div className="mt-7 flex items-baseline gap-1.5">
                  <span className="font-display text-[44px] font-extrabold tracking-[-0.03em] text-[var(--text-strong)]">
                    ${plan.price}
                  </span>
                  <span className="text-[13px] text-[var(--text-muted)] font-medium">{plan.pricePost}</span>
                </div>

                <ul className="mt-7 space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-[14px] text-[var(--text-medium)]">
                      <Check className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" strokeWidth={2.6} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/register"
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-bold transition-all ${
                    plan.featured
                      ? 'magnetic-btn bg-[var(--cta)] text-white hover:bg-[var(--cta-dark)] shadow-[0_8px_24px_rgba(230,126,34,0.35)]'
                      : 'bg-[var(--text-strong)] text-white hover:bg-[var(--primary-dark)]'
                  }`}
                >
                  {plan.free ? 'Empezar gratis' : `Elegir ${plan.name}`} <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              </article>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// GUARANTEE STRIP
// ============================================================
function GuaranteeStrip() {
  return (
    <section className="relative px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
        {[
          [ShieldCheck, 'Datos cifrados', 'AES-256 en tránsito y reposo'],
          [LockKeyhole, 'No entrenamos modelos', 'Tus conversaciones son privadas'],
          [Sparkles, 'Cancelás cuando quieras', 'Sin compromisos, sin penalidades'],
        ].map(([Icon, label, sub]) => {
          const TypedIcon = Icon as typeof ShieldCheck;
          return (
            <div
              key={label as string}
              className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-soft"
            >
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-dark)]"
                aria-hidden="true"
              >
                <TypedIcon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <p className="font-display font-bold text-[15px] text-[var(--text-strong)] tracking-tight">{label as string}</p>
                <p className="text-[12.5px] text-[var(--text-medium)] mt-0.5">{sub as string}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
function FaqSection() {
  return (
    <section id="faq" className="relative bg-[var(--surface)] border-y border-[var(--border)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionIntro
          eyebrow="Preguntas frecuentes"
          title="Lo que la gente nos pregunta antes de empezar."
          copy="Si tu duda no está acá, escribinos a hola@miasesor.com.ar y te respondemos en menos de 24 horas."
          centered
        />
        <div className="mt-12 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {faqs.map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left">
                <span className="font-display font-bold text-[16px] text-[var(--text-strong)] tracking-tight">{q}</span>
                <span
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-[var(--surface-subtle)] text-[var(--text-medium)] transition-transform duration-300 group-open:rotate-45 group-open:bg-[var(--cta-bg)] group-open:text-[var(--cta-dark)]"
                  aria-hidden="true"
                >+</span>
              </summary>
              <p className="px-6 pb-6 max-w-2xl text-[14.5px] leading-relaxed text-[var(--text-medium)]">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA
// ============================================================
function FinalCta() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(46,134,193,0.15), transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(230,126,34,0.18), transparent 50%)',
        }}
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center gap-7">
        <p className="font-display text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Empezá ahora
        </p>
        <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--text-strong)] max-w-3xl">
          Tu próxima duda, resuelta en{' '}
          <span className="gradient-text">menos de un minuto</span>.
        </h2>
        <p className="text-[16px] leading-relaxed text-[var(--text-medium)] max-w-xl">
          Sin agendar turno, sin esperar, sin que te miren mal por preguntar lo que ya estás pensando.
        </p>
        <Link
          href="/auth/register"
          className="magnetic-btn inline-flex items-center gap-2 rounded-2xl bg-[var(--cta)] px-8 py-4 text-[15px] font-bold text-white shadow-[0_12px_32px_rgba(230,126,34,0.4)] hover:bg-[var(--cta-dark)] transition-all"
        >
          Crear cuenta gratis <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
        </Link>
        <p className="text-[12.5px] text-[var(--text-muted)]">
          Pagás con Mercado Pago. Cancelás cuando quieras.
        </p>
      </div>
    </section>
  );
}

// ============================================================
// HELPERS
// ============================================================
function SectionIntro({
  eyebrow,
  title,
  copy,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${centered ? 'mx-auto text-center' : ''}`}>
      <p className="font-display text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-[clamp(1.875rem,4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--text-strong)]">
        {title}
      </h2>
      <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-medium)]">{copy}</p>
    </div>
  );
}

function RevealItem({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal in-view ${visible ? 'in-view' : ''} h-full`}
      style={{ transitionDelay: `${Math.min(delay, 360)}ms` }}
    >
      {children}
    </div>
  );
}
