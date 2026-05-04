import {
  Controller, Get, Post, Body, Query, UseGuards,
  Headers, RawBodyRequest, Req, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { IsString, IsEnum } from 'class-validator';
import { Throttle } from '@nestjs/throttler';

class CheckoutDto {
  @IsString() priceId: string;
  @IsEnum(['subscription', 'payment']) mode: 'subscription' | 'payment';
}

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

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createCheckout(@Body() dto: CheckoutDto, @CurrentUser() user: JwtPayload) {
    return this.billingService.createCheckoutSession(user.tenantId, user.sub, dto.priceId, dto.mode);
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

  @Post('webhook')
  @Throttle({ default: { ttl: 60000, limit: 100 } })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody!, signature);
  }
}
