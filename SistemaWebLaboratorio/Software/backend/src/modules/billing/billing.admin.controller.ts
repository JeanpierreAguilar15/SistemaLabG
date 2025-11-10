import { Controller, Get, Query, UseGuards, Body, Param, Post, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { BillingService } from './billing.service';
import { query } from '../../infra/db';

@Controller('billing/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PERSONAL_LAB)
export class BillingAdminController {
  constructor(private readonly svc: BillingService) {}

  @Get('quotes')
  async listAllQuotes(){
    const { rows } = await query(
      `select numero_cotizacion, cedula, estado, total, created_at, updated_at
         from facturacion.cotizacion_simple
        order by created_at desc
        limit 500`);
    return { items: rows };
  }

  @Post('quotes')
  async createQuoteAdmin(@Body() body: { cedula:string; items:any[]; subtotal:number; impuesto:number; total:number }){
    return this.svc.createQuote(body.cedula, body);
  }

  @Get('quotes/:id')
  async getQuoteAdmin(@Param('id') id: string){
    const { rows } = await query(
      `select numero_cotizacion, cedula, estado, items, subtotal, impuesto_total as impuesto, total, created_at, updated_at
         from facturacion.cotizacion_simple
        where numero_cotizacion = $1`,
      [Number(id)]
    );
    return rows[0] ? rows[0] : null;
  }

  @Patch('quotes/:id')
  async updateQuoteAdmin(@Param('id') id: string, @Body() body: { items?:any[]; subtotal?:number; impuesto?:number; total?:number; estado?:string }){
    const sets: string[] = [];
    const vals: any[] = [];
    const push = (expr:string,val:any)=>{ sets.push(expr); vals.push(val); };
    if (body.items) push('items = $' + (vals.length+1), JSON.stringify(body.items));
    if (body.subtotal != null) push('subtotal = $' + (vals.length+1), Number(body.subtotal));
    if (body.impuesto != null) push('impuesto_total = $' + (vals.length+1), Number(body.impuesto));
    if (body.total != null) push('total = $' + (vals.length+1), Number(body.total));
    if (body.estado) push('estado = $' + (vals.length+1), String(body.estado).toUpperCase());
    if (!sets.length) return { ok:true };
    push('updated_at = now()', null as any);
    const sql = `update facturacion.cotizacion_simple set ${sets.join(', ')} where numero_cotizacion = $${vals.length+1}`.replace(', updated_at = now()',' , updated_at = now()');
    vals.push(Number(id));
    await query(sql, vals);
    return { ok:true };
  }

  @Delete('quotes/:id')
  async deleteQuoteAdmin(@Param('id') id: string){
    await query(`delete from facturacion.cotizacion_simple where numero_cotizacion = $1`, [Number(id)]);
    return { ok:true };
  }

  @Post('quotes/:id/convert-to-invoice')
  async convertToInvoiceAdmin(@Param('id') id: string){
    return this.svc.convertQuoteToInvoice(Number(id));
  }

  @Get('facturas')
  async listAllFacturas(@Query('estado') estado?: string){
    return this.svc.listAllFacturas(estado);
  }
}
