'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { StatCard, Card, Badge, Spinner, Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { FileText, MessageCircle, Shield, Clock, Bell, ArrowRight, Zap } from 'lucide-react';

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
    <div className="px-6 md:px-8 py-10 max-w-6xl mx-auto">
      <header className="mb-10">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Panel empresarial
        </p>
        <h1 className="mt-2 font-display text-[clamp(26px,4vw,36px)] font-bold tracking-[-0.025em] text-[var(--text-strong)]">
          Resumen de <span className="gradient-text">{tenant?.name || 'tu cuenta'}</span>
        </h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Contratos activos" value={stats?.active_contracts || 0} sub={`${stats?.total_contracts || 0} total`} icon={<FileText className="w-5 h-5" strokeWidth={2.2} />} color="var(--primary)" />
        <StatCard label="Consultas / mes" value={stats?.conversations_this_month || 0} sub="con asesores IA" icon={<MessageCircle className="w-5 h-5" strokeWidth={2.2} />} color="var(--accent)" />
        <StatCard label="Análisis" value={stats?.total_analyses || 0} sub="totales" icon={<Shield className="w-5 h-5" strokeWidth={2.2} />} color="var(--brand-lavender)" />
        <StatCard label="Créditos" value={stats?.credit_balance || 0} sub="disponibles" icon={<Zap className="w-5 h-5" strokeWidth={2.2} />} color="var(--cta)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Alerts */}
        <Card bento className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-[var(--text-strong)] flex items-center gap-2 tracking-tight">
              <Bell className="w-4.5 h-4.5 text-[var(--cta)]" strokeWidth={2.2} />
              Alertas recientes
              {stats?.unread_alerts > 0 && (
                <span className="bg-[var(--cta)] text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                  {stats.unread_alerts}
                </span>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/alerts')}>
              Ver todas <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Button>
          </div>

          {alerts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">Sin alertas pendientes ✓</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-xl ${
                    !alert.read_at ? 'bg-[var(--cta-bg)]' : 'bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!alert.read_at ? 'bg-[var(--cta)]' : 'bg-[var(--text-muted)]/40'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-[var(--text-strong)] truncate">{alert.title}</p>
                    <p className="text-xs text-[var(--text-medium)] truncate mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Compliance */}
        <Card bento className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-[var(--text-strong)] flex items-center gap-2 tracking-tight">
              <Clock className="w-4.5 h-4.5 text-[var(--primary)]" strokeWidth={2.2} />
              Obligaciones próximas
              {stats?.overdue_compliance > 0 && (
                <Badge color="red">{stats.overdue_compliance} vencidas</Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              Ver todas <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Button>
          </div>

          {compliance.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">Sin obligaciones próximas</p>
          ) : (
            <div className="space-y-2">
              {compliance.map((item) => {
                const dueDate = new Date(item.due_date);
                const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysLeft < 0;
                const isUrgent = daysLeft <= 7 && !isOverdue;
                const bg = isOverdue ? 'bg-red-50' : isUrgent ? 'bg-[var(--cta-bg)]' : 'bg-[var(--surface-subtle)]';
                const dot = isOverdue ? 'bg-red-500' : isUrgent ? 'bg-[var(--cta)]' : 'bg-[var(--accent)]';

                return (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-[var(--text-strong)] truncate">{item.title}</p>
                      <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-semibold' : 'text-[var(--text-muted)]'}`}>
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
        <div className="mt-6 p-5 rounded-2xl border border-[var(--cta)]/30 bg-[var(--cta-bg)] flex items-center gap-4">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-[var(--cta-dark)] text-[15px] tracking-tight">
              {stats.expiring_soon} contrato{stats.expiring_soon !== 1 ? 's' : ''} por vencer en 30 días
            </p>
            <p className="text-[13px] text-[var(--cta-dark)]/80 mt-0.5">Revisalos para tomar acción a tiempo.</p>
          </div>
          <Button variant="subtle" size="sm" onClick={() => router.push('/contracts?status=active')}>
            Ver contratos
          </Button>
        </div>
      )}
    </div>
  );
}
