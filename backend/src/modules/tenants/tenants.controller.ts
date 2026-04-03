import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { IsOptional, IsString, IsObject } from 'class-validator';

class UpdateTenantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsObject() settings?: object;
}

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getMyTenant(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.findOne(user.tenantId);
  }

  @Patch('me')
  updateMyTenant(@CurrentUser() user: JwtPayload, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user.tenantId, dto);
  }

  @Get('me/stats')
  getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.getDashboardStats(user.tenantId);
  }

  @Get('me/usage')
  getUsage(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.getUsage(user.tenantId);
  }
}
