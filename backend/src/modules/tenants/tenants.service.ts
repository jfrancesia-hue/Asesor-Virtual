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
    const { data, error } = await this.supabase
      .from('tenants')
      .update(updates)
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
    const [tenant, stats] = await Promise.all([
      this.findOne(tenantId),
      this.getDashboardStats(tenantId),
    ]);
    return {
      plan: tenant.plan,
      limits: {
        users: { used: 0, max: tenant.max_users },
        contractsPerMonth: { used: stats.contracts_this_month, max: tenant.max_contracts_per_month },
        aiQueriesPerMonth: { used: stats.ai_queries_this_month, max: tenant.max_ai_queries_per_month },
        analysisCredits: { balance: stats.credit_balance },
      },
    };
  }
}
