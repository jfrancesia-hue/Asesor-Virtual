'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Button, RiskBadge, Badge, Spinner } from '@/components/ui';

const CATEGORY_LABELS: Record<string, string> = {
  abusiva: 'Abusiva', ambigua: 'Ambigua', faltante: 'Faltante',
  ilegal: 'Ilegal', desbalanceada: 'Desbalanceada', ok: 'OK',
};

const CATEGORY_COLORS: Record<string, 'red' | 'yellow' | 'orange' | 'purple' | 'blue' | 'green'> = {
  abusiva: 'red', ambigua: 'yellow', faltante: 'orange',
  ilegal: 'purple', desbalanceada: 'orange', ok: 'green',
};

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analysis.get(id)
      .then(setAssessment)
      .catch(() => toast.error('Error al cargar análisis'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!assessment) return <div className="p-6 text-center text-slate-500">Análisis no encontrado</div>;

  const riskColorMap: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
  const riskColor = riskColorMap[assessment.overall_risk as string] ?? '#64748b';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => router.push('/analysis')}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>

      {/* Header */}
      <Card className="p-5 mb-4">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: riskColor + '20' }}
          >
            {assessment.overall_risk === 'low' ? '✅' :
             assessment.overall_risk === 'medium' ? '⚠️' :
             assessment.overall_risk === 'high' ? '🔴' : '🚨'}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 mb-2">{assessment.document_title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <RiskBadge risk={assessment.overall_risk} />
              <span className="text-sm text-slate-500">Score de riesgo: <strong>{assessment.risk_score}/100</strong></span>
              <span className="text-sm text-slate-400">{new Date(assessment.created_at).toLocaleDateString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* Risk bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Bajo riesgo</span>
            <span>Alto riesgo</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{ width: `${assessment.risk_score}%`, backgroundColor: riskColor }}
            />
          </div>
        </div>
      </Card>

      {/* Summary */}
      {assessment.summary && (
        <Card className="p-5 mb-4">
          <h2 className="font-semibold text-slate-800 mb-2">Resumen ejecutivo</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{assessment.summary}</p>
        </Card>
      )}

      {/* Findings */}
      {assessment.findings && assessment.findings.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-800 mb-3">
            Hallazgos ({assessment.findings.length})
          </h2>
          <div className="space-y-3">
            {assessment.findings.map((f: any) => (
              <Card key={f.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <RiskBadge risk={f.risk_level} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-medium text-slate-800 text-sm">{f.clause_title}</h3>
                      <Badge color={CATEGORY_COLORS[f.category] || 'slate'}>
                        {CATEGORY_LABELS[f.category]}
                      </Badge>
                    </div>
                    {f.clause_text && (
                      <blockquote className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3 mb-2 italic">
                        "{f.clause_text}"
                      </blockquote>
                    )}
                    <p className="text-sm text-slate-700 mb-2">{f.explanation}</p>
                    {f.recommendation && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1">Recomendación</p>
                        <p className="text-xs text-blue-600">{f.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
