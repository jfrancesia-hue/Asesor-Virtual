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
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(config.get('RESEND_API_KEY') || 'missing-resend-key');
    this.fromEmail = config.get('RESEND_FROM', 'noreply@tuasesor.app');
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
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.resend.emails.send({ from: this.fromEmail, to, subject, html });
        return true;
      } catch (error) {
        this.logger.warn(`Email send failed (attempt ${attempt}/${retries}): ${error.message}`);
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
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const pastDate = new Date(futureDate);
      pastDate.setDate(pastDate.getDate() - 1);

      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: contracts, error } = await this.supabase
          .from('contracts')
          .select('id, title, tenant_id, user_id, expires_at, users!inner(email, full_name)')
          .eq('status', 'active')
          .gte('expires_at', pastDate.toISOString())
          .lte('expires_at', futureDate.toISOString())
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
