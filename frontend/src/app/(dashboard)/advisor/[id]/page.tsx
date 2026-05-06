'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Badge, Spinner } from '@/components/ui';

// ============================================================
// Herramientas por asesor
// ============================================================
type ToolAction =
  | { type: 'chat' }
  | { type: 'chat_prompt'; prompt: string }
  | { type: 'analyze' }
  | { type: 'contracts' }
  | { type: 'create' }
  | { type: 'crisis' }
  | { type: 'exercises' }
  | { type: 'wellness' }
  | { type: 'mood' };

interface AdvisorTool {
  label: string;
  icon: string;
  description: string;
  action: ToolAction;
}

const ADVISOR_TOOLS: Record<string, AdvisorTool[]> = {
  legal: [
    { label: 'Crear contrato', icon: '📝', description: 'Generá contratos de alquiler, servicios, NDA y más con IA', action: { type: 'create' } },
    { label: 'Analizar documento', icon: '🔍', description: 'Detectá cláusulas abusivas y riesgos en tus contratos', action: { type: 'analyze' } },
    { label: 'Consulta legal', icon: '⚖️', description: 'Hacé una consulta jurídica sobre tus derechos y obligaciones', action: { type: 'chat_prompt', prompt: 'Tengo una consulta legal.' } },
    { label: 'Mis contratos', icon: '🗂️', description: 'Ver y gestionar todos tus contratos guardados', action: { type: 'contracts' } },
    { label: 'Jurisdicción LATAM', icon: '🌎', description: 'Consultas de derecho argentino, mexicano o colombiano', action: { type: 'chat_prompt', prompt: '¿Podés explicarme las diferencias entre la ley de contratos de Argentina, México y Colombia?' } },
    { label: 'Rescisión de contrato', icon: '❌', description: 'Entendé tus derechos para rescindir un contrato', action: { type: 'chat_prompt', prompt: 'Quiero saber cuáles son mis derechos para rescindir un contrato.' } },
  ],
  health: [
    { label: 'Consultar síntomas', icon: '🤒', description: 'Describí tus síntomas y obtené orientación', action: { type: 'chat_prompt', prompt: 'Tengo los siguientes síntomas y necesito orientación:' } },
    { label: 'Plan nutricional', icon: '🥗', description: 'Consejos de alimentación saludable personalizados', action: { type: 'chat_prompt', prompt: 'Necesito orientación sobre alimentación saludable.' } },
    { label: 'Primeros auxilios', icon: '🩹', description: 'Guía rápida para situaciones de emergencia leve', action: { type: 'chat_prompt', prompt: '¿Cuáles son los pasos básicos de primeros auxilios para una situación de emergencia leve?' } },
    { label: 'Checklist médico', icon: '📋', description: 'Qué controles y vacunas necesitás según tu edad', action: { type: 'chat_prompt', prompt: '¿Qué controles médicos y vacunas debería hacerme según mi edad?' } },
    { label: 'Diario de bienestar', icon: '📓', description: 'Registrá tu bienestar físico diario', action: { type: 'wellness' } },
    { label: 'Consulta libre', icon: '💬', description: 'Preguntá cualquier cosa sobre tu salud', action: { type: 'chat' } },
  ],
  finance: [
    { label: 'Mi presupuesto', icon: '💰', description: 'Organizá tus ingresos y gastos mensuales', action: { type: 'chat_prompt', prompt: 'Quiero organizar mi presupuesto mensual. ¿Por dónde empiezo?' } },
    { label: 'Salir de deudas', icon: '📉', description: 'Estrategias para pagar deudas de manera efectiva', action: { type: 'chat_prompt', prompt: 'Tengo varias deudas y no sé por dónde empezar. ¿Qué estrategia me recomendás?' } },
    { label: 'Opciones de inversión', icon: '📈', description: 'Conocé opciones de inversión adaptadas a LATAM', action: { type: 'chat_prompt', prompt: '¿Cuáles son las opciones de inversión disponibles en Argentina para alguien que recién empieza?' } },
    { label: 'Consulta impositiva', icon: '🧾', description: 'Dudas sobre monotributo, impuestos y facturación', action: { type: 'chat_prompt', prompt: 'Tengo dudas sobre el monotributo y mis obligaciones impositivas.' } },
    { label: 'Metas financieras', icon: '🎯', description: 'Planificá tus metas de ahorro e inversión', action: { type: 'chat_prompt', prompt: 'Quiero establecer metas financieras realistas. ¿Cómo planifico?' } },
    { label: 'Consulta libre', icon: '💬', description: 'Cualquier consulta sobre finanzas personales', action: { type: 'chat' } },
  ],
  psychology: [
    { label: 'Necesito hablar', icon: '💜', description: 'Encontrá un espacio seguro para expresarte', action: { type: 'chat_prompt', prompt: 'Necesito hablar, estoy pasando por un momento difícil.' } },
    { label: 'Manejo de ansiedad', icon: '🌊', description: 'Técnicas y estrategias para reducir la ansiedad', action: { type: 'chat_prompt', prompt: 'Estoy sintiendo mucha ansiedad y necesito herramientas para manejarla.' } },
    { label: 'Ejercicios guiados', icon: '🧘', description: 'Respiración, mindfulness y técnicas de relajación', action: { type: 'exercises' } },
    { label: 'Diario emocional', icon: '📓', description: 'Registrá y procesá tus emociones del día', action: { type: 'mood' } },
    { label: 'Mejorar el sueño', icon: '🌙', description: 'Consejos para dormir mejor y descansar más', action: { type: 'chat_prompt', prompt: 'Tengo problemas para dormir y me gustaría mejorar mi calidad de sueño.' } },
    { label: 'Líneas de ayuda', icon: '🆘', description: 'Recursos de ayuda en crisis por país', action: { type: 'crisis' } },
  ],
  home: [
    { label: 'Plomería', icon: '🚿', description: 'Canillas, desagües, pérdidas y soluciones básicas', action: { type: 'chat_prompt', prompt: 'Tengo un problema de plomería en mi casa.' } },
    { label: 'Electricidad', icon: '⚡', description: 'Tomacorrientes, luces e instalaciones básicas', action: { type: 'chat_prompt', prompt: 'Tengo un problema eléctrico en casa. ¿Qué puedo hacer?' } },
    { label: 'Pintura', icon: '🎨', description: 'Cómo pintar paredes, preparación y técnicas', action: { type: 'chat_prompt', prompt: 'Quiero pintar una habitación de mi casa. ¿Por dónde empiezo?' } },
    { label: 'Jardín / Huerta', icon: '🌿', description: 'Plantas, riego, sustratos y huerta en casa', action: { type: 'chat_prompt', prompt: 'Quiero empezar un pequeño jardín o huerta en casa. ¿Qué necesito?' } },
    { label: 'Mantenimiento preventivo', icon: '🔧', description: 'Checklist de tareas para mantener tu hogar en forma', action: { type: 'chat_prompt', prompt: 'Necesito un checklist de mantenimiento preventivo para mi hogar.' } },
    { label: 'Consulta libre', icon: '💬', description: 'Cualquier consulta sobre el hogar', action: { type: 'chat' } },
  ],
};

// ============================================================
// Modal de crisis (bienestar)
// ============================================================
function CrisisModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--text-strong)]/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-strong border border-[var(--border)] max-w-md w-full p-7 animate-fade-in">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] rounded-lg p-1.5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-5">
          <span className="text-4xl" aria-hidden="true">🆘</span>
          <h2 className="font-display font-bold text-xl text-[var(--text-strong)] mt-3 tracking-tight">
            Líneas de ayuda en crisis
          </h2>
          <p className="text-sm text-[var(--text-medium)] mt-1.5">Si estás en peligro, contactá de inmediato.</p>
        </div>
        <div className="space-y-2.5">
          {[
            { country: '🇦🇷 Argentina', line: '135', desc: 'Centro de Asistencia al Suicida — 24hs gratuito' },
            { country: '🇲🇽 México', line: '800-911-2000', desc: 'SAPTEL — Crisis y orientación 24hs' },
            { country: '🇨🇴 Colombia', line: '106', desc: 'Línea 106 — Salud mental y crisis' },
            { country: '🆘 Emergencias', line: '911', desc: 'Emergencias generales (AR, MX) o 123 (CO)' },
          ].map((item) => (
            <a
              key={item.country}
              href={`tel:${item.line.replace(/-/g, '')}`}
              className="flex items-center justify-between gap-4 p-3.5 bg-[var(--brand-lavender-bg)] hover:bg-[var(--brand-lavender-bg)]/70 border border-transparent hover:border-[var(--brand-lavender)]/40 rounded-xl transition-colors"
            >
              <div className="min-w-0">
                <p className="font-display text-[14px] font-bold text-[var(--text-strong)]">{item.country}</p>
                <p className="text-[12px] text-[var(--text-medium)] mt-0.5">{item.desc}</p>
              </div>
              <span className="text-[17px] font-display font-bold text-[var(--brand-lavender)] flex-shrink-0">
                {item.line}
              </span>
            </a>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] text-center mt-5">
          También podés hablar con Alma, tu acompañante de bienestar.
        </p>
        <Button
          fullWidth
          className="mt-3 !bg-[var(--brand-lavender)] hover:!bg-[#854D9E]"
          onClick={onClose}
        >
          Hablar con Alma ahora
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Página principal
// ============================================================
export default function AdvisorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [advisor, setAdvisor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCrisis, setShowCrisis] = useState(false);

  useEffect(() => {
    api.ai.getAdvisor(id)
      .then(setAdvisor)
      .catch(() => toast.error('Error al cargar asesor'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTool = (tool: AdvisorTool) => {
    const { action } = tool;
    switch (action.type) {
      case 'chat':
        router.push(`/advisor?advisor=${id}`);
        break;
      case 'chat_prompt':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent(action.prompt)}`);
        break;
      case 'analyze':
        router.push('/analysis');
        break;
      case 'contracts':
        router.push('/contracts');
        break;
      case 'create':
        router.push(`/advisor?advisor=legal&mode=create`);
        break;
      case 'crisis':
        setShowCrisis(true);
        break;
      case 'exercises':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent('Quiero hacer un ejercicio guiado de bienestar. ¿Qué opciones tengo?')}`);
        break;
      case 'wellness':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent('Quiero registrar cómo me siento hoy. ¿Podés guiarme?')}`);
        break;
      case 'mood':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent('Quiero escribir en mi diario emocional de hoy.')}`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="p-10 text-center">
        <p className="text-[var(--text-medium)]">Asesor no encontrado.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/home')}>Volver</Button>
      </div>
    );
  }

  const tools = ADVISOR_TOOLS[id] || [];
  const advisorColor = advisor.color || 'var(--primary)';

  return (
    <div className="px-6 md:px-8 py-10 max-w-6xl mx-auto">
      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}

      <button
        onClick={() => router.push('/home')}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-medium)] hover:text-[var(--text-strong)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.4} /> Asesores
      </button>

      {/* Header del asesor */}
      <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-6 mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-soft"
          style={{
            background: `color-mix(in srgb, ${advisorColor} 14%, var(--surface))`,
            border: `1.5px solid color-mix(in srgb, ${advisorColor} 30%, transparent)`,
          }}
          aria-hidden="true"
        >
          {advisor.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
            {advisor.name}
          </p>
          <div className="flex items-center gap-3 flex-wrap mt-1.5">
            <h1 className="font-display text-[clamp(24px,3.5vw,32px)] font-bold leading-tight tracking-[-0.025em] text-[var(--text-strong)]">
              {advisor.title}
            </h1>
            {!advisor.available && <Badge color="orange">Plan Pro</Badge>}
          </div>
          <p className="text-[15px] text-[var(--text-medium)] mt-2.5 leading-relaxed max-w-2xl">{advisor.description}</p>

          {/* Capabilities */}
          {advisor.capabilities && advisor.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {advisor.capabilities.map((cap: string) => (
                <span
                  key={cap}
                  className="text-[12px] px-3 py-1 rounded-full font-semibold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${advisorColor} 12%, transparent)`,
                    color: advisorColor,
                  }}
                >
                  {cap}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => router.push(`/advisor?advisor=${id}`)}
          size="lg"
          className="flex-shrink-0 gap-2 !bg-[var(--cta)] hover:!bg-[var(--cta-dark)]"
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2.4} />
          Chatear ahora
        </Button>
      </div>

      {/* Herramientas */}
      <section className="mb-10" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="font-display font-bold text-lg text-[var(--text-strong)] tracking-tight mb-5">
          ¿Qué necesitás?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.label}
              onClick={() => handleTool(tool)}
              className="bento-card text-left p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${advisorColor} 12%, var(--surface-subtle))` }}
                  aria-hidden="true"
                >
                  {tool.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-[14.5px] text-[var(--text-strong)] tracking-tight mb-1">
                    {tool.label}
                  </p>
                  <p className="text-[12.5px] text-[var(--text-medium)] leading-relaxed">{tool.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Consultas frecuentes */}
      {advisor.quick_actions && advisor.quick_actions.length > 0 && (
        <section aria-labelledby="quick-heading">
          <h2 id="quick-heading" className="font-display font-bold text-lg text-[var(--text-strong)] tracking-tight mb-4">
            Consultas frecuentes
          </h2>
          <div className="flex flex-wrap gap-2">
            {advisor.quick_actions.map((action: any) => (
              <button
                key={action.label}
                onClick={() =>
                  router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent(action.prompt)}`)
                }
                className="text-[13px] px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-full font-medium text-[var(--text-medium)] hover:text-[var(--text-strong)] hover:border-[var(--border-strong)] hover:shadow-soft transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-8 mb-2 mx-auto max-w-3xl px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm leading-relaxed">
        <span className="font-semibold mr-1">⚠️ Aviso:</span>
        {id === 'legal' && (
          <>Las respuestas son <strong>orientación informativa generada por IA</strong>. No somos un estudio jurídico ni reemplazamos a un abogado matriculado. Verificá con un profesional antes de firmar o presentar cualquier documento.</>
        )}
        {id === 'health' && (
          <>Las respuestas son <strong>orientación informativa generada por IA</strong>. No somos médicos ni reemplazamos la consulta con un profesional de la salud. Ante una emergencia, llamá al <strong>107</strong> (AR) / <strong>911</strong> (MX/AR) / <strong>123</strong> (CO).</>
        )}
        {id === 'finance' && (
          <>Las respuestas son <strong>orientación informativa generada por IA</strong>. No somos contadores ni asesores financieros matriculados. Toda inversión tiene riesgo: consultá con un profesional antes de decisiones patrimoniales o tributarias.</>
        )}
        {id === 'psychology' && (
          <>Las respuestas son <strong>orientación informativa generada por IA</strong>. No reemplaza la terapia con un profesional licenciado. En crisis llamá al{' '}
            <button onClick={() => setShowCrisis(true)} className="font-semibold underline">
              135 (AR) · 800-911-2000 (MX) · 106 (CO)
            </button>.
          </>
        )}
        {id === 'home' && (
          <>Las respuestas son <strong>orientación informativa generada por IA</strong>. Para trabajos de <strong>gas, alta tensión o estructuras</strong>, contratá siempre un profesional matriculado.</>
        )}
      </div>
    </div>
  );
}
