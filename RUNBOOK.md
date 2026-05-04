# Runbook de Incidentes — Asesor-Virtual

## Visión general
Este runbook contiene procedimientos mínimos de respuesta para escenarios críticos en producción. Ajustá según tus SLOs y capacidades operacionales.

---

## 1. **Supabase está caído (Database/Auth)**

### Síntomas
- Errores 500 en la mayoría de endpoints
- Errores de conexión a BD en logs del backend
- Auth falla completamente

### Triage (< 5 min)
1. Verificar status de Supabase: https://status.supabase.io
2. Revisar logs de Sentry (`@sentry.io`) para patrones de error
3. Confirmar conectividad: `curl https://<PROJECT_ID>.supabase.co/rest/v1/health`

### Mitigation
- **Corta (1-2 min):** Informar al usuario via status page: "Acceso limitado — mantenimiento"
- **Media (5-10 min):**
  - Si es outage de Supabase, esperar a su resolución
  - Si es timeout de red, revisar variables `.env`: `SUPABASE_URL`, `DATABASE_URL`
  - Verificar métricas de CPU/memoria del pod backend

### Escalación
- Si > 15 min de downtime: contactar soporte de Supabase
- Preparar rollback o failover a ambiente de staging si es disponible

---

## 2. **Stripe rechaza webhooks (Billing)**

### Síntomas
- HTTP 5xx al recibir eventos de `checkout.session.completed`
- Usuarios reportan que pagos no se acreditan
- Logs: `"Error procesando webhook de Stripe"`

### Triage
1. Verificar que `STRIPE_WEBHOOK_SECRET` sea correctamente configurado en `.env`
2. Revisar signatures en Stripe Dashboard → **Developers** → **Webhooks**:
   - Confirmar que el endpoint registrado es correcto
   - Revisar logs de intentos fallidos

### Mitigation
- **Inmediato:** Si falla por mala firma, re-deployar backend con `STRIPE_WEBHOOK_SECRET` correcto
- **Diagnostico:** Ejecutar en el backend (si hay aceso SSH):
  ```bash
  curl -X POST https://api.stripe.com/v1/webhook_endpoints \
    -u $STRIPE_SECRET_KEY: \
    -d url="https://api.asesor-virtual.com/api/billing/webhook" \
    -d events[]="checkout.session.completed"
  ```
- **Recuperación:** Verificar eventos no procesados en `stripe_webhook_events` table:
  ```sql
  SELECT event_id, event_type, created_at FROM stripe_webhook_events 
  WHERE processed_at IS NULL 
  ORDER BY created_at DESC LIMIT 10;
  ```

---

## 3. **Autenticación rota — muchos 401/403**

### Síntomas
- Usuarios no pueden hacer login
- JWT tokens rechazan con `"Token inválido o expirado"`
- Session se pierde sin razón

### Triage
1. Verificar que `JWT_SECRET` en `.env` sea consistente
2. Si cambió `JWT_SECRET` recientemente: las sesiones antiguas serán inválidas (esperable)
3. Revisar cookies en DevTools → **Application** → **Cookies**:
   - Buscar `av_access` y `av_refresh`
   - Confirmar `HttpOnly`, `Secure` (en prod), `SameSite=none`

### Mitigation
- **Borrar cookies + re-login:** Instruir usuarios a limpiar cookies del navegador
- **If JWT_SECRET rotó sin intención:**
  - Restaurar `.env` a versión anterior
  - Re-deployar backend
  - Las sesiones existentes funcionar de nuevo

---

## 4. **Rate limiting too aggressive (429 Too Many Requests)**

### Síntomas
- Usuarios reciben 429 aunque no están atacando
- Endpoints específicos (login, register) siempre fallan

### Triage
1. Verificar configuración actual en `.env`:
   - `THROTTLE_TTL` (ms)
   - `THROTTLE_LIMIT` (req)
2. Para auth endpoints específicos, revisar decoradores en `auth.controller.ts`:
   - `@Throttle({ default: { limit: 10, ttl: 60000 } })`

### Mitigation
- **Temporal (1-2 min):**
  ```bash
  # Si es un bot/scraper legítimo, whitelist IP en el reverse proxy (nginx/Cloudflare)
  ```
- **Permanente:**
  - Aumentar `THROTTLE_LIMIT` en `.env` si es demasiado agresivo
  - Re-deployar backend

---

## 5. **Certificado SSL/HTTPS expiró**

### Síntomas
- Navegadores avisan: "Conexión no segura"
- Errores SSL/TLS en logs

### Triage
1. Verificar fecha de vencimiento:
   ```bash
   openssl s_client -connect api.asesor-virtual.com:443 -showcerts | grep notAfter
   ```

### Mitigation
- Si usas Let's Encrypt automático (Certbot, reverse proxy automático):
  - Reiniciar servicio de certificado
  - Verificar logs del daemon
- Si usas certificado manual: solicitar nuevo certificado inmediatamente

---

## 6. **Backend pod crash loop**

### Síntomas
- Logs: `[Error] Cannot find module` o `Reflect.getMetadata is not a function`
- Pod restart infinito

### Triage
1. Revisar logs del contenedor:
   ```bash
   docker logs <container_id> -n 50
   ```
2. Verificar variables `.env` faltantes

### Mitigation
- **Rebuild & Re-deploy:**
  ```bash
  npm install
  npm run build
  npm start
  ```
- **Si error persiste:** rollback a última versión estable

---

## 7. **Memoria/CPU agotado (OOM, CPU spike)**

### Síntomas
- Procesos lentos o timeout
- Pod killed por OOMKiller

### Triage
1. Ver uso actual:
   ```bash
   docker stats <container_id>
   free -h  # servidor host
   ```

### Mitigation
- **Corta:** Reiniciar pod/servicio
- **Media:** Aumentar límites de recurso en Docker o Kubernetes
- **Larga:** Profile con Clinic.js o New Relic para identificar memory leaks

---

## Procedimiento general de respuesta

1. **Detect** (< 2 min):
   - Alertas de Sentry, uptime monitor, usuario reports
   
2. **Triage** (< 5 min):
   - Identificar el tipo de incidente
   - Revisar logs relevantes
   
3. **Comunicar** (ASAP):
   - Actualizar status page
   - Notificar team si necesario
   
4. **Mitigate** (< 15 min):
   - Tomar acciones para minimizar impacto
   
5. **Resolve** (< 1 hora):
   - Fix root cause, verifyfix, deploy
   
6. **Post-mortem** (< 24 h):
   - Documentar qué falló, por qué, cómo prevenir

---

## Contactos y recursos

- **Sentry:** https://sentry.io (revisar alerts)
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Supabase Dashboard:** https://app.supabase.com
- **Backend logs:** Via `docker logs` o journalctl si systemd
- **Frontend logs:** Browser DevTools, Sentry Client

---

## Checklist de tests pre-deploy

- [ ] `npm test` pasa (backend)
- [ ] `npm run build` sin errores (backend y frontend)
- [ ] `.env.local` o `.env` existe con valores reales (no placeholders)
- [ ] HTTPS funciona (cert válido)
- [ ] Rate limiting verificado manualmente
- [ ] CORS headers correctos (verificar con `curl -I`)
- [ ] Webhooks de Stripe funcionan (test con evento mock)

---

**Última actualización:** 2026-05-04  
**Responsable:** DevOps/Engineering team
