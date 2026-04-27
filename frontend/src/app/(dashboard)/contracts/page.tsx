'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, Badge, Input, Select, EmptyState, Spinner } from '@/components/ui';

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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contratos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} contratos en total</p>
        </div>
        <Button onClick={() => router.push('/advisor?advisor=legal&mode=create')}>
          <Plus className="w-4 h-4" /> Nuevo contrato
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-4">
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
            className="w-40"
          />
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Todos los tipos' },
              ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ]}
            className="w-44"
          />
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Sin contratos"
          description="Todavía no tenés contratos. Generá uno con el asesor legal."
          action={
            <Button onClick={() => router.push('/advisor?advisor=legal')}>
              Generar contrato con IA
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => (
            <Card
              key={c.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/contracts/${c.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-800 text-sm truncate">{c.title}</h3>
                    <Badge color={STATUS_COLORS[c.status] || 'slate'}>{STATUS_LABELS[c.status]}</Badge>
                    <Badge color="slate">{TYPE_LABELS[c.type]}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    {c.jurisdiction} · v{c.version} ·{' '}
                    {new Date(c.updated_at).toLocaleDateString('es-AR')}
                    {c.expires_at && ` · Vence: ${new Date(c.expires_at).toLocaleDateString('es-AR')}`}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadPdf(c.id, c.title); }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Descargar PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="flex items-center px-3 text-sm text-slate-600">
            Pág. {page} de {Math.ceil(total / 20)}
          </span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
