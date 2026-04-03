import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';

@Injectable()
export class AnalysisService {
  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  async listAssessments(tenantId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { data, count, error } = await this.supabase
      .from('risk_assessments')
      .select('id, overall_risk, risk_score, summary, document_title, credits_used, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException('Error al obtener análisis');

    return {
      assessments: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getAssessment(id: string, tenantId: string) {
    const { data: assessment, error } = await this.supabase
      .from('risk_assessments')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !assessment) throw new NotFoundException('Análisis no encontrado');

    const { data: findings } = await this.supabase
      .from('risk_findings')
      .select('*')
      .eq('assessment_id', id)
      .order('sort_order');

    return { ...assessment, findings: findings || [] };
  }

  async getOverview(tenantId: string) {
    const { data: assessments } = await this.supabase
      .from('risk_assessments')
      .select('overall_risk, risk_score, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalScore = 0;

    for (const a of assessments || []) {
      riskDistribution[a.overall_risk]++;
      totalScore += a.risk_score;
    }

    const total = (assessments || []).length;
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

    return { total, avgScore, riskDistribution };
  }
}
