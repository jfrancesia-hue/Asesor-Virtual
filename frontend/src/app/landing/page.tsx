'use client';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ADVISORS_MOCKUP = [
  { icon: 'gavel', name: 'Advisor Legal Senior', sub: 'Disponible • Derecho Civil', color: 'text-primary', bg: 'bg-primary/20', active: true },
  { icon: 'medical_services', name: 'Consultor Salud IA', sub: 'En espera • Medicina General', color: 'text-secondary', bg: 'bg-secondary/20', active: false },
  { icon: 'payments', name: 'Estratega Financiero', sub: 'Analizando Mercados • Inversión', color: 'text-tertiary', bg: 'bg-tertiary/20', active: false },
  { icon: 'psychology', name: 'Mentor Bienestar', sub: 'Disponible • Mindfulness', color: 'text-secondary-container', bg: 'bg-secondary-container/20', active: false },
  { icon: 'home_work', name: 'Gestor de Hogar', sub: 'Activo • Servicios & Mantenimiento', color: 'text-primary-container', bg: 'bg-primary-container/20', active: false },
];

const FEATURES = [
  {
    icon: 'gavel', color: 'text-primary', bg: 'bg-primary/10', hover: 'hover:border-primary/40',
    title: 'Legal ⚖️', tags: ['Jurisprudencia', 'Contratos'], tagColor: 'text-primary',
    desc: 'Contratos, litigios y asesoría corporativa instantánea con base en jurisprudencia actualizada.',
    span: 'md:col-span-3', large: true,
  },
  {
    icon: 'emergency', color: 'text-secondary', bg: 'bg-secondary/10', hover: 'hover:border-secondary/40',
    title: 'Salud 🏥', image: true,
    desc: 'Triaje preliminar guiado por IA y gestión de expedientes médicos con total privacidad.',
    span: 'md:col-span-3', large: true,
  },
  {
    icon: 'currency_exchange', color: 'text-tertiary', bg: 'bg-tertiary/10', hover: 'hover:border-tertiary/40',
    title: 'Finanzas 💰',
    desc: 'Planificación fiscal y optimización de inversiones automatizada.',
    span: 'md:col-span-2',
  },
  {
    icon: 'psychology', color: 'text-secondary-container', bg: 'bg-secondary-container/10', hover: 'hover:border-secondary-container/40',
    title: 'Bienestar 🧠',
    desc: 'Acompañamiento emocional y rutinas de equilibrio mental.',
    span: 'md:col-span-2',
  },
  {
    icon: 'home_work', color: 'text-primary-container', bg: 'bg-primary-container/10', hover: 'hover:border-primary-container/40',
    title: 'Hogar 🏠',
    desc: 'Gestión de servicios domésticos y trámites inmobiliarios.',
    span: 'md:col-span-2',
  },
];

const PLANS = [
  {
    id: 'start', label: 'Iniciación', price: 29,
    features: ['1 Asesor especializado', '50 consultas mensuales', 'Análisis de documentos (10MB)'],
    cta: 'Comenzar Ahora', highlight: false,
  },
  {
    id: 'pro', label: 'Profesional', price: 79,
    features: ['Todos los Asesores (5)', 'Consultas ilimitadas', 'Soporte prioritario 24/7', 'Firma digital integrada'],
    cta: 'Obtener Pro', highlight: true,
  },
  {
    id: 'enterprise', label: 'Empresarial', price: 199,
    features: ['Instancia privada de IA', 'Usuarios ilimitados', 'API de integración completa'],
    cta: 'Contactar Ventas', highlight: false,
  },
];

const FAQS = [
  { q: '¿Es legalmente vinculante la asesoría de la IA?', a: 'Nuestra IA proporciona orientación basada en normativas reales, pero siempre recomendamos la revisión de un abogado colegiado para trámites oficiales definitivos.' },
  { q: '¿Cómo protegen mis datos confidenciales?', a: 'Utilizamos encriptación AES-256 y protocolos de privacidad que cumplen con el RGPD y estándares internacionales de protección de datos.' },
  { q: '¿Puedo cancelar mi suscripción en cualquier momento?', a: 'Sí, no hay contratos de permanencia. Puedes cancelar tu plan desde el panel de configuración con un solo clic.' },
];

const NAV_LINKS = ['Funciones', 'Cómo funciona', 'Precios', 'FAQ'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 border-b border-surface-container-highest/20 shadow-[0_8px_32px_rgba(173,198,255,0.06)] backdrop-blur-xl bg-background/90">
        <div className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">gavel</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent font-headline">
              Asesor Virtual
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                className="text-slate-400 font-medium hover:text-blue-300 transition-colors duration-300 text-sm tracking-wide uppercase">
                {link}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login"
              className="hidden sm:block text-slate-400 font-medium hover:text-on-surface px-4 py-2 text-sm uppercase tracking-wide transition-colors">
              Ingresar
            </Link>
            <Link href="/auth/register"
              className="metallic-sheen text-on-primary-fixed font-bold px-6 py-2.5 rounded-full active:scale-95 transition-transform text-sm shadow-[0_0_20px_rgba(173,198,255,0.3)]">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      <main className="dots-grid pt-16">

        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-24 pb-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Acceso Anticipado V2.0</span>
              </div>
              <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                Tus asesores expertos con{' '}
                <span className="text-primary italic">inteligencia artificial</span>
              </h1>
              <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
                Accede a consultas legales, financieras y de bienestar personalizadas 24/7. Nuestra IA procesa miles de normativas en segundos para brindarte seguridad y claridad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/register"
                  className="metallic-sheen text-on-primary-fixed font-extrabold px-8 py-4 rounded-xl shadow-lg hover:shadow-primary/20 transition-all text-center">
                  Agendar Demostración
                </Link>
                <Link href="/auth/register"
                  className="px-8 py-4 rounded-xl bg-surface-container-low border border-outline-variant/10 text-on-surface hover:bg-surface-container-high transition-all font-semibold text-center">
                  Explorar Asesores
                </Link>
              </div>
            </div>

            {/* App Mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 blur-[100px] rounded-full" />
              <div className="glass-panel p-4 rounded-[2.5rem] border border-outline-variant/20 shadow-2xl relative">
                <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden">
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-error/40" />
                        <div className="w-3 h-3 rounded-full bg-primary/40" />
                        <div className="w-3 h-3 rounded-full bg-secondary/40" />
                      </div>
                      <span className="text-xs font-label uppercase tracking-tighter text-slate-500">Panel de Control Activo</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {ADVISORS_MOCKUP.map((a) => (
                        <div key={a.name}
                          className={`flex items-center gap-4 p-3 rounded-2xl ${a.active ? 'bg-surface-container-high border-l-4 border-primary' : 'bg-surface-container-low/50'}`}>
                          <div className={`w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`material-symbols-outlined ${a.color}`}>{a.icon}</span>
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${a.active ? 'text-white' : 'text-slate-300'}`}>{a.name}</p>
                            <p className={`text-[10px] ${a.active ? 'text-primary' : 'text-slate-500'}`}>{a.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="funciones" className="px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="font-headline text-4xl md:text-5xl text-white">Especialidades a tu medida</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Un ecosistema completo de asesoría inteligente diseñado para cubrir cada aspecto fundamental de tu vida profesional y personal.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:h-[600px]">
            {FEATURES.map((f) => (
              <div key={f.title}
                className={`${f.span} bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 group ${f.hover} transition-all flex flex-col justify-between`}>
                <div>
                  <div className={`w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined ${f.color} text-3xl`}>{f.icon}</span>
                  </div>
                  <h3 className={`font-bold text-white mb-2 ${f.large ? 'text-2xl' : 'text-xl'}`}>{f.title}</h3>
                  <p className={`text-on-surface-variant leading-relaxed ${f.large ? '' : 'text-sm'}`}>{f.desc}</p>
                </div>
                {f.tags && (
                  <div className="mt-8 flex gap-2 flex-wrap">
                    {f.tags.map((tag) => (
                      <span key={tag} className={`px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold ${f.tagColor} tracking-widest uppercase`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {f.image && (
                  <div className="mt-8">
                    <div className="w-full h-32 rounded-2xl bg-secondary/10 opacity-40 group-hover:opacity-70 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-5xl">biotech</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="precios" className="px-6 py-24 bg-surface-container-lowest/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-headline text-4xl text-white">Planes diseñados para tu ambición</h2>
              <p className="text-slate-400">Escala tu consultoría inteligente conforme crecen tus necesidades.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PLANS.map((plan) => (
                <div key={plan.id}
                  className={`p-8 rounded-[2rem] flex flex-col h-full relative ${
                    plan.highlight
                      ? 'bg-surface-container-high border-2 border-primary/30 shadow-[0_0_40px_rgba(173,198,255,0.1)]'
                      : 'bg-surface-container-low border border-outline-variant/10'
                  }`}>
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-primary font-bold text-[10px] rounded-full uppercase tracking-widest">
                      Más Popular
                    </div>
                  )}
                  <h4 className="font-label text-xs tracking-widest text-primary uppercase mb-4">{plan.label}</h4>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-slate-500">/mes</span>
                  </div>
                  <ul className="space-y-4 mb-12 flex-grow">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register"
                    className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide text-center block transition-all ${
                      plan.highlight
                        ? 'metallic-sheen text-on-primary-fixed'
                        : 'border border-outline-variant/20 text-on-surface hover:bg-surface-container-high'
                    }`}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-24 max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl text-center text-white mb-16">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                <h5 className="text-lg font-bold text-white mb-2">{faq.q}</h5>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/10 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">gavel</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent font-headline">
                Asesor Virtual
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Redefiniendo el acceso al conocimiento experto a través de inteligencia artificial ética y precisa.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:text-primary transition-colors">
                <span className="material-symbols-outlined">share</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:text-primary transition-colors">
                <span className="material-symbols-outlined">mail</span>
              </a>
            </div>
          </div>
          <div>
            <h6 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Producto</h6>
            <ul className="space-y-4 text-sm text-slate-500">
              {[
                { label: 'Características', href: '#funciones' },
                { label: 'Asesores IA', href: '#funciones' },
                { label: 'Precios', href: '#precios' },
                { label: 'FAQ', href: '#faq' },
              ].map((item) => (
                <li key={item.label}><a href={item.href} className="hover:text-primary transition-colors">{item.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Compañía</h6>
            <ul className="space-y-4 text-sm text-slate-500">
              {['Sobre nosotros', 'Blog', 'Carreras', 'Legal'].map((item) => (
                <li key={item}><span className="text-slate-600 cursor-default">{item}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Newsletter</h6>
            <p className="text-xs text-slate-500 mb-4 italic">Recibe actualizaciones sobre normativas y nuevas funciones.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@ejemplo.com"
                className="bg-surface-container-high border-none rounded-lg text-xs w-full px-3 py-2 text-on-surface placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => toast.success('¡Pronto recibirás novedades!')}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
              >
                Unirse
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-outline-variant/10 text-center text-[10px] text-slate-600 uppercase tracking-widest">
          © 2026 Asesor Virtual. Todos los derechos reservados. Tecnología de Inteligencia Artificial para Humanos.
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-surface-container-highest/30 bg-background/80 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)] flex justify-around items-center h-20 px-2">
        {[
          { icon: 'gavel', label: 'Asesores', active: true },
          { icon: 'chat', label: 'Chat', active: false },
          { icon: 'description', label: 'Docs', active: false },
          { icon: 'analytics', label: 'Stats', active: false },
          { icon: 'dashboard', label: 'Dash', active: false },
        ].map((item) => (
          <Link key={item.label} href="/auth/register"
            className={`flex flex-col items-center justify-center transition-transform ${item.active ? 'text-primary scale-110' : 'text-slate-500'}`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
          </Link>
        ))}
      </nav>

    </div>
  );
}
