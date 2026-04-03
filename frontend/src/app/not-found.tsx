import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-blue-600 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Página no encontrada</h1>
        <p className="text-slate-500 mb-6">El recurso que buscás no existe o fue movido.</p>
        <Link href="/home" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
