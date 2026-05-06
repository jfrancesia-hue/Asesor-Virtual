'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Input, TextArea, EmptyState, Spinner, RiskBadge } from '@/components/ui';

export default function AnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', country: 'AR' });

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await api.analysis.list() as any;
      setAnalyses(data.assessments || []);
    } catch {
      toast.error('Error al cargar análisis');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera los 10MB');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await api.documents.upload(formData) as any;
      setForm({ ...form, title: result.fileName || file.name, content: result.text });
      setShowForm(true);
      toast.success('Documento cargado. Revisá el contenido y analizá.');
    } catch (error: any) {
      toast.error(error.message || 'Error al leer el archivo');
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!form.title || !form.content) {
      toast.error('Completá el título y el contenido');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await api.ai.analyzeDocument(form) as any;
      toast.success(`Análisis completado — Riesgo: ${result.overallRisk}`);
      router.push(`/analysis/${result.assessmentId}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al analizar');
    } finally {
      setAnalyzing(false);
    }
  };

  const riskColors: Record<string, string> = {
    low: 'var(--accent)',
    medium: 'var(--brand-yellow)',
    high: 'var(--cta)',
    critical: '#dc2626',
  };

  return (
    <div className="px-6 md:px-8 py-10 max-w-5xl mx-auto">
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
            Análisis IA
          </p>
          <h1 className="mt-2 font-display text-[clamp(24px,3.5vw,32px)] font-bold tracking-[-0.025em] text-[var(--text-strong)]">
            Análisis de documentos
          </h1>
          <p className="text-sm text-[var(--text-medium)] mt-1.5">Detectá cláusulas abusivas y riesgos con semáforo IA.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="lg" className="gap-2">
          <AlertTriangle className="w-4 h-4" strokeWidth={2.4} />
          Nuevo análisis
        </Button>
      </header>

      {/* Form */}
      {showForm && (
        <div className="bento-card bg-[var(--surface)] border border-[var(--primary)]/30 rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-[var(--text-strong)] tracking-tight text-lg mb-5">Analizar documento</h2>
          <div className="space-y-4">
            <Input
              label="Título del documento"
              placeholder="Contrato de Locación — Calle X 123"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex-1 border-2 border-dashed border-[var(--border)] rounded-xl p-5 text-center hover:border-[var(--primary)]/50 hover:bg-[var(--primary-bg)]/30 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-1.5" strokeWidth={2.2} />
                <p className="text-sm font-semibold text-[var(--text-medium)]">Subir PDF o TXT</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Máx. 10MB</p>
              </button>
              <span className="text-[var(--text-muted)] text-sm font-medium">o</span>
              <div className="flex-1 text-center">
                <p className="text-sm text-[var(--text-medium)]">Pegá el texto directamente</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />

            <TextArea
              label="Contenido del documento"
              placeholder="Pegá aquí el texto del contrato o documento a analizar..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
            />

            <div className="flex gap-3">
              <Button onClick={handleAnalyze} loading={analyzing} disabled={!form.title || !form.content}>
                {analyzing ? 'Analizando...' : 'Analizar documento (1 crédito)'}
              </Button>
              <Button variant="subtle" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : analyses.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <EmptyState
            icon="🔍"
            title="Sin análisis todavía"
            description="Analizá un contrato para identificar riesgos y cláusulas abusivas en segundos."
            action={<Button onClick={() => setShowForm(true)}>Analizar primer documento</Button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <button
              key={a.id}
              className="bento-card w-full text-left p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] cursor-pointer"
              onClick={() => router.push(`/analysis/${a.id}`)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${riskColors[a.overall_risk]} 14%, var(--surface))` }}
                  aria-hidden="true"
                >
                  <span style={{ color: riskColors[a.overall_risk] }}>
                    {a.overall_risk === 'low' ? '✓' : a.overall_risk === 'critical' ? '🚨' : '⚠️'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-display font-semibold text-[var(--text-strong)] text-[15px] tracking-tight truncate">{a.document_title}</h3>
                    <RiskBadge risk={a.overall_risk} />
                  </div>
                  <p className="text-[12.5px] text-[var(--text-muted)]">
                    Score: <strong className="text-[var(--text-medium)]">{a.risk_score}/100</strong> · {new Date(a.created_at).toLocaleDateString('es-AR')}
                  </p>
                  {a.summary && (
                    <p className="text-[12.5px] text-[var(--text-medium)] mt-1 line-clamp-1">{a.summary}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
