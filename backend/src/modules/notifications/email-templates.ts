/**
 * Templates de email transaccional. Solo conservamos los que el código
 * efectivamente envía (notifications.service). Si más adelante se
 * implementa welcome / invite / analysisComplete / creditsLow,
 * agregar el template acá y la llamada en el service correspondiente.
 */
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.miasesor.com.ar';

export const emailTemplates = {
  contractExpiring: (name: string, contractTitle: string, daysLeft: number, contractUrl: string) => ({
    subject: `⚠️ Contrato por vencer: ${contractTitle}`,
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#E67E22;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">⚠️ Contrato por Vencer</h1>
</div>
<div style="background:#FBF8F2;padding:30px;border-radius:0 0 8px 8px">
  <p>Hola <strong>${name}</strong>,</p>
  <p>El contrato <strong>"${contractTitle}"</strong> vence en <strong>${daysLeft} días</strong>.</p>
  <p>Revisalo y tomá las acciones necesarias antes del vencimiento.</p>
  <a href="${contractUrl}" style="background:#E67E22;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Ver contrato →
  </a>
</div>
<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">MiAsesor</p>
</body></html>`,
  }),

  planExpired: (name: string, plan: string, renewUrl: string) => ({
    subject: `Tu plan ${plan} expiró — pasaste a Gratis`,
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#6b7280;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">Tu plan ${plan} expiró</h1>
</div>
<div style="background:#FBF8F2;padding:30px;border-radius:0 0 8px 8px">
  <p>Hola <strong>${name}</strong>,</p>
  <p>Tu plan <strong>${plan}</strong> venció y tu cuenta pasó automáticamente a <strong>plan Gratis</strong>.</p>
  <p>Tus datos están intactos — contratos, conversaciones, todo sigue ahí. Sólo cambiaron tus límites mensuales:</p>
  <ul style="line-height:1.8">
    <li>1 contrato por mes</li>
    <li>2 consultas con asesores IA por mes</li>
    <li>1 análisis de documento</li>
  </ul>
  <p>Cuando quieras volver al plan ${plan}, renová desde acá:</p>
  <a href="${renewUrl}" style="background:#E67E22;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px;font-weight:bold">
    Renovar ${plan} →
  </a>
</div>
<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">MiAsesor</p>
</body></html>`,
  }),

  complianceOverdue: (name: string, itemTitle: string, dueDate: string) => ({
    subject: `🚨 Obligación vencida: ${itemTitle}`,
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#dc2626;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">🚨 Obligación Vencida</h1>
</div>
<div style="background:#FBF8F2;padding:30px;border-radius:0 0 8px 8px">
  <p>Hola <strong>${name}</strong>,</p>
  <p>La obligación <strong>"${itemTitle}"</strong> venció el <strong>${dueDate}</strong> y está sin completar.</p>
  <a href="${FRONTEND_URL}/dashboard" style="background:#dc2626;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Ver obligaciones →
  </a>
</div>
<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">MiAsesor</p>
</body></html>`,
  }),
};
