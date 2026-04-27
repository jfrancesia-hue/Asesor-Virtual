'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  FileText,
  HeartPulse,
  LockKeyhole,
  MessageSquareText,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';

const advisors = [
  {
    name: 'Legal',
    icon: Scale,
    tone: 'from-sky-400 to-blue-600',
    copy: 'Contratos, riesgos, clausulas y criterio juridico para LATAM.',
    image: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Salud',
    icon: HeartPulse,
    tone: 'from-emerald-300 to-teal-600',
    copy: 'Orientacion preventiva, habitos y triage responsable.',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Finanzas',
    icon: BriefcaseBusiness,
    tone: 'from-amber-300 to-orange-600',
    copy: 'Presupuestos, decisiones, impuestos y proyecciones claras.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Bienestar',
    icon: Brain,
    tone: 'from-fuchsia-300 to-violet-600',
    copy: 'Acompanamiento emocional, ejercicios y pausas guiadas.',
    image: 'https://images.unsplash.com/photo-1528319725582-ddc096101511?w=800&h=900&fit=crop&auto=format&q=80',
  },
  {
    name: 'Hogar',
    icon: Wrench,
    tone: 'from-lime-300 to-green-700',
    copy: 'Mantenimiento, reformas, diagnosticos y checklist domestico.',
    image: 'https://images.unsplash.com/photo-1503594384566-461fe158e797?w=800&h=900&fit=crop&auto=format&q=80',
  },
];

const metrics = [
  ['5', 'asesores IA'],
  ['24/7', 'respuesta inmediata'],
  ['AES-256', 'datos cifrados'],
  ['LATAM', 'criterio regional'],
];

const flow = [
  {
    title: 'Consulta natural',
    body: 'Hablas como hablarias con una persona: contexto, objetivo y urgencia. La plataforma ordena todo por ti.',
    icon: MessageSquareText,
  },
  {
    title: 'Criterio documentado',
    body: 'Cada asesor entrega pasos accionables, nivel de certeza y advertencias cuando hace falta derivar a un profesional.',
    icon: Bot,
  },
  {
    title: 'Historial reutilizable',
    body: 'Conversaciones, contratos, analisis y alertas quedan listos para volver, exportar o compartir.',
    icon: FileText,
  },
];

const plans = [
  {
    name: 'Start',
    price: '29',
    copy: 'Para uso personal o primeras consultas.',
    features: ['1 usuario', '20 consultas IA', '5 contratos al mes', '2 creditos de analisis'],
  },
  {
    name: 'Pro',
    price: '79',
    copy: 'El plan ideal para profesionales y equipos chicos.',
    features: ['5 usuarios', '100 consultas IA', '25 contratos al mes', '10 creditos de analisis'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '199',
    copy: 'Operacion completa con soporte y escalabilidad.',
    features: ['Usuarios ilimitados', 'Consultas ilimitadas', 'API y SSO', '30 creditos incluidos'],
  },
];

const faqs = [
  ['Reemplaza a un profesional?', 'No. Acelera investigacion, redaccion y decisiones preliminares. Cuando una situacion requiere firma o criterio humano, lo indica.'],
  ['Puedo levantarlo local?', 'Si. Frontend y backend compilan, y la API queda lista para correr con las variables del .env.example.'],
  ['Los datos se usan para entrenar?', 'No. El producto esta planteado para conversaciones privadas, con cifrado y control de acceso por tenant.'],
];

type Tilt = { x: number; y: number };

export default function LandingPage() {
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: Number((x * 2).toFixed(3)), y: Number((y * 2).toFixed(3)) });
  };

  return (
    <main className="next3d-body min-h-screen overflow-x-hidden text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#07090e]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/landing" className="flex items-center gap-3" aria-label="TuAsesor">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/40 bg-emerald-300/10 shadow-[0_0_32px_rgba(45,212,191,.22)]">
              <Sparkles className="h-4 w-4 text-emerald-200" />
            </span>
            <span className="font-brand text-sm font-extrabold uppercase tracking-[0.18em] text-white">
              TuAsesor
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#asesores" className="transition hover:text-white">Asesores</a>
            <a href="#workflow" className="transition hover:text-white">Flujo</a>
            <a href="#planes" className="transition hover:text-white">Planes</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden rounded-lg px-3 py-2 text-sm text-white/72 transition hover:bg-white/10 hover:text-white sm:inline-flex">
              Ingresar
            </Link>
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-200">
              Probar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section
        className="next3d-hero relative flex min-h-[88svh] items-center overflow-hidden px-4 pt-24 sm:px-6 lg:px-8"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="next3d-aurora" aria-hidden="true" />
        <div className="next3d-grid" aria-hidden="true" />
        <HoloScene tilt={tilt} mounted={mounted} />

        <div className="relative z-10 mx-auto w-full max-w-7xl pb-14 pt-16">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
              <Zap className="h-3.5 w-3.5" />
              SaaS multi-asesor con IA
            </div>

            <h1 className="font-brand text-[clamp(3.2rem,9vw,8.8rem)] font-extrabold leading-[0.86] tracking-normal text-white">
              Tu consejo
              <span className="block bg-[linear-gradient(100deg,#7dd3fc,#bbf7d0,#facc15,#fb7185)] bg-clip-text text-transparent">
              en 3D.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Legal, salud, finanzas, bienestar y hogar en una sola experiencia. Una interfaz rapida, visual y preparada para equipos que necesitan respuestas claras sin perder contexto.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-[0_20px_60px_rgba(52,211,153,.28)] transition hover:-translate-y-0.5 hover:bg-white">
                Empezar ahora <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#asesores" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/16 bg-white/8 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/14">
                Ver experiencia <Play className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-11 hidden max-w-3xl grid-cols-2 gap-3 sm:grid sm:grid-cols-4">
              {metrics.map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3 backdrop-blur-md">
                  <div className="text-xl font-black text-white">{value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="asesores" className="relative border-t border-white/10 bg-[#0b1019] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro eyebrow="Asesores" title="Cinco especialistas, una misma memoria." copy="Cada area tiene personalidad, tono y herramientas propias, pero comparte contexto para que el usuario no tenga que empezar de cero." />
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {advisors.map((advisor) => {
              const Icon = advisor.icon;
              return (
                <article key={advisor.name} className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={advisor.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 20vw, 100vw"
                      className="object-cover opacity-65 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-85 group-hover:grayscale-0"
                    />
                    <div className={`absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t ${advisor.tone} opacity-75 mix-blend-screen`} />
                    <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-black/35 backdrop-blur">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-black text-white">{advisor.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{advisor.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative bg-[#eef4ed] px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro dark eyebrow="Workflow" title="Menos friccion. Mas decisiones." copy="El producto esta pensado para operar: preguntar, resolver, guardar y seguir. Sin decoracion que estorbe al trabajo diario." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {flow.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-slate-950/10 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,.08)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">0{index + 1}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-2xl font-black tracking-normal">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="planes" className="bg-[#07090e] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro eyebrow="Planes" title="Listo para vender desde el primer dia." copy="Precios simples, beneficios entendibles y una ruta clara desde prueba hasta equipo completo." />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`rounded-lg border p-6 ${plan.featured ? 'border-emerald-300 bg-emerald-300 text-slate-950 shadow-[0_30px_90px_rgba(52,211,153,.22)]' : 'border-white/10 bg-white/[0.045] text-white'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black">{plan.name}</h3>
                    <p className={`mt-2 text-sm leading-6 ${plan.featured ? 'text-slate-800' : 'text-slate-300'}`}>{plan.copy}</p>
                  </div>
                  {plan.featured && <BadgeCheck className="h-6 w-6" />}
                </div>
                <div className="mt-7 flex items-end gap-1">
                  <span className="text-5xl font-black">${plan.price}</span>
                  <span className={`pb-1 text-sm ${plan.featured ? 'text-slate-700' : 'text-slate-400'}`}>/mes</span>
                </div>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition ${plan.featured ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-white text-slate-950 hover:bg-emerald-200'}`}>
                  Elegir plan <ChevronRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111827] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, 'Arquitectura multi-tenant'],
            [LockKeyhole, 'JWT, CORS y validacion global'],
            [Sparkles, 'Frontend compilado y optimizado'],
          ].map(([Icon, label]) => {
            const TypedIcon = Icon as typeof ShieldCheck;
            return (
              <div key={label as string} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-4">
                <TypedIcon className="h-5 w-5 text-emerald-200" />
                <span className="text-sm font-bold text-white">{label as string}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section id="faq" className="bg-[#eef4ed] px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionIntro dark eyebrow="FAQ" title="Preguntas antes de levantar." copy="Lo esencial para probar, vender y seguir iterando sin misterio." />
          <div className="mt-9 divide-y divide-slate-950/10 rounded-lg border border-slate-950/10 bg-white">
            {faqs.map(([q, a]) => (
              <details key={q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-lg font-black">
                  {q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#07090e] px-4 py-20 sm:px-6 lg:px-8">
        <div className="next3d-footer-glow" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">TuAsesor</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-normal text-white sm:text-6xl">
              Una web con presencia. Un producto listo para moverse.
            </h2>
          </div>
          <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200">
            Crear cuenta <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function HoloScene({ tilt, mounted }: { tilt: Tilt; mounted: boolean }) {
  return (
    <div
      className="next3d-scene-wrap pointer-events-none absolute inset-0 z-0"
      style={
        {
          '--rx': `${tilt.y * -4 + 16}deg`,
          '--ry': `${tilt.x * 7}deg`,
        } as CSSProperties & Record<string, string>
      }
      aria-hidden="true"
    >
      <div className={`next3d-scene ${mounted ? 'is-mounted' : ''}`}>
        <div className="next3d-ring next3d-ring-a" />
        <div className="next3d-ring next3d-ring-b" />
        <div className="next3d-core">
          <div className="next3d-core-inner" />
        </div>
        <div className="next3d-panel next3d-panel-a">
          <span>Legal risk</span>
          <strong>12%</strong>
        </div>
        <div className="next3d-panel next3d-panel-b">
          <span>Response</span>
          <strong>1.8s</strong>
        </div>
        <div className="next3d-panel next3d-panel-c">
          <span>Credits</span>
          <strong>30</strong>
        </div>
        <div className="next3d-orbit next3d-orbit-a" />
        <div className="next3d-orbit next3d-orbit-b" />
      </div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, copy, dark = false }: { eyebrow: string; title: string; copy: string; dark?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-black uppercase tracking-[0.22em] ${dark ? 'text-emerald-700' : 'text-emerald-200'}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-4xl font-black tracking-normal sm:text-5xl ${dark ? 'text-slate-950' : 'text-white'}`}>{title}</h2>
      <p className={`mt-5 text-base leading-8 ${dark ? 'text-slate-600' : 'text-slate-300'}`}>{copy}</p>
    </div>
  );
}
