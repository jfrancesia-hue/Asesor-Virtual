'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
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

const advisors = [
  {
    name: 'Legal',
    title: 'Lex',
    icon: Scale,
    color: 'var(--primary)',
    copy: 'Contratos, riesgos, cláusulas y criterio jurídico para Argentina, México y Colombia.',
    image: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Salud',
    title: 'Vita',
    icon: HeartPulse,
    color: 'var(--accent)',
    copy: 'Orientación preventiva, hábitos y triage responsable. Sin diagnósticos, con cabeza.',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Finanzas',
    title: 'Capi',
    icon: BriefcaseBusiness,
    color: 'var(--cta)',
    copy: 'Presupuestos, monotributo, inversiones y proyecciones adaptadas a la realidad LATAM.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Bienestar',
    title: 'Alma',
    icon: Brain,
    color: 'var(--brand-lavender)',
    copy: 'Acompañamiento emocional, manejo de ansiedad y ejercicios guiados de respiración.',
    image: 'https://images.unsplash.com/photo-1528319725582-ddc096101511?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Hogar',
    title: 'Tito',
    icon: Wrench,
    color: 'var(--cta-light)',
    copy: 'Plomería, electricidad básica, pintura y mantenimiento — como ese vecino que sabe.',
    image: 'https://images.unsplash.com/photo-1503594384566-461fe158e797?w=800&h=900&fit=crop&auto=format&q=80',
  },
];

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
    name: 'Start',
    price: '0',
    pricePost: '/gratis',
    copy: 'Para probar y arrancar con consultas personales.',
    features: ['1 usuario', '20 consultas IA / mes', '5 contratos / mes', '2 créditos de análisis'],
  },
  {
    name: 'Pro',
    price: '29',
    pricePost: 'USD/mes',
    copy: 'El plan ideal para profesionales y equipos chicos.',
    features: ['5 usuarios', '100 consultas IA / mes', '25 contratos / mes', '10 créditos de análisis'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '79',
    pricePost: 'USD/mes',
    copy: 'Operación completa con soporte y escalabilidad.',
    features: ['Usuarios ilimitados', 'Consultas ilimitadas', 'API y SSO', '30 créditos incluidos'],
  },
];

const faqs = [
  ['¿Reemplaza a un profesional?', 'No. Acelera investigación, redacción y decisiones preliminares. Cuando una situación requiere firma o criterio humano, el asesor lo indica y deriva.'],
  ['¿Mis datos se usan para entrenar?', 'No. Tus conversaciones y documentos no entrenan ningún modelo. Cifrado en tránsito y en reposo, control de acceso por tenant.'],
  ['¿Cómo se maneja una emergencia médica o psicológica?', 'Antes de cualquier respuesta, el asesor de salud o bienestar deriva a las líneas oficiales (107, 911, 135) cuando detecta un caso crítico.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí. La cancelación es inmediata desde tu panel y surte efecto al final del período ya facturado. Sin letra chica.'],
];

const metrics = [
  ['5', 'asesores IA en uno'],
  ['24/7', 'respuesta inmediata'],
  ['LATAM', 'criterio regional'],
  ['AES-256', 'datos cifrados'],
];

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
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-soft"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
            aria-hidden="true"
          >
            <Scale className="h-4.5 w-4.5" strokeWidth={2.4} />
          </span>
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
            Probar gratis <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
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
            Cinco especialistas IA — una sola suscripción
          </div>

          <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-[var(--text-strong)]">
            Asesoría que entiende{' '}
            <span className="gradient-text">tu realidad</span>.
          </h1>

          <p className="mt-6 max-w-2xl text-[17px] leading-[1.65] text-[var(--text-medium)]">
            Legal, salud, finanzas, bienestar y hogar en un solo lugar. Cinco asesores IA entrenados para hablar tu idioma, conocer tu jurisdicción y darte respuestas claras sin esperar turno ni cobrar consulta.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/register"
              className="magnetic-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--cta)] px-7 py-4 text-[15px] font-bold text-white shadow-[0_12px_32px_rgba(230,126,34,0.4)] hover:bg-[var(--cta-dark)] transition-all"
            >
              Crear cuenta gratis <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </Link>
            <a
              href="#asesores"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)]/70 backdrop-blur px-7 py-4 text-[15px] font-bold text-[var(--text-strong)] hover:bg-[var(--surface)] transition-all"
            >
              Conocé los 5 asesores
            </a>
          </div>

          <p className="mt-5 text-[13px] text-[var(--text-muted)]">
            Sin tarjeta de crédito. Plan Start gratis para siempre.
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

        {/* Visual stack — 5 asesores como cards en isométrico */}
        <div className="lg:col-span-5 hidden lg:block reveal in-view" aria-hidden="true">
          <AdvisorStack />
        </div>
      </div>
    </section>
  );
}

function AdvisorStack() {
  return (
    <div className="relative h-[520px] [perspective:1400px]">
      {advisors.map((a, i) => {
        const Icon = a.icon;
        const rotation = -10 + i * 5;
        const offsetY = i * 18;
        const offsetX = i * 12 - 24;
        return (
          <div
            key={a.name}
            className="absolute left-1/2 top-1/2 w-[260px] rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-strong"
            style={{
              transform: `translate(-50%, -50%) translateX(${offsetX}px) translateY(${offsetY - 24}px) rotateZ(${rotation}deg)`,
              zIndex: 10 - i,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-soft"
                style={{ background: a.color }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-[15px] text-[var(--text-strong)] tracking-tight">{a.title}</p>
                <p className="text-[11.5px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{a.name}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-2 rounded-full bg-[var(--surface-subtle)] w-full" />
              <div className="h-2 rounded-full bg-[var(--surface-subtle)] w-4/5" />
              <div className="h-2 rounded-full bg-[var(--surface-subtle)] w-3/5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ADVISORS SECTION
// ============================================================
function AdvisorsSection() {
  return (
    <section id="asesores" className="relative bg-[var(--surface)] border-y border-[var(--border)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Tus 5 asesores"
          title="Cinco especialistas, una misma memoria."
          copy="Cada asesor tiene su personalidad, su tono y sus herramientas, pero comparten contexto: no tenés que repetirles tu situación cada vez."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {advisors.map((advisor, i) => {
            const Icon = advisor.icon;
            return (
              <RevealItem key={advisor.name} delay={i * 60}>
                <article className="bento-card group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] h-full">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={advisor.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t mix-blend-multiply opacity-90"
                      style={{ background: `linear-gradient(to top, ${advisor.color}, transparent 70%)` }}
                    />
                    <div
                      className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/15 backdrop-blur-md text-white"
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-display text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{ color: advisor.color }}>
                      {advisor.title}
                    </p>
                    <h3 className="mt-1 font-display text-[18px] font-bold text-[var(--text-strong)] tracking-tight">{advisor.name}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-medium)]">{advisor.copy}</p>
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
          title="Empezá gratis. Crecé cuando lo necesites."
          copy="Sin letra chica. Cancelás cuando quieras. Pagás solo si te alcanza el plan gratis y querés más."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
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
                    {plan.price === '0' ? '' : '$'}{plan.price}
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
                  Elegir {plan.name} <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
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
          Sin tarjeta. Plan Start gratis para siempre.
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
      className={`reveal ${visible ? 'in-view' : ''} h-full`}
      style={{ transitionDelay: `${Math.min(delay, 360)}ms` }}
    >
      {children}
    </div>
  );
}
