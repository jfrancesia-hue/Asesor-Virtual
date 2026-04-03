'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, History } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Button, Badge, Spinner, Select } from '@/components/ui';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'review', label: 'En Revisión' },
  { value: 'active', label: 'Activo' },
  { value: 'expired', label: 'Vencido' },
  { value: 'terminated', label: 'Terminado' },
];

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'red' | 'slate'> = {
  active: 'green', review: 'yellow', draft: 'blue', expired: 'red', terminated: 'slate',
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([api.contracts.get(id), api.contracts.versions(id)])
      .then(([c, v]) => { setContract(c); setVersions(v as any[]); })
      .catch(() => toast.error('Error al cargar contrato'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    try {
      const updated = await api.contracts.update(id, { status }) as any;
      setContract({ ...contract, status: updated.status });
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPdf = async () => {
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!contract) return <div className="p-6 text-center text-slate-500">Contrato no encontrado</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => router.push('/contracts')}>
        <ArrowLeft className="w-4 h-4" /> Contratos
      </Button>

      {/* Header */}
      <Card className="p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 mb-2">{contract.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={STATUS_COLORS[contract.status] || 'slate'}>
                {STATUS_OPTIONS.find(s => s.value === contract.status)?.label}
              </Badge>
              <Badge color="slate">{contract.type}</Badge>
              <span className="text-xs text-slate-400">v{contract.version}</span>
              <span className="text-xs text-slate-400">{contract.jurisdiction}</span>
              {contract.expires_at && (
                <span className="text-xs text-slate-400">
                  Vence: {new Date(contract.expires_at).toLocaleDateString('es-AR')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select
              value={contract.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={STATUS_OPTIONS}
              className="text-xs w-32"
            />
            <Button size="sm" variant="outline" onClick={handleDownloadPdf} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            {versions.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setShowVersions(!showVersions)} className="gap-1.5">
                <History className="w-3.5 h-3.5" /> v{contract.version}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Versions */}
      {showVersions && versions.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Historial de versiones</h3>
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-slate-700">Versión {v.version}</span>
                  {v.change_summary && <p className="text-xs text-slate-400">{v.change_summary}</p>}
                </div>
                <span className="text-xs text-slate-400">{new Date(v.created_at).toLocaleDateString('es-AR')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Content */}
      {contract.content_html ? (
        <Card className="p-6">
          <div dangerouslySetInnerHTML={{ __html: contract.content_html }} />
        </Card>
      ) : (
        <Card className="p-6 text-center text-slate-400">
          <p>Sin contenido. Generá el contrato con el asesor legal.</p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => router.push(`/advisor?advisor=legal&mode=create&type=${contract.type}`)}
          >
            Generar con IA
          </Button>
        </Card>
      )}
    </div>
  );
}
