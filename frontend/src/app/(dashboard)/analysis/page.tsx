'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, Input, TextArea, EmptyState, Spinner, RiskBadge, Badge } from '@/components/ui';

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
    low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Análisis de Documentos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Analizá contratos con semáforo de riesgo IA</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <AlertTriangle className="w-4 h-4" />
          Nuevo análisis
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-5 mb-6 border-blue-200">
          <h2 className="font-semibold text-slate-800 mb-4">Analizar documento</h2>
          <div className="space-y-3">
            <Input
              label="Título del documento"
              placeholder="Contrato de Locación — Calle X 123"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Subir PDF o TXT</p>
                <p className="text-xs text-slate-400">Máx. 10MB</p>
              </div>
              <span className="text-slate-400 text-sm">o</span>
              <div className="flex-1 text-center">
                <p className="text-sm text-slate-500 mb-1">Pegá el texto directamente</p>
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
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : analyses.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Sin análisis"
          description="Analizá un contrato para identificar riesgos y cláusulas problemáticas."
          action={<Button onClick={() => setShowForm(true)}>Analizar primer documento</Button>}
        />
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <Card
              key={a.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/analysis/${a.id}`)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0"
                  style={{ backgroundColor: riskColors[a.overall_risk] + '20' }}
                >
                  <span style={{ color: riskColors[a.overall_risk] }}>
                    {a.overall_risk === 'low' ? '✓' : a.overall_risk === 'critical' ? '🚨' : '⚠️'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-800 text-sm truncate">{a.document_title}</h3>
                    <RiskBadge risk={a.overall_risk} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Score: {a.risk_score}/100 · {new Date(a.created_at).toLocaleDateString('es-AR')}
                  </p>
                  {a.summary && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{a.summary}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
