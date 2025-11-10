import { Injectable } from '@nestjs/common';
import { query } from '../../infra/db';

export interface AuditEvent {
  cedula?: string | null;
  modulo: string;
  accion: string;
  referencia_clave?: string | null;
  descripcion?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  async log(event: AuditEvent): Promise<void> {
    await query(
      `insert into auditoria.tb_auditoria (cedula, modulo, accion, referencia_clave, descripcion, metadata)
       values ($1,$2,$3,$4,$5,$6)`,
      [
        event.cedula ?? null,
        event.modulo,
        event.accion,
        event.referencia_clave ?? null,
        event.descripcion ?? null,
        event.metadata ? JSON.stringify(event.metadata) : null,
      ],
    );
  }

  async logError(params: {
    origen: string;
    mensaje_error: string;
    stack_trace?: string | null;
    metadata?: Record<string, unknown> | null;
    cedula?: string | null;
  }): Promise<void> {
    await query(
      `insert into auditoria.tb_error (origen, mensaje_error, stack_trace, metadata, cedula)
       values ($1,$2,$3,$4,$5)`,
      [
        params.origen,
        params.mensaje_error,
        params.stack_trace ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        params.cedula ?? null,
      ],
    );
  }
}

