import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';

@Injectable()
export class TenantsService {
  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  async findOne(tenantId: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    if (error || !data) throw new NotFoundException('Tenant no encontrado');
    return data;
  }

  async update(tenantId: string, updates: { name?: string; country?: string; settings?: object }) {
    // Defensa en profundidad: aunque el DTO no exponga estos campos, filtramos
    // explícitamente para que ningún path pueda escalarlos via este endpoint.
    // Plan/limits/billing sólo se cambian desde billing.service tras pago MP.
    const SAFE_FIELDS = new Set(['name', 'country', 'settings']);
    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (SAFE_FIELDS.has(key)) safeUpdates[key] = value;
    }

    if (Object.keys(safeUpdates).length === 0) {
      throw new BadRequestException('No hay campos válidos para actualizar');
    }

    const { data, error } = await this.supabase
      .from('tenants')
      .update(safeUpdates)
      .eq('id', tenantId)
      .select()
      .single();
    if (error) throw new BadRequestException('Error al actualizar organización');
    return data;
  }

  async getDashboardStats(tenantId: string) {
    const { data, error } = await this.supabase.rpc('get_dashboard_stats', {
      p_tenant_id: tenantId,
    });
    if (error) throw new BadRequestException('Error al obtener estadísticas');
    return data;
  }

  async getUsage(tenantId: string) {
    const tenant = await this.findOne(tenantId);
    const isFree = tenant.plan === 'free';

    // Para free, los contadores son acumulados (no resetean mensualmente).
    // Para pago, contamos los del mes actual.
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let contractsQuery = this.supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    let queriesQuery = this.supabase
      .from('conversation_messages')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'user');

    if (!isFree) {
      contractsQuery = contractsQuery.gte('created_at', monthStart.toISOString());
      queriesQuery = queriesQuery.gte('created_at', monthStart.toISOString());
    }

    const [contractsRes, queriesRes, walletRes] = await Promise.all([
      contractsQuery,
      queriesQuery,
      this.supabase.from('credit_wallets').select('balance').eq('tenant_id', tenantId).single(),
    ]);

    const contractsUsed = contractsRes.count || 0;
    const queriesUsed = queriesRes.count || 0;
    const creditBalance = walletRes.data?.balance ?? 0;

    return {
      plan: tenant.plan,
      resetMode: isFree ? 'lifetime' : 'monthly',
      limits: {
        users: { used: 0, max: tenant.max_users },
        contractsPerMonth: { used: contractsUsed, max: tenant.max_contracts_per_month },
        aiQueriesPerMonth: { used: queriesUsed, max: tenant.max_ai_queries_per_month },
        analysisCredits: { balance: creditBalance },
      },
      planStatus: await this.computePlanStatus(tenant, contractsUsed, queriesUsed, creditBalance),
    };
  }

  private async computePlanStatus(
    tenant: { id: string; plan: string; subscription_period_end: string | null; max_contracts_per_month: number; max_ai_queries_per_month: number },
    contractsUsed: number,
    queriesUsed: number,
    creditBalance: number,
  ) {
    const now = new Date();
    const isFree = tenant.plan === 'free';

    if (!isFree && tenant.subscription_period_end) {
      const end = new Date(tenant.subscription_period_end);
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / msPerDay);
      const periodEnd = end.toISOString();

      if (diffDays === 1) {
        return { state: 'expiring_tomorrow', plan: tenant.plan, periodEnd, daysUntilExpiry: 1 } as const;
      }
      if (diffDays === 0) {
        return { state: 'expiring_today', plan: tenant.plan, periodEnd, daysUntilExpiry: 0 } as const;
      }
      // El cron baja a free los expirados; si llegamos acá con diff < 0, está
      // por procesarse. Lo tratamos como 'expiring_today' para no dejar al
      // usuario sin info entre las 00:00 del día siguiente y las 9:15am.
      if (diffDays < 0) {
        return { state: 'expiring_today', plan: tenant.plan, periodEnd, daysUntilExpiry: 0 } as const;
      }
      return { state: 'active_paid', plan: tenant.plan, periodEnd, daysUntilExpiry: diffDays } as const;
    }

    if (isFree) {
      // ¿Acabamos de bajar a free? Buscamos la alerta plan_expired más reciente.
      const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const { data: lastExpiry } = await this.supabase
        .from('alerts')
        .select('created_at, metadata')
        .eq('tenant_id', tenant.id)
        .eq('type', 'plan_expired')
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastExpiry) {
        const expiredAgoHours = (now.getTime() - new Date(lastExpiry.created_at).getTime()) / (1000 * 60 * 60);
        const previousPlan = (lastExpiry.metadata as any)?.previousPlan || 'pago';
        if (expiredAgoHours < 24) {
          return { state: 'expired_today', plan: 'free', previousPlan, expiredAt: lastExpiry.created_at } as const;
        }
        return { state: 'expired_yesterday', plan: 'free', previousPlan, expiredAt: lastExpiry.created_at } as const;
      }

      const noContracts = contractsUsed >= tenant.max_contracts_per_month;
      const noQueries = queriesUsed >= tenant.max_ai_queries_per_month;
      const noCredits = creditBalance <= 0;

      if (noContracts && noQueries && noCredits) {
        return { state: 'free_exhausted', plan: 'free', exhaustedOf: ['contracts', 'queries', 'credits'] } as const;
      }
      if (noContracts || noQueries || noCredits) {
        const exhaustedOf: string[] = [];
        if (noContracts) exhaustedOf.push('contracts');
        if (noQueries) exhaustedOf.push('queries');
        if (noCredits) exhaustedOf.push('credits');
        return { state: 'free_partial_exhausted', plan: 'free', exhaustedOf } as const;
      }

      return { state: 'active_free', plan: 'free' } as const;
    }

    return { state: 'active_paid', plan: tenant.plan, periodEnd: null, daysUntilExpiry: null } as const;
  }
}
