import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { query } from '../../infra/db';
import type { Response } from 'express';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PERSONAL_LAB)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  // listar eventos de auditoría (admin)
  @Get('events')
  async events(@Query('cedula') cedula?: string) {
    const { rows } = await query(
      `select evento_id, fecha_evento, cedula, modulo, accion, referencia_clave, descripcion
         from auditoria.tb_auditoria
        where ($1::text is null or cedula = $1)
        order by fecha_evento desc
        limit 200`,
      [cedula ?? null],
    );
    return { items: rows };
  }

  // export CSV de eventos de auditoría
  @Get('events.csv')
  async eventsCsv(@Res() res: Response, @Query('cedula') cedula?: string) {
    const { rows } = await query(
      `select evento_id, fecha_evento, cedula, modulo, accion, referencia_clave, descripcion
         from auditoria.tb_auditoria
        where ($1::text is null or cedula = $1)
        order by fecha_evento desc
        limit 1000`,
      [cedula ?? null],
    );
    const header = 'evento_id,fecha_evento,cedula,modulo,accion,referencia_clave,descripcion\n';
    const lines = rows.map((r: any) => [
      r.evento_id,
      r.fecha_evento?.toISOString?.() || r.fecha_evento,
      r.cedula,
      r.modulo,
      r.accion,
      r.referencia_clave ?? '',
      (r.descripcion ?? '').toString().replace(/\n/g, ' ')
    ].join(','));
    const csv = '\uFEFF' + header + lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="auditoria.csv"');
    return res.send(csv);
  }
}
