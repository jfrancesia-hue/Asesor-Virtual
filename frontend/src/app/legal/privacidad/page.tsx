import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo Mi Asesor recolecta, usa y protege tus datos personales.',
};

const SECTIONS = [
  {
    num: 'I',
    title: 'Datos que recolectamos',
    body: [
      'Al registrarte: nombre, correo electrónico, país de residencia y, si contratás un plan pago, datos de facturación procesados por Stripe (no almacenamos números completos de tarjeta).',
      'Durante el uso: contenido de tus consultas, documentos que subas para análisis, historial de conversación, metadatos técnicos (IP, user-agent, tipo de dispositivo) y logs de acceso.',
    ],
  },
  {
    num: 'II',
    title: 'Finalidad del tratamiento',
    body: [
      'Operar el servicio (procesar tus consultas con los asesores IA, facturarte, enviarte notificaciones transaccionales).',
      'Mejorar la calidad de respuesta mediante análisis agregado y anónimo. Nunca entrenamos modelos con el contenido individual de tus conversaciones.',
      'Cumplir obligaciones legales (retención fiscal, respuestas a requerimientos judiciales).',
    ],
  },
  {
    num: 'III',
    title: 'Base legal',
    body: [
      'Ejecución del contrato que aceptaste al registrarte (art. 6.1.b GDPR · art. 5 Ley 25.326 AR).',
      'Consentimiento explícito para comunicaciones comerciales, revocable en cualquier momento desde tu panel.',
      'Interés legítimo para prevención de fraude y seguridad del servicio.',
    ],
  },
  {
    num: 'IV',
    title: 'Encargados de tratamiento',
    body: [
      'Supabase (base de datos, hosting LATAM-US). OpenAI y Anthropic (procesamiento de consultas IA, políticas zero-retention activadas). Stripe (pagos). Resend (correo transaccional). Sentry (monitoreo de errores, datos anonimizados).',
      'Todos firmaron DPAs y cumplen con GDPR y estándares equivalentes.',
    ],
  },
  {
    num: 'V',
    title: 'Transferencias internacionales',
    body: [
      'Algunos proveedores procesan datos en Estados Unidos y la Unión Europea. Estas transferencias se rigen por las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea y decisiones de adecuación para residentes LATAM.',
    ],
  },
  {
    num: 'VI',
    title: 'Conservación',
    body: [
      'Conservamos tus datos mientras mantengas la cuenta activa. Al solicitar la eliminación, borramos todo en un plazo de 30 días, salvo obligaciones legales (facturación, prevención de fraude) que exijan retención acotada.',
    ],
  },
  {
    num: 'VII',
    title: 'Derechos del titular',
    body: [
      'Acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos. Ejercelo desde tu panel o escribiendo a privacidad@miasesor.app. Respondemos en 10 días hábiles.',
      'Podés reclamar ante la Agencia de Acceso a la Información Pública (Argentina), INAI (México), SIC (Colombia), o tu autoridad local.',
    ],
  },
  {
    num: 'VIII',
    title: 'Seguridad',
    body: [
      'Cifrado AES-256 en reposo, TLS 1.3 en tránsito. Autenticación de dos factores disponible. Accesos administrativos auditados, principio de mínimo privilegio. Pruebas de penetración externas anuales.',
    ],
  },
  {
    num: 'IX',
    title: 'Menores de edad',
    body: [
      'Mi Asesor no está dirigido a menores de 16 años. No recolectamos datos de menores conscientemente. Si detectás el registro de un menor, escribinos para eliminarlo.',
    ],
  },
  {
    num: 'X',
    title: 'Cambios',
    body: [
      'Si modificamos esta política de forma sustancial, te avisamos por correo con 30 días de antelación y anunciamos los cambios en esta página.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <article className="max-w-[900px] mx-auto px-6 py-20">
      <div className="mb-12">
        <div className="font-mono text-[11px] uppercase tracking-editorial text-oxblood mb-4">
          Documento legal · Vigente desde abril 2026
        </div>
        <h1
          className="font-display text-ink leading-[0.98] tracking-display text-[clamp(2.2rem,5vw,4rem)]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
        >
          Política de privacidad
        </h1>
        <p className="mt-6 text-[16px] leading-[1.7] text-ink-muted max-w-[60ch]">
          Este documento explica qué datos recolectamos, cómo los usamos y qué derechos tenés sobre ellos. Está redactado en lenguaje llano y cumple con Ley 25.326 (Argentina), LFPDPPP (México), Ley 1581/2012 (Colombia), LGPD (Brasil) y GDPR.
        </p>
      </div>

      <div className="space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.num} className="border-t border-ink/15 pt-8">
            <div className="flex items-baseline gap-6">
              <span className="font-mono text-[11px] uppercase tracking-editorial text-ink-muted shrink-0 w-10">
                {s.num}
              </span>
              <div className="flex-1">
                <h2
                  className="font-display text-[26px] md:text-[32px] leading-[1.1] text-ink tracking-display"
                  style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}
                >
                  {s.title}
                </h2>
                <div className="mt-5 space-y-4">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-[15px] leading-[1.75] text-ink-muted max-w-[65ch]">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 p-8 border-l-2 border-oxblood bg-paper-soft">
        <div className="font-mono text-[10px] uppercase tracking-editorial text-ink-muted mb-3">
          Contacto
        </div>
        <p className="text-[15px] leading-[1.7] text-ink">
          Responsable del tratamiento: Mi Asesor SAS · CUIT 30-12345678-9 · Av. Corrientes 1234, CABA, Argentina. Consultas de privacidad:{' '}
          <a href="mailto:privacidad@miasesor.app" className="editorial-link text-oxblood">
            privacidad@miasesor.app
          </a>
          .
        </p>
      </div>
    </article>
  );
}
