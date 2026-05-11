'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

type PlanStatus =
  | { state: 'active_free'; plan: 'free' }
  | { state: 'active_paid'; plan: string; periodEnd: string | null; daysUntilExpiry: number | null }
  | { state: 'expiring_tomorrow'; plan: string; periodEnd: string; daysUntilExpiry: 1 }
  | { state: 'expiring_today'; plan: string; periodEnd: string; daysUntilExpiry: 0 }
  | { state: 'expired_today'; plan: 'free'; previousPlan: string; expiredAt: string }
  | { state: 'expired_yesterday'; plan: 'free'; previousPlan: string; expiredAt: string }
  | { state: 'free_exhausted'; plan: 'free'; exhaustedOf: string[] }
  | { state: 'free_partial_exhausted'; plan: 'free'; exhaustedOf: string[] };

type Tone = 'warn' | 'urgent' | 'info' | 'success';

const TONE_STYLES: Record<Tone, { bg: string; border: string; text: string; iconColor: string }> = {
  warn:    { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-900',  iconColor: 'text-amber-600' },
  urgent:  { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-900',    iconColor: 'text-red-600'   },
  info:    { bg: 'bg-slate-50',  border: 'border-slate-200', text: 'text-slate-700',  iconColor: 'text-slate-500' },
  success: { bg: 'bg-emerald-50',border: 'border-emerald-200', text: 'text-emerald-900', iconColor: 'text-emerald-600' },
};

function planLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function describe(status: PlanStatus): { tone: Tone; icon: typeof Clock; message: string; cta?: string; ctaHref?: string } | null {
  switch (status.state) {
    case 'expiring_tomorrow':
      return {
        tone: 'warn',
        icon: Clock,
        message: `Tu plan ${planLabel(status.plan)} vence mañana.`,
        cta: 'Renovar',
        ctaHref: '/settings?tab=billing',
      };
    case 'expiring_today':
      return {
        tone: 'urgent',
        icon: Clock,
        message: `Tu plan ${planLabel(status.plan)} vence hoy.`,
        cta: 'Renovar ahora',
        ctaHref: '/settings?tab=billing',
      };
    case 'expired_today':
      return {
        tone: 'urgent',
        icon: AlertTriangle,
        message: `Tu plan ${planLabel(status.previousPlan)} expiró hoy — pasaste a Gratis.`,
        cta: 'Volver a ' + planLabel(status.previousPlan),
        ctaHref: '/settings?tab=billing',
      };
    case 'expired_yesterday':
      return {
        tone: 'info',
        icon: AlertTriangle,
        message: `Tu plan ${planLabel(status.previousPlan)} expiró ayer. Estás en Gratis.`,
        cta: 'Renovar',
        ctaHref: '/settings?tab=billing',
      };
    case 'free_exhausted':
      return {
        tone: 'warn',
        icon: Sparkles,
        message: 'Usaste tu plan Gratis. Activá un plan pago para seguir.',
        cta: 'Ver planes',
        ctaHref: '/settings?tab=billing',
      };
    case 'free_partial_exhausted': {
      const what = status.exhaustedOf.map((k) =>
        k === 'contracts' ? 'contratos' : k === 'queries' ? 'consultas IA' : 'créditos',
      ).join(' y ');
      return {
        tone: 'warn',
        icon: Sparkles,
        message: `Te quedaste sin ${what} del plan Gratis.`,
        cta: 'Ver planes',
        ctaHref: '/settings?tab=billing',
      };
    }
    default:
      return null; // active_free, active_paid → no banner
  }
}

export function PlanStatusBanner() {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.tenants
      .usage()
      .then((u: any) => {
        if (!cancelled && u?.planStatus) setStatus(u.planStatus as PlanStatus);
      })
      .catch(() => {
        // banner es decorativo — si falla el usage no rompemos la app
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || dismissed) return null;

  const view = describe(status);
  if (!view) return null;

  const styles = TONE_STYLES[view.tone];
  const Icon = view.icon;

  // expired_yesterday y free_partial_exhausted son dismissibles; el resto se queda.
  const dismissible = status.state === 'expired_yesterday' || status.state === 'free_partial_exhausted';

  return (
    <div
      role="status"
      className={`flex items-center gap-2.5 ${styles.bg} ${styles.border} ${styles.text} border-b px-4 py-2 text-[13px]`}
    >
      <Icon className={`w-4 h-4 ${styles.iconColor} flex-shrink-0`} strokeWidth={2.2} />
      <span className="flex-1 min-w-0 truncate">{view.message}</span>
      {view.cta && view.ctaHref && (
        <Link
          href={view.ctaHref}
          className="font-semibold underline underline-offset-2 hover:no-underline flex-shrink-0"
        >
          {view.cta}
        </Link>
      )}
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso"
          className="ml-1 opacity-60 hover:opacity-100 flex-shrink-0 text-base leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
