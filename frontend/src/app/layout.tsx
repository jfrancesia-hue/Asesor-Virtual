import type { Metadata } from 'next';
import { Fraunces, Instrument_Sans, JetBrains_Mono, DM_Sans, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'TuAsesor - Cinco especialistas IA', template: '%s | TuAsesor' },
  description: 'Asesoria inteligente para Latinoamerica. Legal, Salud, Finanzas, Bienestar y Hogar bajo una sola suscripcion.',
  keywords: ['asesor virtual', 'asesoria legal', 'inteligencia artificial', 'contratos', 'LATAM'],
  openGraph: {
    title: 'TuAsesor',
    description: 'Cinco especialistas IA en una experiencia 3D para LATAM.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} ${dmSans.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'var(--font-geist), system-ui, sans-serif',
              background: '#0b1019',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.12)',
            },
          }}
        />
      </body>
    </html>
  );
}
