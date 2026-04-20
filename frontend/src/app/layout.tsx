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
  title: { default: 'Mi Asesor — Cinco especialistas. Una conversación.', template: '%s | Mi Asesor' },
  description: 'Asesoría inteligente para Latinoamérica. Legal, Salud, Finanzas, Bienestar y Hogar bajo una sola suscripción.',
  keywords: ['mi asesor', 'asesoría legal', 'inteligencia artificial', 'contratos', 'LATAM'],
  openGraph: {
    title: 'Mi Asesor',
    description: 'Cinco especialistas. Una conversación. Asesoría inteligente para LATAM.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} ${dmSans.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '2px',
              fontSize: '13px',
              fontFamily: 'var(--font-geist), system-ui, sans-serif',
              background: '#18120D',
              color: '#F4EEE3',
              border: '1px solid #2a1f17',
            },
          }}
        />
      </body>
    </html>
  );
}
