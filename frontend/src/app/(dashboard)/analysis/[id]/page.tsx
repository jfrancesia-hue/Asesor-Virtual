'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, RiskBadge, Badge, Spinner } from '@/components/ui';

const CATEGORY_LABELS: Record<string, string> = {
  abusiva: 'Abusiva',
  ambigua: 'Ambigua',
  faltante: 'Faltante',
  ilegal: 'Ilegal',
  desbalanceada: 'Desbalanceada',
  ok: 'OK',
};

const CATEGORY_COLORS: Record<string, 'red' | 'yellow' | 'orange' | 'purple' | 'blue' | 'green'> = {
  abusiva: 'red',
  ambigua: 'yellow',
  faltante: 'orange',
  ilegal: 'purple',
  desbalanceada: 'orange',
  ok: 'green',
};

const RISK_COLOR_TOKEN: Record<string, string> = {
  low: 'var(--accent)',
  medium: 'var(--brand-yellow)',
  high: 'var(--cta)',
  critical: '#dc2626',
};

const RISK_EMOJI: Record<string, string> = {
  low: '✅',
  medium: '⚠️',
  high: '🔴',
  critical: '🚨',
};

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.analysis.get(id)
      .then((data) => !cancelled && setAssessment(data))
      .catch((err: any) => !cancelled && toast.error(err?.message || 'Error al cargar análisis'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!assessment) {
    return (
      <div className="px-6 md:px-8 py-20 text-center">
        <p className="text-[var(--text-medium)]">Análisis no encontrado.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/analysis')}>
          Volver
        </Button>
      </div>
    );
  }

  const riskColor = RISK_COLOR_TOKEN[assessment.overall_risk as string] ?? 'var(--text-muted)';
  const riskEmoji = RISK_EMOJI[assessment.overall_risk as string] ?? '📄';

  return (
    <div className="px-6 md:px-8 py-10 max-w-5xl mx-auto">
      <button
        onClick={() => router.push('/analysis')}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-medium)] hover:text-[var(--text-strong)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.4} /> Volver
      </button>

      {/* Header */}
      <div className="bento-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-5">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `color-mix(in srgb, ${riskColor} 14%, var(--surface))` }}
            aria-hidden="true"
          >
            {riskEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
              Análisis IA
            </p>
            <h1 className="mt-2 font-display text-[clamp(20px,3vw,28px)] font-bold tracking-[-0.025em] text-[var(--text-strong)]">
              {assessment.document_title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mt-3">
              <RiskBadge risk={assessment.overall_risk} />
              <span className="text-sm text-[var(--text-medium)]">
                Score: <strong className="text-[var(--text-strong)]">{assessment.risk_score}/100</strong>
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                {new Date(assessment.created_at).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>
        </div>

        {/* Risk bar */}
        <div className="mt-6">
          <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            <span>Bajo riesgo</span>
            <span>Alto riesgo</span>
          </div>
          <div className="w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{ width: `${assessment.risk_score}%`, backgroundColor: riskColor }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {assessment.summary && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-5">
          <h2 className="font-display font-bold text-[var(--text-strong)] tracking-tight mb-2">
            Resumen ejecutivo
          </h2>
          <p className="text-[14.5px] text-[var(--text-medium)] leading-relaxed">
            {assessment.summary}
          </p>
        </div>
      )}

      {/* Findings */}
      {assessment.findings && assessment.findings.length > 0 && (
        <section aria-labelledby="findings-heading">
          <h2
            id="findings-heading"
            className="font-display font-bold text-lg text-[var(--text-strong)] tracking-tight mb-4"
          >
            Hallazgos ({assessment.findings.length})
          </h2>
          <div className="space-y-3">
            {assessment.findings.map((f: any) => (
              <div
                key={f.id}
                className="bento-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <RiskBadge risk={f.risk_level} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-display font-semibold text-[var(--text-strong)] tracking-tight text-[15px]">
                        {f.clause_title}
                      </h3>
                      <Badge color={CATEGORY_COLORS[f.category] || 'slate'}>
                        {CATEGORY_LABELS[f.category]}
                      </Badge>
                    </div>
                    {f.clause_text && (
                      <blockquote className="text-xs text-[var(--text-muted)] border-l-2 border-[var(--border-strong)] pl-3 mb-3 italic">
                        &quot;{f.clause_text}&quot;
                      </blockquote>
                    )}
                    <p className="text-sm text-[var(--text-medium)] leading-relaxed mb-3">
                      {f.explanation}
                    </p>
                    {f.recommendation && (
                      <div className="bg-[var(--primary-bg)] rounded-xl p-3.5 border border-[var(--primary)]/20">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-dark)] mb-1">
                          Recomendación
                        </p>
                        <p className="text-[13px] text-[var(--primary-dark)] leading-relaxed">
                          {f.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
