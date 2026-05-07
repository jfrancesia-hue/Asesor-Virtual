import {
  Controller, Get, Post, Body, Query, UseGuards,
  Headers, Req, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { IsEnum } from 'class-validator';
import { Throttle } from '@nestjs/throttler';

class CreditPackDto {
  @IsEnum(['credits_10', 'credits_30', 'credits_100']) pack: 'credits_10' | 'credits_30' | 'credits_100';
}

class SubscribePlanDto {
  @IsEnum(['start', 'pro', 'enterprise']) plan: 'start' | 'pro' | 'enterprise';
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('wallet')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  getWallet(@CurrentUser() user: JwtPayload) {
    return this.billingService.getWallet(user.tenantId);
  }

  @Get('transactions')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  getTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.billingService.getTransactions(user.tenantId, page, limit);
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  subscribePlan(@Body() dto: SubscribePlanDto, @CurrentUser() user: JwtPayload) {
    return this.billingService.createPlanCheckout(user.tenantId, user.sub, dto.plan);
  }

  @Post('credits/buy')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  buyCredits(@Body() dto: CreditPackDto, @CurrentUser() user: JwtPayload) {
    return this.billingService.createCreditCheckout(user.tenantId, user.sub, dto.pack);
  }

  // Mercado Pago notifica vía POST con body { type, data: { id } }.
  // Headers relevantes: x-signature, x-request-id (para verificar HMAC).
  @Post('webhook')
  @Throttle({ default: { ttl: 60000, limit: 100 } })
  handleWebhook(
    @Req() req: Request,
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
  ) {
    return this.billingService.handleWebhook(req.body, signature, requestId);
  }
}
