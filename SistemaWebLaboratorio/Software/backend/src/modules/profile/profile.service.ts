import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { query } from '../../infra/db';
import { AuditService } from '../audit/audit.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { PasswordService } from '../../common/crypto/password.service';
import { findUserByEmail } from '../auth/repos/user.repo';

@Injectable()
export class ProfileService {
  constructor(private readonly audit: AuditService, private readonly pwd: PasswordService) {}

  async getMe(cedula: string) {
    const { rows } = await query(
      `select u.cedula, u.nombres, u.apellidos, u.email, u.telefono,
              p.direccion, p.contacto_emergencia_nombre, p.contacto_emergencia_telefono,
              coalesce(json_agg(c.tipo_consentimiento order by c.consentimiento_id) filter (where c.consentimiento_id is not null),'[]') as consentimientos
         from usuario.usuarios u
    left join usuario.perfil_paciente p on p.cedula = u.cedula
    left join usuario.consentimientos c on c.cedula = u.cedula and c.aceptado = true
        where u.cedula = $1
     group by u.cedula, p.direccion, p.contacto_emergencia_nombre, p.contacto_emergencia_telefono`,
      [cedula],
    );
    return rows[0] ?? null;
  }

  async updateMe(cedula: string, dto: UpdateProfileDto) {
    await query(
      `insert into usuario.perfil_paciente (cedula, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono)
       values ($1,$2,$3,$4)
       on conflict (cedula) do update set direccion = excluded.direccion,
                                         contacto_emergencia_nombre = excluded.contacto_emergencia_nombre,
                                         contacto_emergencia_telefono = excluded.contacto_emergencia_telefono,
                                         updated_at = now()`,
      [cedula, dto.direccion ?? null, dto.contacto_emergencia_nombre ?? null, dto.contacto_emergencia_telefono ?? null],
    );
    // actualizar datos del usuario (nombres, apellidos, email, telefono)
    const sets: string[] = [];
    const values: any[] = [];
    const push = (col: string, val: any) => { sets.push(`${col} = $${values.length + 1}`); values.push(val); };
    if (dto.nombres !== undefined) push('nombres', dto.nombres);
    if (dto.apellidos !== undefined) push('apellidos', dto.apellidos);
    if (dto.telefono !== undefined) push('telefono', dto.telefono);
    if (dto.email !== undefined) {
      const found = await findUserByEmail(dto.email);
      if (found && found.cedula !== cedula) throw new BadRequestException('email ya registrado');
      push('email', dto.email);
    }
    if (sets.length > 0) {
      values.push(cedula);
      await query(`update usuario.usuarios set ${sets.join(', ')}, updated_at = now() where cedula = $${values.length}`, values);
    }
    await this.audit.log({ cedula, modulo: 'USUARIOS', accion: 'ACTUALIZAR_PERFIL', descripcion: 'actualización de datos personales' });
    return this.getMe(cedula);
  }

  async upsertConsent(cedula: string, tipo: string, aceptado: boolean) {
    if (aceptado) {
      // Aceptar: upsert y siempre marca aceptado_en = ahora
      await query(
        `insert into usuario.consentimientos (cedula, tipo_consentimiento, version_texto, aceptado, aceptado_en)
         values ($1,$2,'v1', true, now())
         on conflict (cedula, tipo_consentimiento)
         do update set aceptado = excluded.aceptado,
                       aceptado_en = now()`,
        [cedula, tipo],
      );
    } else {
      // Revocar: no podemos poner aceptado_en = null (columna NOT NULL)
      // Solo marcamos aceptado=false y mantenemos la fecha de aceptación previa
      await query(
        `update usuario.consentimientos
            set aceptado = false
          where cedula = $1 and tipo_consentimiento = $2`,
        [cedula, tipo],
      );
    }
    await this.audit.log({ cedula, modulo: 'USUARIOS', accion: 'CONSENTIMIENTO', descripcion: `${tipo}=${aceptado}` });
    return { ok: true };
  }

  async changePassword(cedula: string, dto: ChangePasswordDto) {
    const { rows } = await query<{ password_hash: string }>(`select password_hash from usuario.usuarios where cedula = $1`, [cedula]);
    const user = rows[0];
    if (!user) throw new ForbiddenException('no permitido');
    const ok = await this.pwd.verify(dto.current_password, user.password_hash);
    if (!ok) throw new ForbiddenException('contraseña actual incorrecta');
    const new_hash = await this.pwd.hash(dto.new_password);
    await query(`update usuario.usuarios set password_hash = $1 where cedula = $2`, [new_hash, cedula]);
    await this.audit.log({ cedula, modulo: 'USUARIOS', accion: 'CAMBIO_PASSWORD' });
    return { ok: true };
  }

  async history(cedula: string) {
    const citas = await query(
      `select numero_cita, codigo_servicio, estado, created_at from agenda.cita where cedula = $1 order by created_at desc limit 50`,
      [cedula],
    );
    const pagos = await query(
      `select numero_factura, estado, monto_total, fecha_emision from facturacion.factura where cedula = $1 order by fecha_emision desc limit 50`,
      [cedula],
    );
    return { citas: citas.rows, pagos: pagos.rows };
  }
}
