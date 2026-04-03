import {
  Injectable, Inject, Logger, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  async listUsers(tenantId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, email, full_name, role, is_active, last_login, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at');

    if (error) throw new BadRequestException('Error al obtener usuarios');
    return data || [];
  }

  async inviteUser(tenantId: string, inviterId: string, email: string, role: string, fullName: string) {
    // Check plan limit
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('plan, max_users')
      .eq('id', tenantId)
      .single();

    const { count } = await this.supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (tenant?.max_users !== 99999 && (count || 0) >= (tenant?.max_users || 1)) {
      throw new ForbiddenException('Alcanzaste el límite de usuarios de tu plan. Actualizá para agregar más.');
    }

    // Create auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2).toUpperCase() + '!',
    });

    if (authError) throw new BadRequestException('Error al crear usuario: ' + authError.message);

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenantId,
        email,
        full_name: fullName,
        role: role || 'member',
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      await this.supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
      throw new BadRequestException('Error al crear perfil de usuario');
    }

    return { id: user.id, email: user.email, fullName: user.full_name, role: user.role };
  }

  async updateUser(userId: string, tenantId: string, updates: { role?: string; isActive?: boolean }) {
    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    const { data, error } = await this.supabase
      .from('users')
      .update({
        ...(updates.role && { role: updates.role }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException('Error al actualizar usuario');
    return data;
  }

  async deactivateUser(userId: string, tenantId: string, requesterId: string) {
    if (userId === requesterId) throw new ForbiddenException('No podés desactivar tu propia cuenta');
    return this.updateUser(userId, tenantId, { isActive: false });
  }
}
