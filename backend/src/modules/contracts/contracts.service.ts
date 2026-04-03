import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { PdfService } from './pdf.service';
import { CreateContractDto, UpdateContractDto, ContractFilterDto } from './contracts.dto';

const ALLOWED_SORT_COLUMNS = ['title', 'type', 'status', 'created_at', 'updated_at', 'expires_at', 'risk_score'];

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly pdfService: PdfService,
  ) {}

  async create(dto: CreateContractDto, userId: string, tenantId: string) {
    // Check monthly limit
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('plan, max_contracts_per_month')
      .eq('id', tenantId)
      .single();

    if (tenant?.max_contracts_per_month !== 99999) {
      const { count } = await this.supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if ((count || 0) >= (tenant?.max_contracts_per_month || 5)) {
        throw new ForbiddenException('Alcanzaste el límite de contratos del mes. Actualizá tu plan.');
      }
    }

    // Sanitize HTML (strip script tags)
    const sanitizedHtml = dto.contentHtml
      ? dto.contentHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      : null;

    const { data, error } = await this.supabase
      .from('contracts')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        title: dto.title,
        type: dto.type,
        status: 'draft',
        jurisdiction: dto.jurisdiction || 'argentina',
        parties: dto.parties || [],
        content_html: sanitizedHtml,
        content_plain: dto.contentPlain,
        metadata: dto.metadata || {},
        expires_at: dto.expiresAt,
      })
      .select()
      .single();

    if (error) throw new BadRequestException('Error al crear contrato: ' + error.message);

    // Audit log (fire-and-forget)
    this.supabase
      .from('audit_logs')
      .insert({ tenant_id: tenantId, user_id: userId, action: 'contract.create', resource_type: 'contract', resource_id: data.id })
      .then(() => {}, () => {});

    return data;
  }

  async findAll(tenantId: string, filters: ContractFilterDto) {
    const { type, status, search, page = 1, limit = 20, sortBy = 'updated_at', sortOrder = 'desc' } = filters;
    const offset = (page - 1) * limit;

    // Whitelist sort column to prevent injection
    const safeSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'updated_at';
    const safeSortOrder = sortOrder === 'asc' ? true : false; // ascending = true

    let query = this.supabase
      .from('contracts')
      .select('id, title, type, status, jurisdiction, parties, risk_score, version, expires_at, created_at, updated_at', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);

    query = query
      .order(safeSortBy, { ascending: safeSortOrder })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new BadRequestException('Error al obtener contratos');

    return {
      contracts: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async findOne(id: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) throw new NotFoundException('Contrato no encontrado');
    return data;
  }

  async update(id: string, dto: UpdateContractDto, userId: string, tenantId: string) {
    // Verify ownership
    await this.findOne(id, tenantId);

    // Sanitize HTML
    const sanitizedHtml = dto.contentHtml
      ? dto.contentHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      : undefined;

    const updateData: any = {
      ...(dto.title && { title: dto.title }),
      ...(dto.status && { status: dto.status }),
      ...(dto.parties !== undefined && { parties: dto.parties }),
      ...(sanitizedHtml !== undefined && { content_html: sanitizedHtml }),
      ...(dto.contentPlain !== undefined && { content_plain: dto.contentPlain }),
      ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      ...(dto.riskScore !== undefined && { risk_score: dto.riskScore }),
      ...(dto.expiresAt !== undefined && { expires_at: dto.expiresAt }),
      user_id: userId, // for version_contract trigger
    };

    const { data, error } = await this.supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException('Error al actualizar contrato');

    // Audit log (fire-and-forget)
    this.supabase
      .from('audit_logs')
      .insert({ tenant_id: tenantId, user_id: userId, action: 'contract.update', resource_type: 'contract', resource_id: id })
      .then(() => {}, () => {});

    return data;
  }

  async remove(id: string, userId: string, tenantId: string) {
    await this.findOne(id, tenantId);

    const { error } = await this.supabase
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException('Error al eliminar contrato');

    this.supabase
      .from('audit_logs')
      .insert({ tenant_id: tenantId, user_id: userId, action: 'contract.delete', resource_type: 'contract', resource_id: id })
      .then(() => {}, () => {});

    return { deleted: true };
  }

  async getVersions(contractId: string, tenantId: string) {
    await this.findOne(contractId, tenantId);

    const { data, error } = await this.supabase
      .from('contract_versions')
      .select('id, version, created_at, change_summary, changed_by')
      .eq('contract_id', contractId)
      .eq('tenant_id', tenantId)
      .order('version', { ascending: false });

    if (error) throw new BadRequestException('Error al obtener versiones');
    return data || [];
  }

  async generatePdf(id: string, tenantId: string): Promise<Buffer> {
    const contract = await this.findOne(id, tenantId);

    if (!contract.content_html) {
      throw new BadRequestException('El contrato no tiene contenido HTML para generar PDF');
    }

    return this.pdfService.generatePdf(contract.content_html, contract.title);
  }
}
