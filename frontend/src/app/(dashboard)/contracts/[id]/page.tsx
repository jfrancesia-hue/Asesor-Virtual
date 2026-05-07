'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, History } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Badge, Spinner, Select } from '@/components/ui';

function sanitizeHtml(html: string): string {
  // Defense-in-depth — el backend ya sanea con sanitize-html antes de guardar.
  // Esta limpieza adicional bloquea cualquier handler/JS protocol leftover
  // si el HTML viene de una fuente que evadió la sanitización del servidor.
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript\s*:/gi, '');
}

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

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.contracts.get(id), api.contracts.versions(id)])
      .then(([c, v]) => {
        if (cancelled) return;
        setContract(c);
        setVersions(v as any[]);
      })
      .catch((err: any) => !cancelled && toast.error(err?.message || 'Error al cargar contrato'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const handleStatusChange = async (status: string) => {
    try {
      const updated = await api.contracts.update(id, { status }) as any;
      setContract({ ...contract, status: updated.status });
      toast.success('Estado actualizado');
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar estado');
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
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar PDF');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!contract) {
    return (
      <div className="px-6 md:px-8 py-20 text-center">
        <p className="text-[var(--text-medium)]">Contrato no encontrado.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/contracts')}>
          Volver a contratos
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-10 max-w-5xl mx-auto">
      <button
        onClick={() => router.push('/contracts')}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-medium)] hover:text-[var(--text-strong)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.4} /> Contratos
      </button>

      {/* Header */}
      <div className="bento-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-5">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="flex-1 min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
              Contrato {contract.type}
            </p>
            <h1 className="mt-2 font-display text-[clamp(20px,3vw,28px)] font-bold tracking-[-0.025em] text-[var(--text-strong)]">
              {contract.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Badge color={STATUS_COLORS[contract.status] || 'slate'}>
                {STATUS_OPTIONS.find((s) => s.value === contract.status)?.label}
              </Badge>
              <Badge color="slate">{contract.type}</Badge>
              <span className="text-xs text-[var(--text-muted)]">v{contract.version}</span>
              <span className="text-xs text-[var(--text-muted)]">{contract.jurisdiction}</span>
              {contract.expires_at && (
                <span className="text-xs text-[var(--text-muted)]">
                  Vence: {new Date(contract.expires_at).toLocaleDateString('es-AR')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Select
              value={contract.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={STATUS_OPTIONS}
              className="text-xs !w-36"
            />
            <Button size="sm" variant="subtle" onClick={handleDownloadPdf} className="gap-1.5">
              <Download className="w-3.5 h-3.5" strokeWidth={2.4} /> PDF
            </Button>
            {versions.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowVersions(!showVersions)}
                className="gap-1.5"
              >
                <History className="w-3.5 h-3.5" strokeWidth={2.4} /> v{contract.version}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Versions */}
      {showVersions && versions.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-5">
          <h3 className="font-display font-bold text-[var(--text-strong)] tracking-tight text-sm mb-4">
            Historial de versiones
          </h3>
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-[var(--text-strong)]">Versión {v.version}</span>
                  {v.change_summary && (
                    <p className="text-xs text-[var(--text-muted)]">{v.change_summary}</p>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(v.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {contract.content_html ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(contract.content_html) }} />
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center">
          <p className="text-[var(--text-medium)]">
            Sin contenido. Generá el contrato con el asesor legal.
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              router.push(`/advisor?advisor=legal&mode=create&type=${contract.type}`)
            }
          >
            Generar con IA
          </Button>
        </div>
      )}
    </div>
  );
}
