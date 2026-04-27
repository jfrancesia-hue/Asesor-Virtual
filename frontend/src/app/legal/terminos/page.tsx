import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Términos de uso del servicio TuAsesor.',
};

const SECTIONS = [
  {
    num: 'I',
    title: 'Objeto del servicio',
    body: [
      'TuAsesor brinda asesoramiento informativo generado por modelos de inteligencia artificial, especializados en cinco áreas: legal, salud, finanzas, bienestar y hogar. Las respuestas son orientativas y no reemplazan el juicio de un profesional colegiado cuando la materia lo exige.',
      'El servicio se presta a través de la plataforma web y, eventualmente, aplicaciones móviles oficiales.',
    ],
  },
  {
    num: 'II',
    title: 'Registro y cuenta',
    body: [
      'Para acceder debés tener mayoría de edad en tu jurisdicción, registrar datos verídicos y mantener la confidencialidad de tu contraseña. Sos responsable de toda actividad ejecutada desde tu cuenta.',
      'Nos reservamos el derecho de suspender cuentas ante sospechas fundadas de uso fraudulento, violación de estos términos o requerimientos de autoridades competentes.',
    ],
  },
  {
    num: 'III',
    title: 'Planes y cobros',
    body: [
      'El servicio se comercializa mediante suscripción mensual recurrente en dólares estadounidenses, procesada por Stripe. El cargo se renueva automáticamente al cierre de cada período hasta que canceles.',
      'La cancelación es inmediata desde tu panel y surte efecto al final del período ya facturado. No se emiten reembolsos prorrateados salvo en casos de indisponibilidad prolongada del servicio atribuible a la plataforma.',
    ],
  },
  {
    num: 'IV',
    title: 'Uso aceptable',
    body: [
      'Te comprometés a no usar el servicio para: obtener asesoramiento destinado a actividades ilícitas, eludir sistemas de seguridad, generar contenido que infrinja derechos de terceros, hacer ingeniería inversa a los modelos subyacentes, o sobrecargar la infraestructura con volúmenes automatizados.',
      'El incumplimiento habilita la suspensión inmediata de la cuenta sin derecho a reembolso.',
    ],
  },
  {
    num: 'V',
    title: 'Limitación de responsabilidad',
    body: [
      'Las respuestas de los asesores IA son informativas. Para decisiones con efectos jurídicos, clínicos o patrimoniales definitivos, consultá con un profesional humano. TuAsesor no asume responsabilidad por daños derivados del uso no profesional de la información proporcionada.',
      'Nuestra responsabilidad agregada, en cualquier caso, queda limitada al monto efectivamente pagado por el usuario en los 12 meses previos al hecho generador del reclamo.',
    ],
  },
  {
    num: 'VI',
    title: 'Propiedad intelectual',
    body: [
      'La plataforma, su código, diseño, marcas y modelos propietarios son titularidad de TuAsesor SAS. El contenido generado en respuesta a tus consultas es de uso libre para vos; no reclamamos derechos sobre él.',
      'Los documentos que subas permanecen bajo tu titularidad. Solo los procesamos para responder tu consulta y los eliminamos al finalizar el análisis, salvo que decidas archivarlos en tu panel.',
    ],
  },
  {
    num: 'VII',
    title: 'Jurisdicción',
    body: [
      'Este contrato se rige por las leyes de la República Argentina. Cualquier controversia se resolverá ante los tribunales ordinarios con asiento en la Ciudad Autónoma de Buenos Aires, con renuncia expresa a cualquier otro fuero.',
      'Para consumidores finales de otros países de LATAM, aplica la jurisdicción del consumidor conforme la normativa de defensa del consumidor local cuando resulte más favorable.',
    ],
  },
  {
    num: 'VIII',
    title: 'Modificaciones',
    body: [
      'Podemos actualizar estos términos para adecuarlos a cambios normativos o de producto. Te avisaremos por correo con 30 días de antelación; el uso del servicio tras esa fecha implica aceptación.',
    ],
  },
];

export default function TermsPage() {
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
          Términos y condiciones
        </h1>
        <p className="mt-6 text-[16px] leading-[1.7] text-ink-muted max-w-[60ch]">
          Estos términos rigen tu relación con TuAsesor SAS. Leelos antes de suscribirte. Si algo no te queda claro, escribinos.
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
          Consultas legales
        </div>
        <p className="text-[15px] leading-[1.7] text-ink">
          Escribinos a{' '}
          <a href="mailto:legal@tuasesor.app" className="editorial-link text-oxblood">
            legal@tuasesor.app
          </a>
          .
        </p>
      </div>
    </article>
  );
}
