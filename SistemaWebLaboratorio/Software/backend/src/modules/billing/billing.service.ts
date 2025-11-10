import { Injectable } from '@nestjs/common';
import { query } from '../../infra/db';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  constructor(private readonly audit: AuditService) {}

  async listFacturas(cedula: string, estado?: string) {
    const { rows } = await query(
      `select numero_factura, numero_cotizacion, estado, monto_total, fecha_emision, fecha_vencimiento, fecha_pago
         from facturacion.factura
        where cedula = $1 and ($2::text is null or estado = $2)
        order by fecha_emision desc
        limit 200`,
      [cedula, estado ?? null],
    );
    return { items: rows };
  }

  async iniciarPago(cedula: string, numero_factura: number) {
    // TODO: integrar pasarela. por ahora simular referencia
    const ref = `REF-${numero_factura}-${Date.now()}`;
    await this.audit.log({ cedula, modulo: 'PAGOS', accion: 'INICIAR_PAGO', referencia_clave: String(numero_factura) });
    return { referencia: ref, url_pasarela: `https://pago.example/${ref}` };
  }

  // === Cotizaciones simples (Sprint 3) ===
  async listQuotes(cedula: string){
    const { rows } = await query(
      `select numero_cotizacion, estado, items, subtotal, impuesto_total as impuesto, total, created_at, updated_at
         from facturacion.cotizacion_simple
        where cedula = $1
        order by created_at desc
        limit 200`,
      [cedula],
    );
    return { items: rows };
  }

  async createQuote(cedula: string, body: { items: any[]; subtotal:number; impuesto:number; total:number }){
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = Number(body.subtotal||0);
    const impuesto = Number(body.impuesto||0);
    const total = Number(body.total||0);
    const { rows } = await query<{ numero_cotizacion:number }>(
      `insert into facturacion.cotizacion_simple (cedula, estado, items, subtotal, impuesto_total, total)
       values ($1,'BORRADOR',$2,$3,$4,$5)
       returning numero_cotizacion`,
      [cedula, JSON.stringify(items), subtotal, impuesto, total],
    );
    await this.audit.log({ cedula, modulo: 'FACTURACION', accion: 'CREAR_COTIZACION', referencia_clave: String(rows[0].numero_cotizacion) });
    return { numero_cotizacion: rows[0].numero_cotizacion };
  }

  async updateQuote(cedula: string, id: number, body: { items?: any[]; subtotal?:number; impuesto?:number; total?:number; estado?:string }){
    const sets: string[] = [];
    const vals: any[] = [];
    const push = (expr: string, val: any) => { sets.push(expr); vals.push(val); };
    if (body.items) push('items = $' + (vals.length+1), JSON.stringify(body.items));
    if (body.subtotal != null) push('subtotal = $' + (vals.length+1), Number(body.subtotal));
    if (body.impuesto != null) push('impuesto_total = $' + (vals.length+1), Number(body.impuesto));
    if (body.total != null) push('total = $' + (vals.length+1), Number(body.total));
    if (body.estado) push('estado = $' + (vals.length+1), String(body.estado).toUpperCase());
    if (!sets.length) return { ok:true };
    // updated_at no requiere parámetro
    sets.push('updated_at = now()');
    const sql = `update facturacion.cotizacion_simple set ${sets.join(', ')} where numero_cotizacion = $${vals.length+1} and cedula = $${vals.length+2}`;
    vals.push(id, cedula);
    await query(sql, vals);
    await this.audit.log({ cedula, modulo: 'FACTURACION', accion: 'ACTUALIZAR_COTIZACION', referencia_clave: String(id) });
    return { ok:true };
  }

  async deleteQuote(cedula: string, id: number){
    await query(`delete from facturacion.cotizacion_simple where numero_cotizacion = $1 and cedula = $2`, [id, cedula]);
    await this.audit.log({ cedula, modulo: 'FACTURACION', accion: 'ELIMINAR_COTIZACION', referencia_clave: String(id) });
    return { ok:true };
  }

  async getQuote(cedula: string, id: number){
    const { rows } = await query(
      `select numero_cotizacion, estado, items, subtotal, impuesto_total as impuesto, total, created_at, updated_at
         from facturacion.cotizacion_simple
        where numero_cotizacion = $1 and cedula = $2`,
      [id, cedula],
    );
    return rows[0] ? rows[0] : null;
  }

  /**
   * Convierte una cotización a factura
   * RF-23: Iniciar pago desde la cotización
   */
  async convertQuoteToInvoice(numero_cotizacion: number, cedula?: string) {
    // 1. Obtener cotización
    const quoteSql = cedula
      ? `select * from facturacion.cotizacion_simple where numero_cotizacion = $1 and cedula = $2`
      : `select * from facturacion.cotizacion_simple where numero_cotizacion = $1`;
    const quoteParams = cedula ? [numero_cotizacion, cedula] : [numero_cotizacion];
    const { rows: quoteRows } = await query(quoteSql, quoteParams);

    if (!quoteRows.length) {
      throw new Error('Cotización no encontrada');
    }

    const quote = quoteRows[0];

    // 2. Verificar que no exista ya una factura para esta cotización
    const { rows: existingInvoice } = await query(
      `select numero_factura from facturacion.factura where numero_cotizacion = $1`,
      [numero_cotizacion]
    );

    if (existingInvoice.length > 0) {
      return {
        ok: false,
        message: 'Ya existe una factura para esta cotización',
        numero_factura: existingInvoice[0].numero_factura
      };
    }

    // 3. Crear factura
    const { rows: invoiceRows } = await query<{ numero_factura: number }>(
      `insert into facturacion.factura
        (cedula, numero_cotizacion, estado, monto_total, fecha_emision, fecha_vencimiento)
       values ($1, $2, 'PENDIENTE', $3, current_date, current_date + interval '30 days')
       returning numero_factura`,
      [quote.cedula, numero_cotizacion, quote.total]
    );

    const numero_factura = invoiceRows[0].numero_factura;

    // 4. Actualizar estado de cotización a FINAL
    await query(
      `update facturacion.cotizacion_simple
       set estado = 'FINAL', updated_at = now()
       where numero_cotizacion = $1`,
      [numero_cotizacion]
    );

    // 5. Auditoría
    await this.audit.log({
      cedula: quote.cedula,
      modulo: 'FACTURACION',
      accion: 'CONVERTIR_COTIZACION_A_FACTURA',
      referencia_clave: `COT-${numero_cotizacion}->FAC-${numero_factura}`
    });

    return {
      ok: true,
      numero_factura,
      numero_cotizacion,
      message: 'Cotización convertida a factura exitosamente'
    };
  }

  /**
   * Listar todas las facturas (admin)
   */
  async listAllFacturas(estado?: string) {
    const { rows } = await query(
      `select f.numero_factura, f.numero_cotizacion, f.cedula, f.estado, f.monto_total,
              f.fecha_emision, f.fecha_vencimiento, f.fecha_pago,
              u.nombres, u.apellidos, u.email
         from facturacion.factura f
         inner join usuario.usuarios u on u.cedula = f.cedula
        where ($1::text is null or f.estado = $1)
        order by f.fecha_emision desc
        limit 500`,
      [estado ?? null]
    );
    return { items: rows };
  }
}
