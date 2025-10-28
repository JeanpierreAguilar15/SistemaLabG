import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Get('facturas')
  facturas(@Req() req: any, @Query('estado') estado?: string) {
    return this.svc.listFacturas(req.user.sub, estado);
  }

  @Post('pagar')
  pagar(@Req() req: any, @Body() body: { numero_factura: number }) {
    return this.svc.iniciarPago(req.user.sub, body.numero_factura);
  }
}

