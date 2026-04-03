export const emailTemplates = {
  welcome: (name: string, planName: string) => ({
    subject: 'Bienvenido a Asesor Virtual',
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#3b82f6;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">⚖️ Asesor Virtual</h1>
</div>
<div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
  <h2>¡Hola ${name}!</h2>
  <p>Bienvenido a <strong>Asesor Virtual</strong>. Tu cuenta con plan <strong>${planName}</strong> está activa.</p>
  <p>Tenés acceso a <strong>5 asesores IA especializados</strong>:</p>
  <ul>
    <li>⚖️ <strong>Legal</strong> — Contratos y asesoría jurídica LATAM</li>
    <li>🏥 <strong>Salud</strong> — Orientación en salud y bienestar</li>
    <li>💰 <strong>Finanzas</strong> — Planificación financiera</li>
    <li>🧠 <strong>Bienestar</strong> — Apoyo emocional</li>
    <li>🏠 <strong>Hogar</strong> — Mantenimiento del hogar</li>
  </ul>
  <a href="${process.env.FRONTEND_URL}/home" style="background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Comenzar ahora →
  </a>
</div>
<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">
  Asesor Virtual — Nativos Consultora Digital
</p>
</body></html>`,
  }),

  contractExpiring: (name: string, contractTitle: string, daysLeft: number, contractUrl: string) => ({
    subject: `⚠️ Contrato por vencer: ${contractTitle}`,
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#f59e0b;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">⚠️ Contrato por Vencer</h1>
</div>
<div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
  <p>Hola <strong>${name}</strong>,</p>
  <p>El contrato <strong>"${contractTitle}"</strong> vence en <strong>${daysLeft} días</strong>.</p>
  <p>Revisalo y tomá las acciones necesarias antes del vencimiento.</p>
  <a href="${contractUrl}" style="background:#f59e0b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Ver contrato →
  </a>
</div></body></html>`,
  }),

  complianceOverdue: (name: string, itemTitle: string, dueDate: string) => ({
    subject: `🚨 Obligación vencida: ${itemTitle}`,
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#ef4444;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">🚨 Obligación Vencida</h1>
</div>
<div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
  <p>Hola <strong>${name}</strong>,</p>
  <p>La obligación <strong>"${itemTitle}"</strong> venció el <strong>${dueDate}</strong> y está sin completar.</p>
  <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#ef4444;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Ver obligaciones →
  </a>
</div></body></html>`,
  }),

  analysisComplete: (name: string, docTitle: string, riskLevel: string, analysisUrl: string) => ({
    subject: `✅ Análisis completado: ${docTitle}`,
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#10b981;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">✅ Análisis Completado</h1>
</div>
<div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
  <p>Hola <strong>${name}</strong>,</p>
  <p>El análisis de <strong>"${docTitle}"</strong> está listo.</p>
  <p>Nivel de riesgo detectado: <strong style="text-transform:uppercase">${riskLevel}</strong></p>
  <a href="${analysisUrl}" style="background:#10b981;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Ver resultado →
  </a>
</div></body></html>`,
  }),

  invite: (inviterName: string, orgName: string, loginUrl: string) => ({
    subject: `Te invitaron a ${orgName} en Asesor Virtual`,
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#3b82f6;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">⚖️ Asesor Virtual</h1>
</div>
<div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
  <p><strong>${inviterName}</strong> te invitó a unirte a <strong>${orgName}</strong> en Asesor Virtual.</p>
  <a href="${loginUrl}" style="background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Aceptar invitación →
  </a>
</div></body></html>`,
  }),

  creditsLow: (name: string, balance: number) => ({
    subject: '⚡ Créditos bajos en Asesor Virtual',
    html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#8b5cf6;padding:20px;border-radius:8px 8px 0 0;text-align:center">
  <h1 style="color:white;margin:0">⚡ Créditos Bajos</h1>
</div>
<div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
  <p>Hola <strong>${name}</strong>,</p>
  <p>Te quedan solo <strong>${balance} créditos</strong> para análisis de documentos.</p>
  <a href="${process.env.FRONTEND_URL}/settings?tab=billing" style="background:#8b5cf6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">
    Comprar créditos →
  </a>
</div></body></html>`,
  }),
};
