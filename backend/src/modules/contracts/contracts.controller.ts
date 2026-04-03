import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Res, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto, ContractFilterDto } from './contracts.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(@Body() dto: CreateContractDto, @CurrentUser() user: JwtPayload) {
    return this.contractsService.create(dto, user.sub, user.tenantId);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: ContractFilterDto) {
    return this.contractsService.findAll(user.tenantId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contractsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto, @CurrentUser() user: JwtPayload) {
    return this.contractsService.update(id, dto, user.sub, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contractsService.remove(id, user.sub, user.tenantId);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contractsService.getVersions(id, user.tenantId);
  }

  @Get(':id/pdf')
  async generatePdf(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.contractsService.generatePdf(id, user.tenantId);
    res.status(HttpStatus.OK).set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
