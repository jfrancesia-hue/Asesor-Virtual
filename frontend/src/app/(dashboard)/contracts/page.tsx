'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Badge, Input, Select, EmptyState, Spinner } from '@/components/ui';

const TYPE_LABELS: Record<string, string> = {
  alquiler: 'Alquiler', servicios: 'Servicios', laboral: 'Laboral',
  nda: 'NDA', comercial: 'Comercial', freelance: 'Freelance', compraventa: 'Compraventa',
};

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'red' | 'slate'> = {
  active: 'green', review: 'yellow', draft: 'blue', expired: 'red', terminated: 'slate',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', review: 'Revisión', draft: 'Borrador', expired: 'Vencido', terminated: 'Terminado',
};

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadContracts();
    // loadContracts reads the current filter state for this table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter, page]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      }).toString();
      const data = await api.contracts.list(params) as any;
      setContracts(data.contracts || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (id: string, title: string) => {
    try {
      const blob = await api.contracts.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al generar PDF');
    }
  };

  return (
    <div className="px-6 md:px-8 py-10 max-w-6xl mx-auto">
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
            Documentos
          </p>
          <h1 className="mt-2 font-display text-[clamp(24px,3.5vw,32px)] font-bold tracking-[-0.025em] text-[var(--text-strong)]">
            Contratos
          </h1>
          <p className="text-sm text-[var(--text-medium)] mt-1.5">{total} contratos en total</p>
        </div>
        <Button onClick={() => router.push('/advisor?advisor=legal&mode=create')} size="lg" className="gap-2">
          <Plus className="w-4 h-4" strokeWidth={2.4} /> Nuevo contrato
        </Button>
      </header>

      {/* Filters */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 mb-5 shadow-soft">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar contratos..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'draft', label: 'Borrador' },
              { value: 'review', label: 'Revisión' },
              { value: 'active', label: 'Activo' },
              { value: 'expired', label: 'Vencido' },
              { value: 'terminated', label: 'Terminado' },
            ]}
            className="!w-44"
          />
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Todos los tipos' },
              ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ]}
            className="!w-48"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : contracts.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <EmptyState
            icon="📄"
            title="Sin contratos todavía"
            description="Generá uno en menos de un minuto con el asesor legal."
            action={
              <Button onClick={() => router.push('/advisor?advisor=legal')}>
                Generar contrato con IA
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {contracts.map((c) => (
            <button
              key={c.id}
              className="bento-card w-full text-left p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] cursor-pointer"
              onClick={() => router.push(`/contracts/${c.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-display font-semibold text-[var(--text-strong)] text-[15px] tracking-tight truncate">{c.title}</h3>
                    <Badge color={STATUS_COLORS[c.status] || 'slate'}>{STATUS_LABELS[c.status]}</Badge>
                    <Badge color="slate">{TYPE_LABELS[c.type]}</Badge>
                  </div>
                  <p className="text-[12.5px] text-[var(--text-muted)]">
                    {c.jurisdiction} · v{c.version} ·{' '}
                    {new Date(c.updated_at).toLocaleDateString('es-AR')}
                    {c.expires_at && ` · Vence: ${new Date(c.expires_at).toLocaleDateString('es-AR')}`}
                  </p>
                </div>
                <span
                  onClick={(e) => { e.stopPropagation(); downloadPdf(c.id, c.title); }}
                  role="button"
                  tabIndex={0}
                  aria-label="Descargar PDF"
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-bg)] rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" strokeWidth={2.2} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <Button variant="subtle" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-[var(--text-medium)] font-medium">
            Pág. {page} de {Math.ceil(total / 20)}
          </span>
          <Button variant="subtle" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
