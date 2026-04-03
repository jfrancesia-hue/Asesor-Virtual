import {
  Injectable, Inject, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { SUPABASE_ADMIN } from '../../config/supabase.module';

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

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null = null;

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {
    // Conditional Stripe initialization
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

  async createCreditCheckout(tenantId: string, userId: string, pack: 'credits_10' | 'credits_30' | 'credits_100') {
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

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { tenantId, userId } = session.metadata || {};
    if (!tenantId) return;

    if (session.mode === 'payment') {
      // Credit pack purchase: determine pack from amount
      const amount = session.amount_total || 0;
      let credits = 0;
      if (amount <= 1500) credits = 10;
      else if (amount <= 3500) credits = 30;
      else credits = 100;

      await this.supabase.rpc('add_credits', {
        p_tenant_id: tenantId,
        p_user_id: userId,
        p_amount: credits,
        p_type: 'purchase',
        p_description: `Compra ${credits} créditos`,
        p_reference_id: session.id,
      });
    } else if (session.mode === 'subscription') {
      // Update subscription info
      const subscription = await this.stripe!.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = this.getPlanFromPriceId(priceId);

      if (plan) {
        const limits = PLAN_LIMITS[plan];
        await this.supabase
          .from('tenants')
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            subscription_status: subscription.status,
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            ...limits,
          })
          .eq('id', tenantId);
      }
    }
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    const priceId = subscription.items.data[0]?.price.id;
    const plan = this.getPlanFromPriceId(priceId) || 'start';
    const limits = PLAN_LIMITS[plan];

    await this.supabase
      .from('tenants')
      .update({
        plan,
        subscription_status: subscription.status,
        subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        ...limits,
      })
      .eq('id', tenantId);
  }

  private async getOrCreateStripeCustomer(tenantId: string) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id, name, stripe_customer_id')
      .eq('id', tenantId)
      .single();

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    if (tenant.stripe_customer_id) return tenant;

    const customer = await this.stripe!.customers.create({
      name: tenant.name,
      metadata: { tenantId },
    });

    await this.supabase
      .from('tenants')
      .update({ stripe_customer_id: customer.id })
      .eq('id', tenantId);

    return { ...tenant, stripe_customer_id: customer.id };
  }

  private getPlanFromPriceId(priceId: string): 'start' | 'pro' | 'enterprise' | null {
    if (priceId === this.config.get('STRIPE_PRICE_START')) return 'start';
    if (priceId === this.config.get('STRIPE_PRICE_PRO')) return 'pro';
    if (priceId === this.config.get('STRIPE_PRICE_ENTERPRISE')) return 'enterprise';
    return null;
  }
}
