'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageCircle, Search, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner, Badge } from '@/components/ui';
import { clsx } from 'clsx';

const ADVISOR_META: Record<string, { icon: string; color: string; label: string }> = {
  legal:      { icon: '⚖️', color: '#3b82f6', label: 'Legal' },
  health:     { icon: '🏥', color: '#10b981', label: 'Salud' },
  finance:    { icon: '💰', color: '#f59e0b', label: 'Finanzas' },
  psychology: { icon: '🧠', color: '#8b5cf6', label: 'Bienestar' },
  home:       { icon: '🏠', color: '#f97316', label: 'Hogar' },
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Historial de conversaciones
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{total} conversaciones guardadas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => { setAdvisorFilter('all'); setPage(1); }}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', advisorFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
          >
            Todos
          </button>
          {Object.entries(ADVISOR_META).map(([id, meta]) => (
            <button
              key={id}
              onClick={() => { setAdvisorFilter(id); setPage(1); }}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', advisorFilter === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
            >
              {meta.icon}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin conversaciones</p>
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-blue-600 mt-1 hover:underline"
          >
            Iniciar una nueva consulta
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => {
            const meta = ADVISOR_META[conv.advisor_id] || { icon: '🤖', color: '#64748b', label: conv.advisor_id };
            const lastMsg = conv.last_message || conv.messages?.[conv.messages.length - 1];
            const typeLabel = TYPE_LABELS[conv.type] || conv.type;

            return (
              <button
                key={conv.id}
                onClick={() => router.push(`/advisor?advisor=${conv.advisor_id}&conv=${conv.id}`)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all text-left group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: meta.color + '20' }}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {conv.title || `Consulta con ${meta.label}`}
                    </p>
                    <Badge color="blue" className="text-[10px] flex-shrink-0">{typeLabel}</Badge>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-slate-400 truncate">
                      {lastMsg.role === 'user' ? 'Tú: ' : `${meta.label}: `}
                      {lastMsg.content?.substring(0, 80)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(conv.updated_at || conv.created_at)}
                  </span>
                  {conv.message_count > 0 && (
                    <span className="text-xs text-slate-400">{conv.message_count} msgs</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
