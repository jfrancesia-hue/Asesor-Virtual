'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, BellOff, Check, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAlertsStore } from '@/stores';
import { Button, Spinner, Badge } from '@/components/ui';
import { clsx } from 'clsx';

const ALERT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  contract_expiring: { label: 'Contrato por vencer', color: 'orange' },
  contract_expired: { label: 'Contrato vencido', color: 'red' },
  compliance_due: { label: 'Obligación próxima', color: 'yellow' },
  compliance_overdue: { label: 'Obligación vencida', color: 'red' },
  analysis_complete: { label: 'Análisis listo', color: 'green' },
  system: { label: 'Sistema', color: 'blue' },
};

export default function AlertsPage() {
  const { loadUnreadCount } = useAlertsStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadAlerts();
    // loadAlerts reads the current pagination/filter state for this view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(filter === 'unread' ? { unread: 'true' } : {}),
      });
      const data = await api.alerts.list(params.toString()) as any;
      setAlerts(data.alerts || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.alerts.markRead(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read_at: new Date().toISOString() } : a));
      loadUnreadCount();
    } catch {
      toast.error('Error al marcar como leída');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.alerts.markAllRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, read_at: a.read_at || new Date().toISOString() })));
      loadUnreadCount();
      toast.success('Todas las alertas marcadas como leídas');
    } catch {
      toast.error('Error al marcar alertas');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = alerts.filter((a) => !a.read_at).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Alertas
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} alertas en total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {f === 'all' ? 'Todas' : 'No leídas'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} loading={markingAll} className="gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <BellOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {filter === 'unread' ? 'Sin alertas no leídas' : 'Sin alertas'}
          </p>
          {filter === 'unread' && (
            <button onClick={() => setFilter('all')} className="text-sm text-blue-600 mt-1 hover:underline">
              Ver todas
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const typeInfo = ALERT_TYPE_LABELS[alert.type] || { label: alert.type, color: 'blue' };
            const isUnread = !alert.read_at;
            const date = new Date(alert.created_at);
            const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={alert.id}
                className={clsx(
                  'flex items-start gap-4 p-4 rounded-xl border transition-colors',
                  isUnread ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'
                )}
              >
                <div className={clsx('w-2 h-2 rounded-full mt-2 flex-shrink-0', isUnread ? 'bg-orange-500' : 'bg-slate-300')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={clsx('text-sm font-semibold', isUnread ? 'text-slate-900' : 'text-slate-600')}>
                      {alert.title}
                    </p>
                    <Badge color={typeInfo.color as any} className="text-[10px]">{typeInfo.label}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
                </div>
                {isUnread && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Marcar como leída"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
