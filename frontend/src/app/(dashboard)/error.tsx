'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">Algo salió mal</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {error.message?.includes('fetch') || error.message?.includes('network')
          ? 'No se pudo conectar con el servidor. Verificá tu conexión.'
          : 'Ocurrió un error inesperado. Podés intentar nuevamente.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
