import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  // Cotizaciones (simple)
  @Get('quotes')
  quotes(@Req() req: any) {
    return this.svc.listQuotes(req.user.sub);
  }

  @Post('quotes')
  createQuote(@Req() req: any, @Body() body: { items: any[]; subtotal:number; impuesto:number; total:number }) {
    return this.svc.createQuote(req.user.sub, body);
  }

  @Get('quotes/:id')
  getQuote(@Req() req: any, @Param('id') id: string){
    return this.svc.getQuote(req.user.sub, Number(id));
  }

  @Patch('quotes/:id')
  updateQuote(@Req() req: any, @Param('id') id: string, @Body() body: { items?: any[]; subtotal?:number; impuesto?:number; total?:number; estado?:string }) {
    return this.svc.updateQuote(req.user.sub, Number(id), body);
  }

  @Delete('quotes/:id')
  deleteQuote(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteQuote(req.user.sub, Number(id));
  }

  @Post('quotes/:id/convert-to-invoice')
  convertToInvoice(@Req() req: any, @Param('id') id: string) {
    return this.svc.convertQuoteToInvoice(Number(id), req.user.sub);
  }
}
