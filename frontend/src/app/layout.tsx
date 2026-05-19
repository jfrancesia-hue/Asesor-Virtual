import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: { default: 'MiAsesor — Seis especialistas IA', template: '%s | MiAsesor' },
  description: 'Asesoría inteligente para Latinoamérica. Legal, Salud, Nutricion, Finanzas, Bienestar y Hogar bajo una sola suscripción.',
  keywords: ['asesor virtual', 'asesoria legal', 'inteligencia artificial', 'contratos', 'LATAM'],
  openGraph: {
    title: 'MiAsesor',
    description: 'Seis especialistas IA en una sola suscripción para LATAM.',
    type: 'website',
  },
  applicationName: 'MiAsesor',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MiAsesor' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FBF8F2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${jakarta.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              background: 'var(--surface)',
              color: 'var(--text-strong)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-medium)',
            },
            success: {
              iconTheme: { primary: 'var(--accent)', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
