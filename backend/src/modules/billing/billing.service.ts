import {
  Injectable, Inject, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { NotificationsService } from '../notifications/notifications.service';

const PLAN_LIMITS = {
  start: { max_users: 1, max_contracts_per_month: 5, max_ai_queries_per_month: 20, max_analysis_credits: 2 },
  pro: { max_users: 5, max_contracts_per_month: 25, max_ai_queries_per_month: 100, max_analysis_credits: 10 },
  enterprise: { max_users: 99999, max_contracts_per_month: 99999, max_ai_queries_per_month: 99999, max_analysis_credits: 30 },
};

const CREDIT_PACKS = {
  credits_10: { amount: 10, usd: 15 },
  credits_30: { amount: 30, usd: 35 },
  credits_100: { amount: 100, usd: 99 },
};

type CreditPackKey = keyof typeof CREDIT_PACKS;
type PlanKey = keyof typeof PLAN_LIMITS;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null = null;

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    const stripeKey = config.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
    } else {
      this.logger.warn('Stripe not configured — billing features disabled');
    }
  }

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

  async createCheckoutSession(tenantId: string, userId: string, priceId: string, mode: 'subscription' | 'payment') {
    if (!this.stripe) throw new BadRequestException('Pagos no configurados');

    const tenant = await this.getOrCreateStripeCustomer(tenantId);

    const session = await this.stripe.checkout.sessions.create({
      customer: tenant.stripe_customer_id,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('FRONTEND_URL')}/settings?tab=billing&success=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/settings?tab=billing&canceled=true`,
      metadata: { tenantId, userId },
      ...(mode === 'subscription' && {
        subscription_data: { metadata: { tenantId } },
      }),
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPlanCheckout(tenantId: string, userId: string, plan: PlanKey) {
    const priceId = this.config.get(`STRIPE_PRICE_${plan.toUpperCase()}`);
    if (!priceId) throw new BadRequestException(`Plan "${plan}" no configurado en Stripe`);
    return this.createCheckoutSession(tenantId, userId, priceId, 'subscription');
  }

  async createCreditCheckout(tenantId: string, userId: string, pack: CreditPackKey) {
    const packConfig = CREDIT_PACKS[pack];
    if (!packConfig) throw new BadRequestException('Pack de créditos inválido');

    const priceId = this.config.get(`STRIPE_PRICE_${pack.toUpperCase()}`);
    if (!priceId) throw new BadRequestException('Pack no configurado');

    return this.createCheckoutSession(tenantId, userId, priceId, 'payment');
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) throw new BadRequestException('Stripe no configurado');

    const webhookSecret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new BadRequestException('Webhook signature inválida');
    }

    // Idempotencia: si ya procesamos este event.id, saltearlo
    const { error: dedupError } = await this.supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type });

    if (dedupError) {
      // Postgres unique violation → ya procesado
      if (dedupError.code === '23505') {
        this.logger.log(`Stripe event ${event.id} (${event.type}) ya procesado — skip`);
        return { received: true, deduped: true };
      }
      // Otro error: lo logueamos pero seguimos (mejor procesar dos veces que perder un evento)
      this.logger.warn(`No se pudo registrar event.id en stripe_webhook_events: ${dedupError.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_succeeded':
          this.logger.log(`Pago exitoso — invoice ${(event.data.object as Stripe.Invoice).id}`);
          break;

        default:
          this.logger.log(`Stripe event no manejado: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando ${event.type} (${event.id}): ${error.message}`);
      throw error;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { tenantId, userId } = session.metadata || {};
    if (!tenantId) {
      this.logger.warn(`checkout.session.completed sin tenantId — session ${session.id}`);
      return;
    }

    if (session.mode === 'payment') {
      await this.processCreditPackPurchase(session, tenantId, userId);
    } else if (session.mode === 'subscription') {
      await this.processSubscriptionCheckout(session, tenantId);
    }
  }

  private async processCreditPackPurchase(
    session: Stripe.Checkout.Session,
    tenantId: string,
    userId?: string,
  ) {
    if (!this.stripe) return;

    // Idempotencia explícita: si ya hay ledger entry con este reference_id, no duplicar
    const { data: existing } = await this.supabase
      .from('credit_ledger')
      .select('id')
      .eq('reference_id', session.id)
      .eq('type', 'purchase')
      .maybeSingle();

    if (existing) {
      this.logger.log(`Credit purchase ya registrado — session ${session.id}`);
      return;
    }

    // Determinar pack desde el line item, NO desde amount_total
    const lineItems = await this.stripe.checkout.sessions.listLineItems(session.id, {
      limit: 1,
      expand: ['data.price'],
    });
    const priceId = lineItems.data[0]?.price?.id;

    if (!priceId) {
      this.logger.error(`No se pudo determinar price del pack — session ${session.id}`);
      return;
    }

    const pack = this.getCreditPackFromPriceId(priceId);
    if (!pack) {
      this.logger.error(
        `Price ${priceId} no mapea a ningún CREDIT_PACK — session ${session.id}. Revisar STRIPE_PRICE_CREDITS_*`,
      );
      return;
    }

    const credits = CREDIT_PACKS[pack].amount;

    const { error } = await this.supabase.rpc('add_credits', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_amount: credits,
      p_type: 'purchase',
      p_description: `Compra ${credits} créditos (${pack})`,
      p_reference_id: session.id,
    });

    if (error) {
      // Unique violation por el partial index → ya procesado en paralelo
      if (error.code === '23505') {
        this.logger.log(`Credits ya añadidos por otra request — session ${session.id}`);
        return;
      }
      throw new Error(`add_credits falló: ${error.message}`);
    }

    this.logger.log(`Créditos añadidos: ${credits} a tenant ${tenantId} (session ${session.id})`);
  }

  private async processSubscriptionCheckout(session: Stripe.Checkout.Session, tenantId: string) {
    if (!this.stripe) return;
    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
    await this.applySubscriptionState(tenantId, subscription);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const tenantId = await this.resolveTenantIdFromSubscription(subscription);
    if (!tenantId) return;

    await this.applySubscriptionState(tenantId, subscription);

    // Si pasa a past_due/unpaid, alertar al tenant
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      await this.notifyPaymentIssue(tenantId, subscription.status);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const tenantId = await this.resolveTenantIdFromSubscription(subscription);
    if (!tenantId) return;

    // Downgrade explícito a 'start' y limpieza de IDs Stripe
    const limits = PLAN_LIMITS.start;
    await this.supabase
      .from('tenants')
      .update({
        plan: 'start',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        stripe_price_id: null,
        subscription_period_end: null,
        ...limits,
      })
      .eq('id', tenantId);

    await this.notifications.createAlert({
      tenantId,
      type: 'subscription_canceled',
      priority: 'high',
      title: 'Suscripción cancelada',
      message: 'Tu suscripción terminó. Volviste al plan Start. Renovala desde Configuración → Facturación.',
      dedupKey: `sub_canceled_${subscription.id}`,
    });

    this.logger.log(`Subscription cancelada para tenant ${tenantId} → downgrade a start`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id, name')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (!tenant) {
      this.logger.warn(`payment_failed sin tenant match — subscription ${subscriptionId}`);
      return;
    }

    await this.supabase
      .from('tenants')
      .update({ subscription_status: 'past_due' })
      .eq('id', tenant.id);

    await this.notifications.createAlert({
      tenantId: tenant.id,
      type: 'payment_failed',
      priority: 'high',
      title: 'Pago rechazado',
      message: `No pudimos procesar tu pago${invoice.attempt_count ? ` (intento ${invoice.attempt_count})` : ''}. Actualizá tu método de pago para no perder acceso.`,
      metadata: { invoiceId: invoice.id, subscriptionId },
      dedupKey: `payment_failed_${invoice.id}`,
    });

    this.logger.warn(
      `Payment failed — tenant ${tenant.id}, invoice ${invoice.id}, attempt ${invoice.attempt_count}`,
    );
  }

  private async applySubscriptionState(tenantId: string, subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0]?.price.id;
    const plan = priceId ? this.getPlanFromPriceId(priceId) : null;

    const update: Record<string, unknown> = {
      subscription_status: subscription.status,
      subscription_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId ?? null,
    };

    if (plan) {
      update.plan = plan;
      Object.assign(update, PLAN_LIMITS[plan]);
    }

    await this.supabase.from('tenants').update(update).eq('id', tenantId);
  }

  private async resolveTenantIdFromSubscription(
    subscription: Stripe.Subscription,
  ): Promise<string | null> {
    const fromMetadata = subscription.metadata?.tenantId;
    if (fromMetadata) return fromMetadata;

    // Fallback: lookup por stripe_subscription_id (cubre caso de subscriptions creadas sin metadata)
    const { data } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    return data?.id ?? null;
  }

  private async notifyPaymentIssue(tenantId: string, status: string) {
    await this.notifications.createAlert({
      tenantId,
      type: 'subscription_past_due',
      priority: 'high',
      title: 'Suscripción con problemas de pago',
      message: `Tu suscripción está en estado "${status}". Actualizá el método de pago o tu acceso será limitado.`,
      dedupKey: `sub_past_due_${tenantId}_${status}`,
    });
  }

  private async getOrCreateStripeCustomer(tenantId: string) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id, name, stripe_customer_id')
      .eq('id', tenantId)
      .single();

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    if (tenant.stripe_customer_id) return tenant;

    if (!this.stripe) throw new BadRequestException('Pagos no configurados');
    const customer = await this.stripe.customers.create({
      name: tenant.name,
      metadata: { tenantId },
    });

    await this.supabase
      .from('tenants')
      .update({ stripe_customer_id: customer.id })
      .eq('id', tenantId);

    return { ...tenant, stripe_customer_id: customer.id };
  }

  private getPlanFromPriceId(priceId: string): PlanKey | null {
    if (priceId === this.config.get('STRIPE_PRICE_START')) return 'start';
    if (priceId === this.config.get('STRIPE_PRICE_PRO')) return 'pro';
    if (priceId === this.config.get('STRIPE_PRICE_ENTERPRISE')) return 'enterprise';
    return null;
  }

  private getCreditPackFromPriceId(priceId: string): CreditPackKey | null {
    if (priceId === this.config.get('STRIPE_PRICE_CREDITS_10')) return 'credits_10';
    if (priceId === this.config.get('STRIPE_PRICE_CREDITS_30')) return 'credits_30';
    if (priceId === this.config.get('STRIPE_PRICE_CREDITS_100')) return 'credits_100';
    return null;
  }
}
