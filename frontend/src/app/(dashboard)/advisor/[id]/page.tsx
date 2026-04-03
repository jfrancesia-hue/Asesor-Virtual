'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { clsx } from 'clsx';

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-4">
          <span className="text-4xl">🆘</span>
          <h2 className="text-lg font-bold text-slate-900 mt-2">Líneas de ayuda en crisis</h2>
          <p className="text-sm text-slate-500 mt-1">Si estás en peligro, contactá de inmediato</p>
        </div>
        <div className="space-y-3">
          {[
            { country: '🇦🇷 Argentina', line: '135', desc: 'Centro de Asistencia al Suicida — 24hs gratuito' },
            { country: '🇲🇽 México', line: '800-911-2000', desc: 'SAPTEL — Crisis y orientación 24hs' },
            { country: '🇨🇴 Colombia', line: '106', desc: 'Línea 106 — Salud mental y crisis' },
            { country: '🆘 Emergencias', line: '911', desc: 'Emergencias generales (AR, MX) o 123 (CO)' },
          ].map((item) => (
            <div key={item.country} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.country}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <a
                href={`tel:${item.line.replace(/-/g, '')}`}
                className="text-lg font-bold text-purple-700 hover:text-purple-900"
              >
                {item.line}
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">
          También podés hablar con Alma, tu asesora de bienestar, en este momento.
        </p>
        <Button fullWidth className="mt-3 bg-purple-600 hover:bg-purple-700" onClick={onClose}>
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
      <div className="p-6 text-center">
        <p className="text-slate-500">Asesor no encontrado.</p>
        <Button variant="ghost" className="mt-3" onClick={() => router.push('/home')}>Volver</Button>
      </div>
    );
  }

  const tools = ADVISOR_TOOLS[id] || [];
  const advisorColor = advisor.color || '#3b82f6';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}

      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5"
        onClick={() => router.push('/home')}
      >
        <ArrowLeft className="w-4 h-4" /> Asesores
      </Button>

      {/* Header del asesor */}
      <div className="flex items-start gap-5 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm"
          style={{ backgroundColor: advisorColor + '20', border: `2px solid ${advisorColor}30` }}
        >
          {advisor.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{advisor.title}</h1>
            {!advisor.available && <Badge color="yellow">Plan Pro</Badge>}
          </div>
          <p className="text-slate-500 mb-3">{advisor.description}</p>

          {/* Capabilities */}
          {advisor.capabilities && advisor.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {advisor.capabilities.map((cap: string) => (
                <span
                  key={cap}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: advisorColor + '15', color: advisorColor }}
                >
                  {cap}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => router.push(`/advisor?advisor=${id}`)}
          className="flex-shrink-0 gap-2"
          style={{ backgroundColor: advisorColor }}
        >
          <MessageCircle className="w-4 h-4" />
          Chatear ahora
        </Button>
      </div>

      {/* Herramientas */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-slate-700 mb-4">¿Qué necesitás?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.label}
              onClick={() => handleTool(tool)}
              className={clsx(
                'text-left p-4 rounded-xl border-2 border-slate-100 bg-white',
                'hover:shadow-md transition-all duration-150 group',
                'hover:border-opacity-50',
              )}
              style={{ '--tool-color': advisorColor } as any}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = advisorColor + '50';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '';
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{tool.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-slate-900 mb-0.5">
                    {tool.label}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Consultas frecuentes */}
      {advisor.quick_actions && advisor.quick_actions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Consultas frecuentes</h2>
          <div className="flex flex-wrap gap-2">
            {advisor.quick_actions.map((action: any) => (
              <button
                key={action.label}
                onClick={() =>
                  router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent(action.prompt)}`)
                }
                className="text-sm px-4 py-2 bg-white border border-slate-200 rounded-full hover:shadow-sm transition-all"
                style={{ borderColor: 'transparent' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = advisorColor + '60';
                  (e.currentTarget as HTMLElement).style.color = advisorColor;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '';
                  (e.currentTarget as HTMLElement).style.color = '';
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center mt-8 pb-2">
        {id === 'legal' && 'El asesor legal orienta pero no reemplaza a un abogado matriculado.'}
        {id === 'health' && 'Este asesor no reemplaza la consulta con un profesional de la salud.'}
        {id === 'finance' && 'No reemplaza el asesoramiento de un contador o asesor financiero certificado.'}
        {id === 'psychology' && (
          <>No reemplaza la terapia profesional. En crisis llamá al{' '}
            <button onClick={() => setShowCrisis(true)} className="text-purple-600 underline">
              135 (AR) · 800-911-2000 (MX) · 106 (CO)
            </button>
          </>
        )}
        {id === 'home' && 'Para trabajos de gas o alta tensión consultá un profesional matriculado.'}
      </p>
    </div>
  );
}
