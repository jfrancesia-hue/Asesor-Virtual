'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: 'dashboard' } });
  }, [error]);

  const router = useRouter();

  const isNetwork = error.message?.includes('fetch') || error.message?.includes('network');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-10 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'color-mix(in srgb, #dc2626 14%, var(--surface))' }}
        aria-hidden="true"
      >
        <AlertTriangle className="w-7 h-7 text-red-600" strokeWidth={2.2} />
      </div>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
        {isNetwork ? 'Sin conexión' : 'Error inesperado'}
      </p>
      <h2 className="mt-2 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.025em] text-[var(--text-strong)]">
        Algo salió mal
      </h2>
      <p className="mt-3 text-sm text-[var(--text-medium)] max-w-md leading-relaxed">
        {isNetwork
          ? 'No pudimos conectar con el servidor. Verificá tu conexión a internet y volvé a intentar.'
          : 'Ocurrió un error inesperado al cargar esta sección. Podés reintentar o volver al inicio.'}
      </p>
      <div className="flex flex-wrap gap-3 mt-7">
        <button
          onClick={() => reset()}
          className="magnetic-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--cta)] text-white text-sm font-bold rounded-xl shadow-[0_8px_24px_rgba(230,126,34,0.35)] hover:bg-[var(--cta-dark)] transition-all"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={2.4} />
          Reintentar
        </button>
        <button
          onClick={() => router.push('/home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] text-sm font-semibold rounded-xl hover:bg-[var(--surface-subtle)] transition-colors"
        >
          <Home className="w-4 h-4" strokeWidth={2.2} />
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
