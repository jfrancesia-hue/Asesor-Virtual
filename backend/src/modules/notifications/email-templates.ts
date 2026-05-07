/**
 * Templates de email transaccional. Solo conservamos los que el código
 * efectivamente envía (notifications.service). Si más adelante se
 * implementa welcome / invite / analysisComplete / creditsLow,
 * agregar el template acá y la llamada en el service correspondiente.
 */
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
  <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#dc2626;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Ver obligaciones →
  </a>
</div>
<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">MiAsesor</p>
</body></html>`,
  }),
};
