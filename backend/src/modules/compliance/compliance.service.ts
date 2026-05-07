import {
  Injectable, Inject, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';

export class CreateComplianceDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() dueDate: string;
  @IsOptional() @IsUUID() contractId?: string;
  @IsOptional() @IsUUID() responsibleUserId?: string;
}

export class UpdateComplianceDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(['pending', 'completed', 'overdue', 'dismissed']) status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsUUID() responsibleUserId?: string;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  async create(dto: CreateComplianceDto, userId: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('compliance_items')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        contract_id: dto.contractId,
        responsible_user_id: dto.responsibleUserId,
        title: dto.title,
        description: dto.description,
        due_date: dto.dueDate,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new BadRequestException('Error al crear obligación');
    return data;
  }

  async list(tenantId: string, status?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = this.supabase
      .from('compliance_items')
      .select('*, contract:contracts(id, title)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw new BadRequestException('Error al obtener obligaciones');

    return { items: data || [], total: count || 0, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('compliance_items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) throw new NotFoundException('Obligación no encontrada');
    return data;
  }

  async update(id: string, dto: UpdateComplianceDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const { data, error } = await this.supabase
      .from('compliance_items')
      .update({
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueDate && { due_date: dto.dueDate }),
        ...(dto.status && { status: dto.status, ...(dto.status === 'completed' && { completed_at: new Date().toISOString() }) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.responsibleUserId !== undefined && { responsible_user_id: dto.responsibleUserId }),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException('Error al actualizar obligación');
    return data;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.supabase.from('compliance_items').delete().eq('id', id).eq('tenant_id', tenantId);
    return { deleted: true };
  }

  async getUpcoming(tenantId: string, days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data } = await this.supabase
      .from('compliance_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .lte('due_date', futureDate.toISOString())
      .order('due_date');

    return data || [];
  }

  // Run daily at 8am: mark overdue items.
  // Hace UN solo update sobre todas las pending pasadas de fecha. Antes había
  // un loop que combinaba .update().select().range() — `.range()` en un update
  // restringe el SELECT de retorno pero NO la cláusula UPDATE: el primer
  // pase ya marcaba TODAS las filas, luego cada iteración devolvía 0 nuevas
  // y nunca terminaba (o terminaba por accidente).
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async markOverdueItems() {
    const { data, error } = await this.supabase
      .from('compliance_items')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .select('id');

    if (error) {
      this.logger.error(`markOverdueItems falló: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      this.logger.log(`markOverdueItems: ${data.length} ítems marcados como overdue`);
    }
  }
}
