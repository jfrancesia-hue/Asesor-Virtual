'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageCircle, Search, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner, Badge } from '@/components/ui';
import { clsx } from 'clsx';

const ADVISOR_META: Record<string, { icon: string; color: string; label: string }> = {
  legal:      { icon: '⚖️', color: 'var(--primary)', label: 'Legal' },
  health:     { icon: '🏥', color: 'var(--accent)', label: 'Salud' },
  finance:    { icon: '💰', color: 'var(--cta)', label: 'Finanzas' },
  psychology: { icon: '💜', color: 'var(--brand-lavender)', label: 'Bienestar' },
  home:       { icon: '🏠', color: 'var(--cta-light)', label: 'Hogar' },
};

const TYPE_LABELS: Record<string, string> = {
  chat: 'Consulta',
  contract: 'Contrato',
  analysis: 'Análisis',
};

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadConversations();
    // loadConversations reads the current pagination/filter state for this view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, advisorFilter]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(advisorFilter !== 'all' ? { advisor_id: advisorFilter } : {}),
      });
      const data = await api.ai.listConversations(params.toString()) as any;
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Error al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter((c) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="px-6 md:px-8 py-10 max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Memoria de conversaciones
        </p>
        <h1 className="mt-2 font-display text-[clamp(24px,3.5vw,32px)] font-bold tracking-[-0.025em] text-[var(--text-strong)] flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-[var(--primary)]" strokeWidth={2.2} />
          Historial
        </h1>
        <p className="text-sm text-[var(--text-medium)] mt-1.5">{total} conversaciones guardadas</p>
      </header>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" strokeWidth={2.2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_12%,transparent)] transition-all"
          />
        </div>
        <div className="flex gap-1 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl p-1">
          <button
            onClick={() => { setAdvisorFilter('all'); setPage(1); }}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', advisorFilter === 'all' ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-soft' : 'text-[var(--text-muted)] hover:text-[var(--text-medium)]')}
          >
            Todos
          </button>
          {Object.entries(ADVISOR_META).map(([id, meta]) => (
            <button
              key={id}
              onClick={() => { setAdvisorFilter(id); setPage(1); }}
              aria-label={meta.label}
              className={clsx('px-3 py-1.5 rounded-lg text-base transition-colors', advisorFilter === id ? 'bg-[var(--surface)] shadow-soft' : 'opacity-60 hover:opacity-100')}
            >
              {meta.icon}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <MessageCircle className="w-10 h-10 text-[var(--text-muted)]/60 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-[var(--text-medium)] font-semibold">Sin conversaciones todavía</p>
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-[var(--primary)] mt-2 hover:underline font-semibold"
          >
            Iniciar una nueva consulta →
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((conv) => {
            const meta = ADVISOR_META[conv.advisor_id] || { icon: '🤖', color: 'var(--text-muted)', label: conv.advisor_id };
            const lastMsg = conv.last_message || conv.messages?.[conv.messages.length - 1];
            const typeLabel = TYPE_LABELS[conv.type] || conv.type;

            return (
              <button
                key={conv.id}
                onClick={() => router.push(`/advisor?advisor=${conv.advisor_id}&conv=${conv.id}`)}
                className="bento-card w-full flex items-center gap-4 p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-left"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${meta.color} 14%, var(--surface))` }}
                  aria-hidden="true"
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-display font-semibold text-[var(--text-strong)] tracking-tight truncate">
                      {conv.title || `Consulta con ${meta.label}`}
                    </p>
                    <Badge color="blue" className="text-[10px] flex-shrink-0">{typeLabel}</Badge>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {lastMsg.role === 'user' ? 'Tú: ' : `${meta.label}: `}
                      {lastMsg.content?.substring(0, 80)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" strokeWidth={2.2} />
                    {formatDate(conv.updated_at || conv.created_at)}
                  </span>
                  {conv.message_count > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">{conv.message_count} msgs</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] rounded-xl hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-[var(--text-medium)] font-medium">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] rounded-xl hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
