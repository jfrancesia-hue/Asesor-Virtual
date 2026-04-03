import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService, CreateComplianceDto, UpdateComplianceDto } from './compliance.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  create(@Body() dto: CreateComplianceDto, @CurrentUser() user: JwtPayload) {
    return this.complianceService.create(dto, user.sub, user.tenantId);
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.complianceService.list(user.tenantId, status, page, limit);
  }

  @Get('upcoming')
  upcoming(@CurrentUser() user: JwtPayload, @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.complianceService.getUpcoming(user.tenantId, days);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.complianceService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateComplianceDto, @CurrentUser() user: JwtPayload) {
    return this.complianceService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.complianceService.remove(id, user.tenantId);
  }
}
