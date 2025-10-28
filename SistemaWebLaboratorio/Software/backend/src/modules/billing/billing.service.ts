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
}

