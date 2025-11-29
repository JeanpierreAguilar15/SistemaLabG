import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { StripeService, CreateCheckoutSessionDto } from './stripe.service';

@ApiTags('Pagos - Stripe')
@Controller('pagos/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Get('config')
  @Public()
  @ApiOperation({ summary: 'Obtener configuración pública de Stripe' })
  @ApiResponse({ status: 200, description: 'Configuración de Stripe' })
  getConfig() {
    return {
      publicKey: this.stripeService.getPublicKey(),
      isConfigured: this.stripeService.isConfigured(),
    };
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear sesión de checkout de Stripe' })
  @ApiResponse({ status: 201, description: 'Sesión de checkout creada' })
  @ApiResponse({ status: 400, description: 'Error en los datos' })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
  async createCheckoutSession(
    @Body() data: CreateCheckoutSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.stripeService.createCheckoutSession(data, user.codigo_usuario);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estado de una sesión de checkout' })
  @ApiResponse({ status: 200, description: 'Estado de la sesión' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  async getSessionStatus(@Query('session_id') sessionId: string) {
    return this.stripeService.getSessionStatus(sessionId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de Stripe para eventos de pago' })
  @ApiResponse({ status: 200, description: 'Webhook procesado' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody;
    if (!payload) {
      return { received: false, error: 'No raw body' };
    }
    return this.stripeService.handleWebhook(payload, signature);
  }
}
