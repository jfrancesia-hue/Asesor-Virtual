'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Button, Spinner, Badge } from '@/components/ui';

const CONTRACT_SHORTCUTS = [
  { type: 'alquiler', label: 'Contrato de Alquiler', icon: '🏠' },
  { type: 'servicios', label: 'Contrato de Servicios', icon: '⚙️' },
  { type: 'nda', label: 'Acuerdo NDA', icon: '🔒' },
  { type: 'freelance', label: 'Contrato Freelance', icon: '💻' },
];

// Fallback si el backend no responde
const ADVISORS_FALLBACK = [
  { id: 'legal', name: 'Asesor Legal', title: 'Experto en Derecho LATAM', description: 'Contratos, análisis jurídico y consultas legales para Argentina, México y Colombia.', icon: '⚖️', color: '#3b82f6', available: true },
  { id: 'health', name: 'Asesor de Salud', title: 'Orientación en Salud', description: 'Síntomas, nutrición, prevención y bienestar general.', icon: '🏥', color: '#10b981', available: true },
  { id: 'finance', name: 'Asesor Financiero', title: 'Finanzas Personales LATAM', description: 'Presupuesto, inversiones, deudas e impuestos.', icon: '💰', color: '#f59e0b', available: true },
  { id: 'psychology', name: 'Asesor de Bienestar', title: 'Apoyo Emocional', description: 'Escucha empática, ansiedad y mindfulness.', icon: '🧠', color: '#8b5cf6', available: true },
  { id: 'home', name: 'Asesor del Hogar', title: 'Mantenimiento del Hogar', description: 'Plomería, electricidad básica, pintura y jardinería.', icon: '🏠', color: '#f97316', available: true },
];

export default function HomePage() {
  const router = useRouter();
  const { user, tenant } = useAuthStore();
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ai.listAdvisors()
      .then((data) => setAdvisors(data && data.length > 0 ? data : ADVISORS_FALLBACK))
      .catch(() => setAdvisors(ADVISORS_FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const handleAdvisorClick = (advisor: any) => {
    if (!advisor.available) {
      toast.error(`Necesitás plan Pro o superior para ${advisor.name}`);
      return;
    }
    // Ir a la página de detalle del asesor
    router.push(`/advisor/${advisor.id}`);
  };

  const handleContractShortcut = (type: string) => {
    router.push(`/advisor?advisor=legal&mode=create&type=${type}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Buen día, {user?.fullName?.split(' ')[0] || 'usuario'} 👋
        </h1>
        <p className="text-slate-500 mt-1">¿Con cuál de tus asesores querés consultar hoy?</p>
      </div>

      {/* Advisors Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {advisors.map((advisor) => (
            <button
              key={advisor.id}
              onClick={() => handleAdvisorClick(advisor)}
              className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                advisor.available
                  ? 'border-slate-200 hover:border-opacity-60 bg-white cursor-pointer'
                  : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
              }`}
              style={advisor.available ? { '--hover-color': advisor.color } as any : {}}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{advisor.icon}</span>
                {!advisor.available && (
                  <Badge color="yellow">Pro</Badge>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{advisor.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{advisor.description}</p>
              {advisor.available && (
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: advisor.color }}>
                  Consultar <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Contract Shortcuts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Contratos rápidos</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/contracts')}>
            Ver todos <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CONTRACT_SHORTCUTS.map((s) => (
            <button
              key={s.type}
              onClick={() => handleContractShortcut(s.type)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
