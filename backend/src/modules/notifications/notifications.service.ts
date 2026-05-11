import { Injectable, Inject, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { emailTemplates } from './email-templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend?: Resend;
  private readonly fromEmail: string;

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {
    const resendApiKey = config.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    } else {
      this.logger.warn('RESEND_API_KEY no configurada; emails deshabilitados.');
    }
    this.fromEmail = config.get('RESEND_FROM', '"MiAsesor" <no-reply@miasesor.com.ar>');
  }

  async getAlerts(tenantId: string, userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { data, count } = await this.supabase
      .from('alerts')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { alerts: data || [], total: count || 0, page, limit };
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .is('read_at', null);

    return count || 0;
  }

  async markRead(alertId: string, tenantId: string) {
    await this.supabase
      .from('alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('tenant_id', tenantId);

    return { marked: true };
  }

  async markAllRead(tenantId: string, userId: string) {
    await this.supabase
      .from('alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .is('read_at', null);

    return { marked: true };
  }

  async createAlert(params: {
    tenantId: string;
    userId?: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    metadata?: object;
    dedupKey?: string;
  }) {
    const { error } = await this.supabase.from('alerts').insert({
      tenant_id: params.tenantId,
      user_id: params.userId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {},
      dedup_key: params.dedupKey,
    });

    if (error && !error.message.includes('duplicate')) {
      this.logger.warn('Failed to create alert', error.message);
    }
  }

  async sendEmail(to: string, subject: string, html: string, retries = 2): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(`Email omitido porque Resend no está configurado — subject: "${subject}"`);
      return false;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.resend.emails.send({ from: this.fromEmail, to, subject, html });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Email send failed (attempt ${attempt}/${retries}): ${message}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
    this.logger.error(`Email to ${to} failed after ${retries} attempts — subject: "${subject}"`);
    return false;
  }

  // Daily at 9am: check contracts expiring in 30, 15, 7 days
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringContracts() {
    const thresholds = [30, 15, 7];
    const pageSize = 100;

    for (const days of thresholds) {
      // Ventana: contratos cuyo expires_at cae en el día exacto que será
      // dentro de `days` días desde ahora (00:00:00 a 23:59:59 de ese día).
      // Antes la ventana era [futureDate - 1d, futureDate], lo que tenía
      // dos bugs: (a) duplicaba el alcance entre días si había overlap
      // y (b) si el cron fallaba un día, contratos que cayeron en esa
      // ventana de 24h nunca recibían alerta.
      const startOfDay = new Date();
      startOfDay.setDate(startOfDay.getDate() + days);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: contracts, error } = await this.supabase
          .from('contracts')
          .select('id, title, tenant_id, user_id, expires_at, users!inner(email, full_name)')
          .eq('status', 'active')
          .gte('expires_at', startOfDay.toISOString())
          .lte('expires_at', endOfDay.toISOString())
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !contracts || contracts.length === 0) {
          hasMore = false;
          break;
        }

        for (const contract of contracts) {
          const dedupKey = `contract_expiring_${contract.id}_${days}d`;

          await this.createAlert({
            tenantId: contract.tenant_id,
            userId: contract.user_id,
            type: 'contract_expiring',
            priority: days <= 7 ? 'high' : 'medium',
            title: `Contrato por vencer en ${days} días`,
            message: `"${contract.title}" vence en ${days} días`,
            metadata: { contractId: contract.id, daysLeft: days },
            dedupKey,
          });

          // Send email notification
          const user = contract.users as any;
          if (user?.email) {
            const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
            const template = emailTemplates.contractExpiring(
              user.full_name || 'Usuario',
              contract.title,
              days,
              `${frontendUrl}/contracts/${contract.id}`,
            );
            this.sendEmail(user.email, template.subject, template.html).catch(() => {});
          }
        }

        hasMore = contracts.length === pageSize;
        page++;
      }
    }
  }

  // Daily at 9:15am: planes que vencen pronto + planes ya vencidos
  // - Aviso 7 días antes (énfasis medio)
  // - Aviso 1 día antes (énfasis alto)
  // - Aviso día del vencimiento (énfasis alto + downgrade automático a free)
  @Cron('15 9 * * *')
  async checkPlanExpirations() {
    const frontendUrl = this.config.get('FRONTEND_URL', 'https://www.miasesor.com.ar');
    const renewUrl = `${frontendUrl.replace(/\/+$/, '')}/settings?tab=billing`;

    // 1) Vencen en 7 días — alerta media + email aviso
    await this.notifyPlanExpiring(7, renewUrl, 'medium');
    // 2) Vencen en 1 día — alerta alta + email urgente
    await this.notifyPlanExpiring(1, renewUrl, 'high');
    // 3) Ya vencidos — downgrade + email "expiró"
    await this.downgradeExpiredPlans(renewUrl);
  }

  private async notifyPlanExpiring(daysAhead: number, renewUrl: string, priority: 'medium' | 'high') {
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() + daysAhead);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: tenants, error } = await this.supabase
      .from('tenants')
      .select('id, name, plan, subscription_period_end, users!inner(email, full_name, role)')
      .neq('plan', 'free')
      .eq('subscription_status', 'active')
      .gte('subscription_period_end', startOfDay.toISOString())
      .lte('subscription_period_end', endOfDay.toISOString())
      .eq('users.role', 'owner');

    if (error || !tenants?.length) return;

    for (const tenant of tenants as any[]) {
      const owner = Array.isArray(tenant.users) ? tenant.users[0] : tenant.users;
      const dedupKey = `plan_expiring_${tenant.id}_${daysAhead}d_${new Date().toISOString().split('T')[0].slice(0, 7)}`;

      await this.createAlert({
        tenantId: tenant.id,
        type: 'plan_expiring',
        priority,
        title: daysAhead === 1
          ? `Tu plan ${tenant.plan} vence mañana`
          : `Tu plan ${tenant.plan} vence en ${daysAhead} días`,
        message: `Renová ahora para no perder acceso. Si no renovás, tu cuenta pasa a Gratis automáticamente.`,
        metadata: { plan: tenant.plan, daysLeft: daysAhead, periodEnd: tenant.subscription_period_end },
        dedupKey,
      });

      if (owner?.email) {
        const template = emailTemplates.planExpiringSoon(
          owner.full_name || 'Usuario',
          tenant.plan,
          daysAhead,
          renewUrl,
        );
        this.sendEmail(owner.email, template.subject, template.html).catch(() => {});
      }
    }
  }

  private async downgradeExpiredPlans(renewUrl: string) {
    // Tenants pagos cuya fecha de fin ya pasó.
    const { data: tenants, error } = await this.supabase
      .from('tenants')
      .select('id, name, plan, subscription_period_end, users!inner(email, full_name, role)')
      .neq('plan', 'free')
      .eq('subscription_status', 'active')
      .lt('subscription_period_end', new Date().toISOString())
      .eq('users.role', 'owner');

    if (error || !tenants?.length) return;

    for (const tenant of tenants as any[]) {
      const previousPlan = tenant.plan;
      const owner = Array.isArray(tenant.users) ? tenant.users[0] : tenant.users;

      const { error: updateErr } = await this.supabase
        .from('tenants')
        .update({
          plan: 'free',
          subscription_status: 'free',
          subscription_period_end: null,
          max_users: 1,
          max_contracts_per_month: 1,
          max_ai_queries_per_month: 2,
          max_analysis_credits: 1,
        })
        .eq('id', tenant.id);

      if (updateErr) {
        this.logger.error(`No pude downgrade tenant ${tenant.id}: ${updateErr.message}`);
        continue;
      }

      const dedupKey = `plan_expired_${tenant.id}_${new Date().toISOString().split('T')[0]}`;
      await this.createAlert({
        tenantId: tenant.id,
        type: 'plan_expired',
        priority: 'high',
        title: `Tu plan ${previousPlan} expiró`,
        message: `Tu cuenta pasó a plan Gratis. Renová ${previousPlan} cuando quieras desde Billing.`,
        metadata: { previousPlan },
        dedupKey,
      });

      if (owner?.email) {
        const template = emailTemplates.planExpired(
          owner.full_name || 'Usuario',
          previousPlan,
          renewUrl,
        );
        this.sendEmail(owner.email, template.subject, template.html).catch(() => {});
      }

      this.logger.log(`Plan ${previousPlan} de tenant ${tenant.id} expiró → downgraded a free`);
    }
  }

  // Daily at 8:30am: check compliance overdue
  @Cron('30 8 * * *')
  async checkComplianceOverdue() {
    const pageSize = 100;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: items } = await this.supabase
        .from('compliance_items')
        .select('id, title, tenant_id, user_id, due_date, users!inner(email, full_name)')
        .eq('status', 'overdue')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (!items || items.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of items) {
        const today = new Date().toISOString().split('T')[0];
        const dedupKey = `compliance_overdue_${item.id}_${today}`;

        await this.createAlert({
          tenantId: item.tenant_id,
          userId: item.user_id,
          type: 'compliance_overdue',
          priority: 'high',
          title: 'Obligación vencida',
          message: `"${item.title}" está vencida`,
          metadata: { itemId: item.id },
          dedupKey,
        });

        // Send email notification
        const user = (item as any).users;
        if (user?.email) {
          const dueDate = new Date(item.due_date).toLocaleDateString('es-AR');
          const template = emailTemplates.complianceOverdue(
            user.full_name || 'Usuario',
            item.title,
            dueDate,
          );
          this.sendEmail(user.email, template.subject, template.html).catch(() => {});
        }
      }

      hasMore = items.length === pageSize;
      page++;
    }
  }
}
