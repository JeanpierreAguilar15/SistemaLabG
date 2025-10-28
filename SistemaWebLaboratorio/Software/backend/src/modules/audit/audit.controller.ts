import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { query } from '../../infra/db';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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
}

