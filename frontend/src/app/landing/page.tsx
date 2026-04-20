'use client';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Editorial landing — "Mi Asesor"                              */
/*  Direction: warm paper + ink + oxblood. Magazine spread, not SaaS. */
/* ------------------------------------------------------------------ */

const ADVISORS = [
  {
    num: '01',
    title: 'Legal',
    sub: 'Derecho civil · Contratos · Jurisprudencia LATAM',
    body:
      'Análisis contractual, redacción y revisión de cláusulas, interpretación normativa para Argentina, México y Colombia. Jurisprudencia actualizada con RAG.',
    tags: ['AR', 'MX', 'CO'],
    img: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=900&h=1100&fit=crop&auto=format&q=80',
    caption: 'Archivo · Códigos civiles',
  },
  {
    num: '02',
    title: 'Salud',
    sub: 'Orientación preventiva · Triaje · Bienestar',
    body:
      'Evaluación de síntomas, recomendaciones nutricionales, hábitos y prevención. Criterio clínico basado en guías internacionales — nunca reemplaza a un profesional.',
    tags: ['Preventiva', 'Nutrición'],
    img: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=900&h=1100&fit=crop&auto=format&q=80',
    caption: 'Expediente · Historia clínica',
  },
  {
    num: '03',
    title: 'Finanzas',
    sub: 'Planificación · Inversiones · Impuestos locales',
    body:
      'Presupuesto personal y de PYME, estrategias de inversión adaptadas a inflación y riesgo LATAM, obligaciones fiscales por jurisdicción.',
    tags: ['PYME', 'Particular'],
    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&h=1100&fit=crop&auto=format&q=80',
    caption: 'Estado · Balance trimestral',
  },
  {
    num: '04',
    title: 'Bienestar',
    sub: 'Escucha · Ansiedad · Equilibrio emocional',
    body:
      'Acompañamiento empático, técnicas de regulación emocional, ejercicios guiados de respiración y reflexión. Espacio confidencial, sin juicios.',
    tags: ['Confidencial'],
    img: 'https://images.unsplash.com/photo-1528319725582-ddc096101511?w=900&h=1100&fit=crop&auto=format&q=80',
    caption: 'Cuaderno · Reflexiones',
  },
  {
    num: '05',
    title: 'Hogar',
    sub: 'Mantenimiento · Reformas · Trámites domésticos',
    body:
      'Diagnóstico de plomería y electricidad básica, presupuesto de reformas, jardinería estacional y coordinación de servicios técnicos.',
    tags: ['Técnico', 'Servicios'],
    img: 'https://images.unsplash.com/photo-1503594384566-461fe158e797?w=900&h=1100&fit=crop&auto=format&q=80',
    caption: 'Bitácora · Obra doméstica',
  },
];

const STEPS = [
  {
    num: 'I',
    title: 'Formula tu consulta',
    body: 'Escribe con lenguaje natural. No hay formularios, no hay menús. La interfaz es la conversación.',
  },
  {
    num: 'II',
    title: 'Recibe criterio, no respuestas genéricas',
    body: 'Cada asesor cita fuente, jurisdicción y nivel de certeza. Nada se inventa. Si algo requiere un humano, lo dice.',
  },
  {
    num: 'III',
    title: 'Conserva, exporta, comparte',
    body: 'Todo queda archivado, exportable en PDF, firmable digitalmente. Tu historial es tuyo, cifrado de extremo a extremo.',
  },
];

const PLANS = [
  {
    id: 'start',
    label: 'Inicio',
    price: 29,
    cadence: 'USD / mes',
    audience: 'Uso individual',
    includes: ['1 asesor a elección', '50 consultas al mes', 'Análisis de documentos · 10 MB', 'Correo de soporte'],
    cta: 'Comenzar',
    highlight: false,
  },
  {
    id: 'pro',
    label: 'Profesional',
    price: 79,
    cadence: 'USD / mes',
    audience: 'Profesionales y equipos',
    includes: [
      'Los cinco asesores',
      'Consultas ilimitadas',
      'Análisis avanzado · 100 MB',
      'Firma digital integrada',
      'Soporte prioritario',
    ],
    cta: 'Adquirir Profesional',
    highlight: true,
  },
  {
    id: 'enterprise',
    label: 'Corporativo',
    price: 199,
    cadence: 'USD / mes',
    audience: 'Organizaciones',
    includes: [
      'Instancia dedicada',
      'Usuarios ilimitados',
      'API y SSO',
      'Cumplimiento y auditoría',
      'Gestor de cuenta',
    ],
    cta: 'Contactar ventas',
    highlight: false,
  },
];

const FAQS = [
  {
    q: '¿La asesoría tiene validez legal?',
    a: 'Nuestra IA ofrece criterio fundamentado en normativa y jurisprudencia actualizada, pero no reemplaza la firma de un profesional colegiado. Para trámites oficiales definitivos recomendamos revisión humana — que el mismo sistema sabrá sugerirte cuando corresponda.',
  },
  {
    q: '¿Cómo protegen mis datos?',
    a: 'Cifrado AES-256 en reposo, TLS 1.3 en tránsito. Cumplimos con Ley 25.326 (AR), LGPD (BR) y GDPR. Nunca entrenamos modelos con tus conversaciones. Tienes derecho de exportación y eliminación total en un clic.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. No hay contratos de permanencia, no hay penalidades. La cancelación es inmediata desde tu panel. Tu información queda disponible para exportar durante 30 días y después se elimina definitivamente.',
  },
  {
    q: '¿Qué idiomas y jurisdicciones cubren?',
    a: 'Español rioplatense, mexicano y neutro; portugués de Brasil. Jurisdicciones: Argentina, México, Colombia, Chile, Perú, Uruguay y Brasil. El asesor Legal adapta referencias normativas a tu país de residencia.',
  },
  {
    q: '¿Puedo integrar Mi Asesor con mis sistemas?',
    a: 'El plan Corporativo incluye API REST y webhooks, SSO vía SAML u OIDC, y conectores para las principales suites de gestión documental. Nuestro equipo de implementación acompaña la integración.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ana Gutiérrez',
    role: 'Abogada independiente',
    city: 'Buenos Aires',
    quote:
      'Uso el asesor Legal para redactar primeros borradores de contratos y escritos. Me devuelve tres a cuatro horas de trabajo por día y la calidad de redacción es impecable.',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=700&fit=crop&auto=format&q=80',
    rating: 'AR · 2 años de uso',
  },
  {
    name: 'Rodrigo Méndez',
    role: 'CFO de PYME industrial',
    city: 'Ciudad de México',
    quote:
      'La consultora financiera que teníamos nos cobraba lo mismo en un mes que la suscripción Corporativa en un año. La migración fue obvia.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&auto=format&q=80',
    rating: 'MX · Plan Corporativo',
  },
  {
    name: 'Lucía Camargo',
    role: 'Emprendedora gastronómica',
    city: 'Bogotá',
    quote:
      'El asesor de Bienestar me acompañó en una etapa complicada del primer año de negocio. No reemplaza terapia, pero me dio herramientas todos los días.',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=700&fit=crop&auto=format&q=80',
    rating: 'CO · Plan Profesional',
  },
];

const CLIENTS = [
  'Fundación Novella',
  'Estudio Rioja',
  'Central PYME',
  'Monte & Asociados',
  'Casa Avellaneda',
  'Grupo Boreal',
  'Iriarte Legal',
  'Cámara del Sur',
];

const NAV_LINKS = [
  { label: 'Asesores', href: '#asesores' },
  { label: 'Método', href: '#metodo' },
  { label: 'Tarifario', href: '#tarifario' },
  { label: 'Preguntas', href: '#preguntas' },
];

const CITIES = [
  'Buenos Aires', 'Ciudad de México', 'Bogotá', 'Santiago', 'Lima',
  'Montevideo', 'Asunción', 'Quito', 'São Paulo', 'Caracas',
];

const LIVE_QUERIES = [
  'Contrato de locación · CABA',
  'Deducción de monotributo · AR',
  'Síntomas persistentes · consulta preventiva',
  'Reforma de baño · presupuesto',
  'Regulación emocional · pausa laboral',
  'Herencia intestada · proceso sucesorio',
];

const HERO_STATS: Array<{ k: string; target: number; render: (n: number) => string }> = [
  { k: 'Jurisdicciones', target: 7, render: (n) => `${n} países` },
  { k: 'Idiomas', target: 2, render: (n) => (n < 2 ? '—' : 'ES · PT') },
  { k: 'Disponibilidad', target: 24, render: (n) => `${n} / 7` },
  { k: 'Cifrado', target: 256, render: (n) => `AES-${n}` },
];

const BIG_STATS = [
  { k: '2.400', v: 'Suscriptores activos' },
  { k: '97%', v: 'Retención anual' },
  { k: '4,8 / 5', v: 'Calificación media' },
  { k: '< 2 s', v: 'Tiempo de respuesta' },
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-visible');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}


function formatDate() {
  const d = new Date();
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ---------------- Brand logo — "ma." mark (Mi Asesor) ----------------
 * Atomic mark per brandbook: Inter 800 lowercase, tight tracking,
 * dot = 19% of size, gap = 4%, vertical offset from baseline = 8%.
 * Color of dot signals sub-brand (green = general).
 */
function MaMark({
  size = 32,
  inkColor = '#0f1011',
  dotColor = '#00a86b',
  withDot = true,
}: {
  size?: number;
  inkColor?: string;
  dotColor?: string;
  withDot?: boolean;
}) {
  const dotSize = size * 0.19;
  const dotGap = size * 0.04;
  const dotOffset = size * 0.08;
  return (
    <span
      className="inline-flex items-baseline shrink-0"
      style={{
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: -size * 0.06,
        color: inkColor,
      }}
    >
      <span>ma</span>
      {withDot && (
        <span
          style={{
            width: dotSize,
            height: dotSize,
            background: dotColor,
            borderRadius: '50%',
            display: 'inline-block',
            marginLeft: dotGap,
            marginBottom: dotOffset,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

/* ---------------- Page ---------------- */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [date, setDate] = useState<string>('');
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDate(formatDate());
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      if (progressRef.current) {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        progressRef.current.style.transform = `scaleX(${p})`;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="editorial-body editorial-grain min-h-screen font-body selection:bg-oxblood selection:text-paper">
      {/* Scroll progress bar */}
      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
      {/* -------------------- MASTHEAD -------------------- */}
      <div className="relative z-20 border-b border-ink/15 bg-paper/95">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-editorial text-ink-muted gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:inline">Edición N° 007</span>
            <span className="hidden sm:inline opacity-30">·</span>
            <span>{date || '—'}</span>
          </div>
          {/* Live ticker */}
          <div className="hidden md:flex items-center gap-4 flex-1 min-w-0 justify-center">
            <span className="text-mustard-deep shrink-0 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-mustard rounded-full" style={{ boxShadow: '0 0 0 0 rgba(200,167,77,0.7)', animation: 'pulseDot 1.8s ease-out infinite' }} />
              En vivo
            </span>
            <div className="ticker-panel flex-1 text-ink max-w-[420px]">
              <div className="ticker-track">
                {LIVE_QUERIES.concat(LIVE_QUERIES[0]).map((q, i) => (
                  <span key={i} className="truncate">
                    <span className="text-oxblood mr-2">—</span>
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-brand-dot rounded-full animate-pulse" />
            <span>En servicio</span>
          </div>
        </div>
      </div>

      {/* -------------------- NAV -------------------- */}
      <nav
        className={`sticky top-0 z-30 bg-paper/95 backdrop-blur-sm transition-all duration-300 ${
          scrolled ? 'border-b border-ink/12 shadow-[0_1px_0_rgba(24,18,13,0.04)]' : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 md:gap-4 group shrink-0" aria-label="Mi Asesor">
            <MaMark size={30} inkColor="#0f1011" dotColor="#00a86b" />
            <div className="hidden sm:flex flex-col leading-none pl-4 border-l border-ink/20 min-w-0">
              <span
                className="font-brand text-[15px] text-ink whitespace-nowrap"
                style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                Mi Asesor
              </span>
              <span className="font-brand text-[9.5px] uppercase text-ink-muted mt-1 whitespace-nowrap" style={{ letterSpacing: '0.14em', fontWeight: 500 }}>
                Asesoría virtual
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8 xl:gap-10 mx-6">
            {NAV_LINKS.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className="editorial-navlink text-[13px] text-ink font-body whitespace-nowrap"
              >
                <span className="font-mono text-oxblood mr-1.5 text-[11px]">{String(i + 1).padStart(2, '0')}</span>
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            <Link href="/auth/login" className="hidden sm:inline editorial-link text-[13px] text-ink">
              Ingresar
            </Link>
            <Link
              href="/auth/register"
              className="btn-oxblood text-[11px] md:text-[12px] uppercase tracking-editorial font-mono px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap"
            >
              <span className="sm:hidden">Suscribir</span>
              <span className="hidden sm:inline">Suscribirse</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* -------------------- HERO -------------------- */}
      <section className="relative">
        <div className="max-w-[1400px] mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-24">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7 edit-stagger">
              <div className="flex items-center gap-3 mb-10">
                <span className="font-mono text-[11px] uppercase tracking-editorial text-oxblood">
                  N° 01
                </span>
                <span className="h-px flex-1 bg-ink/20" />
                <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted">
                  Consejo inteligente
                </span>
              </div>

              <h1
                className="font-display text-ink leading-[0.95] tracking-display text-[clamp(2.6rem,7vw,6rem)]"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 0" }}
              >
                Cinco especialistas.
                <br />
                Una{' '}
                <em
                  className="text-oxblood"
                  style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}
                >
                  conversación
                </em>
                .
              </h1>

              <p className="mt-10 max-w-[52ch] text-[17px] leading-[1.65] text-ink-muted">
                Asesoría especializada en derecho, salud, finanzas, bienestar y hogar — disponible a toda hora,
                hablando el castellano de tu calle y con criterio documentado para Argentina, México y el resto de
                la región.
              </p>

              <div className="mt-12 flex flex-wrap items-center gap-8">
                <Link
                  href="/auth/register"
                  className="btn-oxblood text-[12px] uppercase tracking-editorial font-mono px-8 py-4"
                >
                  Iniciar suscripción
                </Link>
                <a href="#asesores" className="btn-ghost text-[13px] tracking-wide">
                  Conocer a los cinco asesores →
                </a>
              </div>

              <HeroStats />
              <div className="mt-8 flex items-center gap-3">
                <span className="pulse-stamp text-oxblood">
                  Consultas respondidas hoy · <CountUpInline target={184} />
                </span>
              </div>
            </div>

            <aside className="col-span-12 lg:col-span-5 lg:pl-10 lg:border-l lg:border-ink/12 lg:pt-4">
              <div className="sticky top-28">
                <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted mb-6">
                  Índice · edición vigente
                </div>
                <ul className="space-y-0 edit-stagger">
                  {ADVISORS.map((a) => (
                    <li key={a.num}>
                      <a href="#asesores" className="advisor-entry block border-t border-ink/12 py-5 group">
                        <div className="flex items-baseline gap-4">
                          <span className="advisor-marker font-mono text-[12px] text-ink-muted pt-1">
                            {a.num}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <h3
                                className="advisor-title font-display text-[26px] text-ink leading-none tracking-display"
                                style={{ fontVariationSettings: "'opsz' 32" }}
                              >
                                {a.title}
                              </h3>
                              <span className="font-mono text-[10px] uppercase tracking-editorial text-ink-subtle">
                                pág. {a.num}
                              </span>
                            </div>
                            <div className="mt-1.5 text-[12px] text-ink-muted leading-snug">{a.sub}</div>
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                  <li className="border-t border-ink/12" />
                </ul>

                <div className="mt-10 p-6 bg-paper-soft border-l-2 border-oxblood">
                  <p className="pull-quote text-[17px] leading-[1.4] text-ink">
                    "Un asesor para la vida práctica: la que empieza con una duda a las tres de la mañana."
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                    — Cuaderno de bitácora
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* -------------------- COVER PHOTO — "Portada del número" -------------------- */}
      <section className="relative">
        <div className="max-w-[1400px] mx-auto px-6 pb-20">
          <div className="photo-frame relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-ink/12">
              <span className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                Portada · Edición N° 007
              </span>
              <span className="font-mono text-[10px] uppercase tracking-editorial text-oxblood">
                Fotografía de apertura
              </span>
            </div>
            <div className="photo-inner duotone-warm h-[360px] md:h-[520px]">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&h=1000&fit=crop&auto=format&q=85"
                alt="Escritorio editorial con documentos"
              />
              {/* Overlay title */}
              <div className="absolute inset-0 flex items-end p-8 md:p-14 z-10">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-editorial text-paper/70 mb-3">
                    Sumario
                  </div>
                  <h3
                    className="font-display text-paper text-[clamp(1.4rem,3.2vw,2.8rem)] leading-[1.1] tracking-display max-w-[24ch]"
                    style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 0" }}
                  >
                    El oficio de preguntar{' '}
                    <em className="text-oxblood-soft" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}>
                      bien
                    </em>{' '}
                    todavía es humano. La respuesta, ya no tanto.
                  </h3>
                </div>
              </div>
              {/* Registration marks */}
              <div className="reg-mark" style={{ top: 16, left: 16, borderColor: 'rgba(244,238,227,0.6)' }} />
              <div className="reg-mark" style={{ top: 16, right: 16, borderColor: 'rgba(244,238,227,0.6)' }} />
              <div className="reg-mark" style={{ bottom: 16, left: 16, borderColor: 'rgba(244,238,227,0.6)' }} />
              <div className="reg-mark" style={{ bottom: 16, right: 16, borderColor: 'rgba(244,238,227,0.6)' }} />
            </div>
            <div className="photo-caption">
              <span>Fig. 01 — Escena editorial</span>
              <span>Redacción · LATAM</span>
            </div>
            {/* Floating badge */}
            <div className="floating-badge hidden md:flex" style={{ top: '-30px', right: '-30px' }}>
              Edición<br />especial<br />N° 007
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- TRUSTED BY / CLIENTS STRIP -------------------- */}
      <section className="border-y border-ink/15 bg-paper-soft">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <span className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted whitespace-nowrap shrink-0">
              En confianza de — más de 2.400 suscriptores
            </span>
            <div className="marquee-wrap flex-1 min-w-0">
              <div className="clients-marquee whitespace-nowrap items-center">
                {[...CLIENTS, ...CLIENTS].map((c, i) => (
                  <span key={i} className="inline-flex items-center">
                    <span
                      className="client-logo font-display text-[18px] md:text-[22px]"
                      style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 30" }}
                    >
                      {c}
                    </span>
                    <span className="text-ink/25 mx-10 text-[14px]">·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION DIVIDER -------------------- */}
      <SectionHeader eyebrow="N° 02" title="Los cinco asesores" kicker="Un equipo siempre disponible" />

      {/* -------------------- ADVISORS LONG — with portrait photos -------------------- */}
      <section id="asesores" className="pb-28">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-12 gap-8 mb-16">
            <div className="col-span-12 lg:col-span-4">
              <p
                className="drop-cap font-display text-[19px] leading-[1.45] text-ink"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                El formato es deliberadamente sencillo. Cinco voces, cada una con su oficio, todas entrenadas
                para responder con <span className="mustard-mark">citas, jurisdicción y nivel de certeza</span>. No hay sermones ni respuestas de relleno:
                si algo requiere un humano, el propio asesor te lo indica.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <BigStats />
            </div>
          </div>

          <ul className="edit-stagger">
            {ADVISORS.map((a) => (
              <li
                key={a.num}
                className="advisor-entry group grid grid-cols-12 gap-6 py-10 border-t border-ink/15 items-start"
              >
                <div className="col-span-12 md:col-span-3">
                  <div className="photo-frame">
                    <div className="photo-inner duotone-ink aspect-[4/5]">
                      <img src={a.img} alt={a.title} />
                    </div>
                    <div className="photo-caption">
                      <span>{a.caption}</span>
                      <span>N° {a.num}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-1 pt-2">
                  <span className="advisor-marker font-mono text-[13px] text-ink-muted inline-block">
                    {a.num}
                  </span>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <h3
                    className="advisor-title font-display text-[44px] md:text-[64px] leading-[0.95] tracking-display text-ink"
                    style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 40" }}
                  >
                    {a.title}
                  </h3>
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-editorial text-oxblood">
                    {a.sub}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <p className="text-[16px] leading-[1.65] text-ink-muted">{a.body}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] uppercase tracking-editorial text-ink border border-ink/25 px-2.5 py-1"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
            <li className="border-t border-ink/15" />
          </ul>
        </div>
      </section>

      {/* -------------------- MANIFIESTO (dark break) -------------------- */}
      <section className="manifesto relative">
        <div className="manifesto-grain" />
        <div className="relative max-w-[1400px] mx-auto px-6 py-28 md:py-36">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-3">
              <div className="font-mono text-[10px] uppercase tracking-editorial text-mustard mb-4">
                Manifiesto
              </div>
              <div className="hidden md:block h-px w-24 bg-mustard/60 mb-6" />
              <p className="font-mono text-[11px] uppercase tracking-editorial text-paper/60 leading-relaxed">
                Lo que creemos<br />sobre el oficio<br />de aconsejar
              </p>
            </div>

            <div className="col-span-12 md:col-span-9">
              <h2
                className="font-display text-[clamp(2rem,5vw,4.2rem)] leading-[1] tracking-display text-paper"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 0" }}
              >
                Creemos que el{' '}
                <em className="text-mustard" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}>
                  consejo
                </em>{' '}
                no es un producto. Es una{' '}
                <em className="text-oxblood-soft" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}>
                  conversación
                </em>{' '}
                con alguien que <span className="mustard-mark text-ink">sabe</span>, en el momento en que la necesitás.
              </h2>

              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {[
                  {
                    n: '01',
                    h: 'Nada se inventa',
                    b: 'Cada respuesta cita su fuente. Si el asesor no tiene evidencia, lo dice. Preferimos decir "no sé" antes que sonar seguros sin estarlo.',
                  },
                  {
                    n: '02',
                    h: 'No reemplaza humanos',
                    b: 'Cuando tu consulta exige firma, criterio clínico o empatía profunda, el mismo sistema te recomienda un profesional. No peleamos por territorio.',
                  },
                  {
                    n: '03',
                    h: 'La conversación es tuya',
                    b: 'Tu historial se cifra, se exporta y se elimina cuando vos decidas. No entrenamos modelos con tus preguntas. Nunca vendemos datos.',
                  },
                ].map((p) => (
                  <div key={p.n} className="border-t border-paper/20 pt-5">
                    <div className="font-mono text-[11px] uppercase tracking-editorial text-mustard mb-3">
                      {p.n} · Principio
                    </div>
                    <h4
                      className="font-display text-[26px] leading-[1.1] text-paper tracking-display"
                      style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
                    >
                      {p.h}
                    </h4>
                    <p className="mt-3 text-[14px] leading-[1.65] text-paper/70">{p.b}</p>
                  </div>
                ))}
              </div>

              <div className="mt-14 flex items-center gap-6">
                <div className="pulse-stamp text-mustard">Transmitido desde Buenos Aires</div>
                <div className="text-[11px] font-mono uppercase tracking-editorial text-paper/40">
                  Firmado por la redacción · 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- REPORTAGE — featured story spread -------------------- */}
      <section className="relative border-t border-ink/15 bg-paper-soft">
        <div className="max-w-[1400px] mx-auto px-6 py-24">
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Large photo */}
            <div className="col-span-12 lg:col-span-7">
              <div className="photo-frame">
                <div className="photo-inner duotone-ink aspect-[4/5] md:aspect-[6/7]">
                  <img
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&h=1600&fit=crop&auto=format&q=85"
                    alt="Conversación editorial"
                  />
                </div>
                <div className="photo-caption">
                  <span>Reportaje · La consulta que se posterga</span>
                  <span>Fotografía por J. Arévalo</span>
                </div>
              </div>
            </div>

            {/* Text column */}
            <div className="col-span-12 lg:col-span-5 lg:pl-8">
              <div className="font-mono text-[10px] uppercase tracking-editorial text-oxblood mb-4">
                Reportaje · N° 03
              </div>
              <h2
                className="font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[0.98] tracking-display text-ink"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
              >
                La pregunta que venías{' '}
                <em className="text-oxblood" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}>
                  esquivando
                </em>
                .
              </h2>

              <p
                className="drop-cap mt-8 font-display text-[18px] leading-[1.5] text-ink"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                Hay consultas que no hacemos porque la cita cuesta, porque el trámite incomoda, porque el profesional
                cobra por hora lo que nosotros ganamos por día. Tres de cada cinco decisiones importantes — legales,
                financieras, médicas — se toman sin consejo. No por soberbia: por fricción.
              </p>

              <p className="mt-5 text-[15px] leading-[1.7] text-ink-muted">
                Mi Asesor existe para esas preguntas. Las que importan pero no son urgentes. Las que serían
                obvias si estuvieras sentado frente a alguien que sabe. Las que hasta ahora costaban demasiado como
                para hacerse.
              </p>

              <div className="mt-10 flex items-center gap-6">
                <div className="edit-stamp">
                  Editado en<br />
                  Buenos Aires<br />
                  2026
                </div>
                <div className="flex-1 border-l border-ink/20 pl-6">
                  <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                    Cita textual
                  </div>
                  <p
                    className="pull-quote mt-2 text-[18px] leading-[1.35] text-ink"
                    style={{ fontVariationSettings: "'opsz' 30, 'SOFT' 100" }}
                  >
                    "El acceso a buen consejo siempre fue un privilegio. Dejó de serlo."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- METHOD -------------------- */}
      <SectionHeader eyebrow="N° 04" title="Método de consulta" kicker="Tres pasos, sin ceremonias" />

      <section id="metodo" className="pb-28 bg-paper-soft">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className={`relative p-8 md:p-12 ${
                  i !== 0 ? 'md:border-l md:border-ink/12' : ''
                } ${i !== STEPS.length - 1 ? 'border-b md:border-b-0 border-ink/12' : ''}`}
              >
                <div
                  className="font-display text-[120px] leading-none text-oxblood/90 tracking-display"
                  style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}
                >
                  {s.num}
                </div>
                <h4
                  className="mt-6 font-display text-[28px] leading-[1.1] text-ink tracking-display"
                  style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
                >
                  {s.title}
                </h4>
                <p className="mt-4 text-[15px] leading-[1.65] text-ink-muted max-w-[36ch]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- TESTIMONIALS -------------------- */}
      <SectionHeader eyebrow="N° 05" title="Lectores, suscriptores" kicker="Voces desde Latinoamérica" />

      <section className="pb-28">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <article key={t.name} className="flex flex-col">
                <div className="photo-frame mb-6">
                  <div className="photo-inner duotone-ink aspect-[5/6]">
                    <img src={t.img} alt={t.name} />
                  </div>
                  <div className="photo-caption">
                    <span>{t.rating}</span>
                    <span>Retrato</span>
                  </div>
                </div>
                <span className="quote-mark" aria-hidden="true">“</span>
                <p
                  className="pull-quote text-[19px] leading-[1.45] text-ink"
                  style={{ fontVariationSettings: "'opsz' 30, 'SOFT' 80" }}
                >
                  {t.quote}
                </p>
                <div className="mt-6 pt-5 border-t border-ink/15">
                  <div
                    className="font-display text-[22px] text-ink leading-none tracking-display"
                    style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 40" }}
                  >
                    {t.name}
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                    {t.role} · {t.city}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- PRICING — RATE CARD -------------------- */}
      <SectionHeader eyebrow="N° 06" title="Tarifario vigente" kicker="Sin letra chica ni permanencia" />

      <section id="tarifario" className="pb-28">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="border-t-2 border-ink">
            {PLANS.map((p, i) => (
              <div
                key={p.id}
                className={`plan-row grid grid-cols-12 gap-6 py-10 items-start border-b border-ink/15 ${
                  p.highlight ? 'bg-paper-soft' : ''
                }`}
              >
                <div className="col-span-12 md:col-span-2">
                  <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                    Plan {String(i + 1).padStart(2, '0')}
                  </div>
                  <h4
                    className="mt-2 font-display text-[32px] leading-none text-ink tracking-display"
                    style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
                  >
                    {p.label}
                  </h4>
                  {p.highlight && (
                    <div className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-editorial text-oxblood">
                      <span className="w-1.5 h-1.5 bg-oxblood" />
                      Recomendado
                    </div>
                  )}
                </div>

                <div className="col-span-12 md:col-span-2 md:pl-4">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-display text-[64px] leading-none text-ink tracking-display"
                      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
                    >
                      ${p.price}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                    {p.cadence}
                  </div>
                  <div
                    className="mt-2 text-[13px] text-ink-muted italic font-display"
                    style={{ fontVariationSettings: "'opsz' 16, 'SOFT' 100" }}
                  >
                    {p.audience}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {p.includes.map((feat) => (
                      <li key={feat} className="flex items-baseline gap-2.5 text-[14px] text-ink">
                        <span className="text-oxblood font-mono text-[11px] mt-0.5">—</span>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-span-12 md:col-span-2 md:text-right">
                  <Link
                    href="/auth/register"
                    className={
                      p.highlight
                        ? 'btn-oxblood inline-block text-[11px] uppercase tracking-editorial font-mono px-6 py-3.5 text-center'
                        : 'btn-ghost inline-block text-[13px]'
                    }
                  >
                    {p.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 font-mono text-[11px] uppercase tracking-editorial text-ink-muted">
            Los precios están expresados en dólares estadounidenses. No se aplican impuestos adicionales para consumidores finales en LATAM. Cancelación inmediata desde el panel.
          </p>
        </div>
      </section>

      {/* -------------------- FAQ -------------------- */}
      <SectionHeader eyebrow="N° 07" title="Preguntas frecuentes" kicker="Lo que nos preguntan antes de suscribirse" />

      <section id="preguntas" className="pb-28">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-3">
              <p
                className="font-display text-[20px] leading-[1.35] text-ink italic"
                style={{ fontVariationSettings: "'opsz' 20, 'SOFT' 100" }}
              >
                Si tu duda no está acá, escribinos. Respondemos en el día — y casi siempre lo hace un humano.
              </p>
              <a href="mailto:hola@miasesor.app" className="editorial-link mt-4 inline-block text-[13px] text-oxblood">
                hola@miasesor.app
              </a>
              <div className="mt-8 edit-stamp">
                Respuesta<br />
                garantizada<br />
                en 24 h
              </div>
            </div>
            <div className="col-span-12 md:col-span-9">
              {FAQS.map((f) => (
                <details key={f.q} className="faq-item">
                  <summary>
                    <h5
                      className="font-display text-[22px] md:text-[26px] leading-[1.2] text-ink tracking-display flex-1"
                      style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 30" }}
                    >
                      {f.q}
                    </h5>
                    <span className="faq-toggle">+</span>
                  </summary>
                  <p className="pb-7 pr-12 text-[15px] leading-[1.7] text-ink-muted max-w-[65ch]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- CLOSING CTA -------------------- */}
      <section className="relative border-t border-ink/15 bg-ink text-paper overflow-hidden">
        {/* background image overlay */}
        <div className="absolute inset-0 duotone-ink opacity-45">
          <img
            src="https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=1800&h=1000&fit=crop&auto=format&q=80"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(24,18,13,0.55) 0%, rgba(24,18,13,0.85) 60%, rgba(24,18,13,0.95) 100%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-6 py-24 md:py-32 z-10">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="font-mono text-[10px] uppercase tracking-editorial text-paper/50 mb-6">
                Colofón
              </div>
              <h2
                className="font-display text-[clamp(2rem,5vw,4.4rem)] leading-[1] tracking-display text-paper"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
              >
                La próxima consulta que{' '}
                <em className="text-oxblood-soft" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}>
                  evitabas
                </em>
                , la podés hacer ahora.
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col lg:items-end gap-4">
              <Link
                href="/auth/register"
                className="btn-oxblood text-[12px] uppercase tracking-editorial font-mono px-10 py-5 inline-block"
              >
                Empezar suscripción
              </Link>
              <span className="font-mono text-[10px] uppercase tracking-editorial text-paper/50">
                Sin tarjeta · 7 días de prueba
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="bg-paper border-t-2 border-ink">
        <div className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-5">
              <div className="flex items-center gap-4">
                <MaMark size={54} inkColor="#0f1011" dotColor="#00a86b" />
                <div className="pl-4 border-l border-ink/20">
                  <div
                    className="font-brand text-[22px] text-ink leading-none"
                    style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
                  >
                    Mi Asesor
                  </div>
                  <div
                    className="font-brand text-[10px] uppercase text-ink-muted mt-1.5"
                    style={{ letterSpacing: '0.14em', fontWeight: 500 }}
                  >
                    Asesoría virtual · LATAM
                  </div>
                </div>
              </div>
              <p
                className="mt-6 font-display text-[18px] leading-[1.45] text-ink-muted italic max-w-[44ch]"
                style={{ fontVariationSettings: "'opsz' 20, 'SOFT' 100" }}
              >
                Una publicación de asesoría inteligente para quienes prefieren hacer las preguntas que corresponden.
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
                Fundado en Buenos Aires · 2026
              </p>
            </div>

            <div className="col-span-6 md:col-span-2">
              <h6 className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted mb-5">Secciones</h6>
              <ul className="space-y-3 text-[13px] text-ink">
                <li><a href="#asesores" className="editorial-link">Asesores</a></li>
                <li><a href="#metodo" className="editorial-link">Método</a></li>
                <li><a href="#tarifario" className="editorial-link">Tarifario</a></li>
                <li><a href="#preguntas" className="editorial-link">Preguntas</a></li>
              </ul>
            </div>

            <div className="col-span-6 md:col-span-2">
              <h6 className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted mb-5">Casa editora</h6>
              <ul className="space-y-3 text-[13px] text-ink-muted">
                <li>Sobre nosotros</li>
                <li>Blog</li>
                <li>Prensa</li>
                <li>Legal</li>
              </ul>
            </div>

            <div className="col-span-12 md:col-span-3">
              <h6 className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted mb-5">Boletín</h6>
              <p className="text-[13px] text-ink-muted mb-4 leading-snug">
                Una edición mensual con novedades normativas y buenas prácticas. Sin ruido, sin marketing.
              </p>
              <form
                className="flex items-center border-b border-ink pb-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Suscripción recibida.');
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  className="bg-transparent text-[13px] text-ink placeholder:text-ink-subtle flex-1 outline-none"
                />
                <button
                  type="submit"
                  className="font-mono text-[11px] uppercase tracking-editorial text-oxblood ml-3"
                >
                  Recibir →
                </button>
              </form>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-ink/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
              © 2026 Mi Asesor · Todos los derechos reservados
            </div>
            <div className="flex gap-6 font-mono text-[10px] uppercase tracking-editorial text-ink-muted">
              <a href="#" className="editorial-link">Privacidad</a>
              <a href="#" className="editorial-link">Términos</a>
              <a href="#" className="editorial-link">Cookies</a>
              <a href="#" className="editorial-link">Estado del servicio</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------- Hero stats (with count-up) -------------------- */
function HeroStats() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="mt-16 flex flex-wrap gap-8 pt-8 border-t border-ink/12"
    >
      {HERO_STATS.map((s, i) => (
        <HeroStatTile key={s.k} stat={s} active={active} delay={1000 + i * 180} />
      ))}
    </div>
  );
}

function HeroStatTile({ stat, active, delay }: { stat: typeof HERO_STATS[number]; active: boolean; delay: number }) {
  const val = useCountUp(stat.target, active, delay);
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted">{stat.k}</div>
      <div
        className="font-display text-[22px] text-ink mt-1 tracking-display tabular-nums"
        style={{ fontVariationSettings: "'opsz' 72" }}
      >
        {stat.render(val)}
      </div>
    </div>
  );
}

/* -------------------- Big stats block (advisors intro) -------------------- */
function BigStats() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <BigStatTile label="Suscriptores activos" target={2400} format={(n) => n.toLocaleString('es-AR')} active={active} delay={0} />
      <BigStatTile label="Retención anual" target={97} format={(n) => `${n}%`} active={active} delay={150} />
      <BigStatTile label="Calificación media" target={48} format={(n) => `${(n / 10).toFixed(1).replace('.', ',')} / 5`} active={active} delay={300} />
      <BigStatTile label="Tiempo de respuesta" target={2} format={(n) => `< ${n} s`} active={active} delay={450} />
    </div>
  );
}

function BigStatTile({
  label,
  target,
  format,
  active,
  delay,
}: {
  label: string;
  target: number;
  format: (n: number) => string;
  active: boolean;
  delay: number;
}) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  const val = useCountUp(target, started, 1600);
  return (
    <div className="border-t border-ink pt-4">
      <div
        className="font-display text-[42px] leading-none text-ink tracking-display tabular-nums"
        style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 30" }}
      >
        {format(val)}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-editorial text-ink-muted">{label}</div>
    </div>
  );
}

/* -------------------- Count-up inline (for stamps) -------------------- */
function CountUpInline({ target }: { target: number }) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const val = useCountUp(target, active, 1400);
  return <span ref={ref} className="tabular-nums">{val}</span>;
}

/* -------------------- Editorial section header -------------------- */
function SectionHeader({ eyebrow, title, kicker }: { eyebrow: string; title: string; kicker: string }) {
  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-10 md:pt-28">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[11px] uppercase tracking-editorial text-oxblood">{eyebrow}</span>
        <span className="h-px flex-1 bg-ink/25" />
        <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted">{kicker}</span>
      </div>
      <h2
        className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1] tracking-display text-ink"
        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
      >
        {title}
      </h2>
    </div>
  );
}
