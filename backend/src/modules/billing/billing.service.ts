import {
  Injectable, Inject, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { NotificationsService } from '../notifications/notifications.service';

// Precios en ARS (pesos argentinos). MP solo cobra en pesos.
const PLAN_PRICES_ARS = {
  start: 7900,
  pro: 19900,
  enterprise: 59900,
};

const PLAN_LIMITS = {
  start: { max_users: 1, max_contracts_per_month: 5, max_ai_queries_per_month: 20, max_analysis_credits: 2 },
  pro: { max_users: 5, max_contracts_per_month: 25, max_ai_queries_per_month: 100, max_analysis_credits: 10 },
  enterprise: { max_users: 99999, max_contracts_per_month: 99999, max_ai_queries_per_month: 1000, max_analysis_credits: 30 },
};

const CREDIT_PACKS = {
  credits_10:  { amount: 10,  ars: 4900 },
  credits_30:  { amount: 30,  ars: 9900 },
  credits_100: { amount: 100, ars: 24900 },
};

type CreditPackKey = keyof typeof CREDIT_PACKS;
type PlanKey = keyof typeof PLAN_LIMITS;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly mp: MercadoPagoConfig | null = null;

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    const accessToken = config.get<string>('MP_ACCESS_TOKEN');
    if (accessToken) {
      this.mp = new MercadoPagoConfig({ accessToken });
    } else {
      this.logger.warn('Mercado Pago not configured — billing endpoints disabled');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Wallet & ledger (DB-only, no payment provider)
  // ────────────────────────────────────────────────────────────
  async getWallet(tenantId: string) {
    const { data, error } = await this.supabase
      .from('credit_wallets')
      .select('balance, total_purchased, total_consumed, updated_at')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) throw new NotFoundException('Wallet no encontrado');
    return data;
  }

  async getTransactions(tenantId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { data, count } = await this.supabase
      .from('credit_ledger')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { transactions: data || [], total: count || 0, page, limit };
  }

  // ────────────────────────────────────────────────────────────
  // Checkout → MP Preference (one-shot payment)
  // ────────────────────────────────────────────────────────────
  async createPlanCheckout(tenantId: string, userId: string, plan: PlanKey) {
    const ars = PLAN_PRICES_ARS[plan];
    if (!ars) throw new BadRequestException(`Plan "${plan}" inválido`);

    return this.createPreference(tenantId, userId, {
      title: `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} — MiAsesor`,
      ars,
      sku: `plan_${plan}`,
      kind: 'plan',
      target: plan,
    });
  }

  async createCreditCheckout(tenantId: string, userId: string, pack: CreditPackKey) {
    const config = CREDIT_PACKS[pack];
    if (!config) throw new BadRequestException('Pack de créditos inválido');

    return this.createPreference(tenantId, userId, {
      title: `${config.amount} créditos de análisis — MiAsesor`,
      ars: config.ars,
      sku: pack,
      kind: 'credits',
      target: pack,
    });
  }

  private async createPreference(
    tenantId: string,
    userId: string,
    item: { title: string; ars: number; sku: string; kind: 'plan' | 'credits'; target: string },
  ) {
    if (!this.mp) throw new BadRequestException('Pagos no configurados');

    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const backendUrl = this.config.get<string>('BACKEND_URL') || frontendUrl;
    const externalRef = `${item.kind}:${item.target}:${tenantId}:${Date.now()}`;

    try {
      const preference = new Preference(this.mp);
      const result = await preference.create({
        body: {
          items: [{
            id: item.sku,
            title: item.title,
            quantity: 1,
            unit_price: item.ars,
            currency_id: 'ARS',
            category_id: 'services',
          }],
          back_urls: {
            success: `${frontendUrl}/settings?tab=billing&success=true`,
            failure: `${frontendUrl}/settings?tab=billing&canceled=true`,
            pending: `${frontendUrl}/settings?tab=billing&pending=true`,
          },
          auto_return: 'approved',
          external_reference: externalRef,
          notification_url: `${backendUrl}/api/billing/webhook`,
          metadata: {
            tenant_id: tenantId,
            user_id: userId,
            kind: item.kind,
            target: item.target,
          },
          statement_descriptor: 'MIASESOR',
        },
      });

      return { url: result.init_point, sessionId: result.id };
    } catch (error: any) {
      this.logger.error(`MP preference falló: ${error?.message || error}`);
      throw new BadRequestException('No se pudo iniciar el pago — intentá nuevamente');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Webhook (MP IPN / Webhooks)
  // ────────────────────────────────────────────────────────────
  // MP envía POST con body { type, data: { id } } y headers
  //   x-signature: "ts=1234567890,v1=abc..."
  //   x-request-id: "uuid"
  // ────────────────────────────────────────────────────────────
  async handleWebhook(
    payload: any,
    signature: string | undefined,
    requestId: string | undefined,
  ) {
    if (!this.mp) throw new BadRequestException('MP no configurado');

    const eventType: string | undefined = payload?.type || payload?.action;
    const dataId: string | undefined = payload?.data?.id;

    if (!eventType || !dataId) {
      this.logger.warn(`MP webhook con payload inválido: ${JSON.stringify(payload).slice(0, 200)}`);
      return { received: true, ignored: true };
    }

    // Solo procesamos eventos de pagos
    if (!eventType.startsWith('payment')) {
      this.logger.log(`MP event ignorado — type: ${eventType}`);
      return { received: true, ignored: true };
    }

    // Validación de firma. En producción es obligatoria — sin firma
    // verificada, un atacante puede POSTear payments falsos y activar
    // planes a tenants arbitrarios.
    const webhookSecret = this.config.get<string>('MP_WEBHOOK_SECRET');
    const nodeEnv = this.config.get<string>('NODE_ENV');
    if (webhookSecret) {
      if (!signature || !this.verifyMpSignature(signature, requestId, dataId, webhookSecret)) {
        throw new BadRequestException('MP webhook signature inválida');
      }
    } else if (nodeEnv === 'production') {
      this.logger.error('MP_WEBHOOK_SECRET no configurado en producción — rechazando webhook');
      throw new BadRequestException('Webhook no autenticado');
    }

    // Idempotencia (la tabla se renombró a payment_webhook_events
    // en migration 006; mientras la migración no se aplique podemos
    // mantener compat-fallback al nombre viejo con un alias en SQL).
    const eventId = `mp_payment_${dataId}`;
    const { error: dedupError } = await this.supabase
      .from('payment_webhook_events')
      .insert({ event_id: eventId, event_type: eventType });

    if (dedupError) {
      if (dedupError.code === '23505') {
        this.logger.log(`MP event ${eventId} ya procesado — skip`);
        return { received: true, deduped: true };
      }
      this.logger.warn(`No se pudo registrar event en webhook_events: ${dedupError.message}`);
    }

    // Traer el detalle del pago desde MP
    let payment: any;
    try {
      const paymentClient = new Payment(this.mp);
      payment = await paymentClient.get({ id: dataId });
    } catch (error: any) {
      this.logger.error(`No pude traer payment ${dataId} de MP: ${error?.message || error}`);
      throw new BadRequestException('Error al consultar el pago en MP');
    }

    if (payment.status !== 'approved') {
      this.logger.log(`MP payment ${dataId} status=${payment.status} — sin acreditar`);
      return { received: true, status: payment.status };
    }

    const metadata = payment.metadata || {};
    const tenantId = metadata.tenant_id;
    const userId = metadata.user_id;
    const kind = metadata.kind as 'plan' | 'credits' | undefined;
    const target = metadata.target;

    if (!tenantId || !kind || !target) {
      this.logger.warn(`MP payment ${dataId} sin metadata válida — ${JSON.stringify(metadata)}`);
      return { received: true, ignored: true };
    }

    try {
      if (kind === 'credits') {
        await this.processCreditPurchase(String(payment.id), tenantId, userId, target as CreditPackKey);
      } else if (kind === 'plan') {
        await this.processPlanPurchase(String(payment.id), tenantId, userId, target as PlanKey);
      }
    } catch (error: any) {
      this.logger.error(`Error procesando payment ${dataId} (${kind}/${target}): ${error?.message}`);
      throw error;
    }

    return { received: true };
  }

  private verifyMpSignature(
    signature: string,
    requestId: string | undefined,
    dataId: string,
    secret: string,
  ): boolean {
    // MP signature format: "ts=1700000000,v1=hexHmac"
    const parts: Record<string, string> = {};
    for (const segment of signature.split(',')) {
      const [k, v] = segment.split('=').map((s) => s.trim());
      if (k && v) parts[k] = v;
    }
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return false;

    const manifest = `id:${dataId};request-id:${requestId || ''};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    // timingSafeEqual evita ataques de timing
    const a = Buffer.from(hmac, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  private async processCreditPurchase(
    paymentId: string,
    tenantId: string,
    userId: string | undefined,
    pack: CreditPackKey,
  ) {
    const packConfig = CREDIT_PACKS[pack];
    if (!packConfig) {
      this.logger.error(`Pack ${pack} no existe`);
      return;
    }

    // Idempotencia: si ya hay ledger entry con este reference_id, no duplicar
    const { data: existing } = await this.supabase
      .from('credit_ledger')
      .select('id')
      .eq('reference_id', paymentId)
      .eq('type', 'purchase')
      .maybeSingle();

    if (existing) {
      this.logger.log(`Credit purchase ya registrado — payment ${paymentId}`);
      return;
    }

    const { error } = await this.supabase.rpc('add_credits', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_amount: packConfig.amount,
      p_type: 'purchase',
      p_description: `Compra ${packConfig.amount} créditos (${pack})`,
      p_reference_id: paymentId,
    });

    if (error) {
      if (error.code === '23505') {
        this.logger.log(`Credits ya añadidos por otra request — payment ${paymentId}`);
        return;
      }
      throw new Error(`add_credits falló: ${error.message}`);
    }

    this.logger.log(`Créditos añadidos: ${packConfig.amount} a tenant ${tenantId} (payment ${paymentId})`);
  }

  private async processPlanPurchase(
    paymentId: string,
    tenantId: string,
    userId: string | undefined,
    plan: PlanKey,
  ) {
    const limits = PLAN_LIMITS[plan];
    if (!limits) {
      this.logger.error(`Plan ${plan} no existe`);
      return;
    }

    // 30 días desde hoy
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { error } = await this.supabase
      .from('tenants')
      .update({
        plan,
        subscription_status: 'active',
        subscription_period_end: periodEnd.toISOString(),
        ...limits,
      })
      .eq('id', tenantId);

    if (error) {
      throw new Error(`Update plan falló: ${error.message}`);
    }

    await this.notifications.createAlert({
      tenantId,
      type: 'subscription_active',
      priority: 'low',
      title: `Plan ${plan} activado`,
      message: `Tu plan ${plan} está activo hasta el ${periodEnd.toLocaleDateString('es-AR')}.`,
      metadata: { paymentId, userId, plan },
      dedupKey: `plan_active_${paymentId}`,
    });

    this.logger.log(`Plan ${plan} activado para tenant ${tenantId} hasta ${periodEnd.toISOString()}`);
  }
}
