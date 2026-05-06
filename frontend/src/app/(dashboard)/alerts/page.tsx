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
    <div className="px-6 md:px-8 py-10 max-w-3xl mx-auto">
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)] flex items-center gap-2">
            <Bell className="w-3.5 h-3.5" strokeWidth={2.4} />
            Notificaciones
          </p>
          <h1 className="mt-2 font-display text-[clamp(24px,3.5vw,32px)] font-bold tracking-[-0.025em] text-[var(--text-strong)] flex items-center gap-3">
            Alertas
            {unreadCount > 0 && (
              <span className="bg-[var(--cta)] text-white text-xs font-bold rounded-full px-2.5 py-0.5">
                {unreadCount} sin leer
              </span>
            )}
          </h1>
          <p className="text-sm text-[var(--text-medium)] mt-1.5">{total} alertas en total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl p-1">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  filter === f
                    ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-soft'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-medium)]'
                )}
              >
                {f === 'all' ? 'Todas' : 'No leídas'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button variant="subtle" size="sm" onClick={handleMarkAllRead} loading={markingAll} className="gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.4} />
              Marcar todas
            </Button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <BellOff className="w-10 h-10 text-[var(--text-muted)]/60 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-[var(--text-medium)] font-semibold">
            {filter === 'unread' ? 'Sin alertas no leídas' : 'Sin alertas'}
          </p>
          {filter === 'unread' && (
            <button onClick={() => setFilter('all')} className="text-sm text-[var(--primary)] mt-2 hover:underline font-semibold">
              Ver todas
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((alert) => {
            const typeInfo = ALERT_TYPE_LABELS[alert.type] || { label: alert.type, color: 'blue' };
            const isUnread = !alert.read_at;
            const date = new Date(alert.created_at);
            const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={alert.id}
                className={clsx(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-colors',
                  isUnread
                    ? 'bg-[var(--cta-bg)] border-[var(--cta)]/30'
                    : 'bg-[var(--surface)] border-[var(--border)]'
                )}
              >
                <div className={clsx('w-2 h-2 rounded-full mt-2 flex-shrink-0', isUnread ? 'bg-[var(--cta)]' : 'bg-[var(--text-muted)]/40')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={clsx('text-sm font-semibold tracking-tight', isUnread ? 'text-[var(--text-strong)]' : 'text-[var(--text-medium)]')}>
                      {alert.title}
                    </p>
                    <Badge color={typeInfo.color as any} className="text-[10px]">{typeInfo.label}</Badge>
                  </div>
                  <p className="text-sm text-[var(--text-medium)] leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">{dateStr}</p>
                </div>
                {isUnread && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    aria-label="Marcar como leída"
                    className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-[var(--accent-dark)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.4} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <Button variant="subtle" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-[var(--text-medium)] font-medium">{page} / {totalPages}</span>
          <Button variant="subtle" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
