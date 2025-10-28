import { Injectable, BadRequestException } from '@nestjs/common';
import { query } from '../../infra/db';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AppointmentsService {
  constructor(private readonly audit: AuditService) {}

  async disponibilidad(codigo_servicio: string, codigo_sede: string, desde: string, hasta: string) {
    const { rows } = await query(
      `select slot_id, inicio, fin, cupo_total, cupo_reservado, bloqueado
         from agenda.slot_disponible
        where codigo_servicio = $1 and codigo_sede = $2 and inicio >= $3 and fin <= $4 and bloqueado = false and cupo_reservado < cupo_total
        order by inicio asc`,
      [codigo_servicio, codigo_sede, desde, hasta],
    );
    return { items: rows };
  }

  async crearCita(cedula: string, codigo_servicio: string, slot_id: number) {
    // validar capacidad
    const { rows } = await query<{ cupo_total: number; cupo_reservado: number; bloqueado: boolean }>(
      `select cupo_total, cupo_reservado, bloqueado from agenda.slot_disponible where slot_id = $1`,
      [slot_id],
    );
    const slot = rows[0];
    if (!slot || slot.bloqueado || slot.cupo_reservado >= slot.cupo_total) {
      throw new BadRequestException('sin cupo');
    }
    const { rows: created } = await query<{ numero_cita: number }>(
      `insert into agenda.cita (cedula, codigo_servicio, slot_id, estado)
       values ($1,$2,$3,'CONFIRMADA')
       returning numero_cita`,
      [cedula, codigo_servicio, slot_id],
    );
    await query(`update agenda.slot_disponible set cupo_reservado = cupo_reservado + 1 where slot_id = $1`, [slot_id]);
    await this.audit.log({ cedula, modulo: 'AGENDA', accion: 'CREAR_CITA', referencia_clave: String(created[0].numero_cita) });
    return { numero_cita: created[0].numero_cita };
  }

  async cancelarCita(cedula: string, numero_cita: number, motivo: string) {
    await query(
      `update agenda.cita set estado = 'CANCELADA', motivo_cancelacion = $1, updated_at = now() where numero_cita = $2 and cedula = $3`,
      [motivo, numero_cita, cedula],
    );
    await this.audit.log({ cedula, modulo: 'AGENDA', accion: 'CANCELAR_CITA', referencia_clave: String(numero_cita), descripcion: motivo });
    return { ok: true };
  }
}

