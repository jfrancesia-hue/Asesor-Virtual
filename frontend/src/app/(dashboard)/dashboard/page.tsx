'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { StatCard, Card, Badge, Spinner, Button, RiskBadge } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { FileText, MessageCircle, Shield, Clock, Bell, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { tenant } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.dashboard.stats(),
      api.alerts.list('limit=5'),
      api.compliance.upcoming(30),
    ])
      .then(([s, a, c]) => {
        setStats(s);
        setAlerts((a as any).alerts || []);
        setCompliance((c as any[]).slice(0, 5));
      })
      .catch(() => toast.error('Error al cargar panel'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Panel empresarial</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen de {tenant?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Contratos activos" value={stats?.active_contracts || 0} sub={`${stats?.total_contracts || 0} total`} icon={<FileText />} color="#3b82f6" />
        <StatCard label="Consultas este mes" value={stats?.conversations_this_month || 0} sub="con asesores IA" icon={<MessageCircle />} color="#10b981" />
        <StatCard label="Análisis realizados" value={stats?.total_analyses || 0} icon={<Shield />} color="#8b5cf6" />
        <StatCard label="Créditos" value={stats?.credit_balance || 0} sub="disponibles" icon="⚡" color="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              Alertas recientes
              {stats?.unread_alerts > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.unread_alerts}
                </span>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings?tab=alerts')}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin alertas pendientes ✓</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${!alert.read_at ? 'bg-orange-50' : 'bg-slate-50'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!alert.read_at ? 'bg-orange-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{alert.title}</p>
                    <p className="text-xs text-slate-500 truncate">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Compliance */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Obligaciones próximas
              {stats?.overdue_compliance > 0 && (
                <Badge color="red">{stats.overdue_compliance} vencidas</Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          {compliance.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin obligaciones próximas</p>
          ) : (
            <div className="space-y-2">
              {compliance.map((item) => {
                const dueDate = new Date(item.due_date);
                const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysLeft < 0;
                const isUrgent = daysLeft <= 7 && !isOverdue;

                return (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg ${isOverdue ? 'bg-red-50' : isUrgent ? 'bg-orange-50' : 'bg-slate-50'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                      <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                        {isOverdue ? `Vencida hace ${Math.abs(daysLeft)} días` : `Vence en ${daysLeft} días`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Contratos por vencer */}
      {stats?.expiring_soon > 0 && (
        <Card className="p-5 mt-6 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-orange-800">
                {stats.expiring_soon} contrato{stats.expiring_soon !== 1 ? 's' : ''} por vencer en 30 días
              </p>
              <p className="text-sm text-orange-600">Revisalos para tomar acción a tiempo</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.push('/contracts?status=active')}>
              Ver contratos
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
