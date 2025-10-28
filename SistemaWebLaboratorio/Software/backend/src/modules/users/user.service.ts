import { Injectable } from '@nestjs/common';
import { query } from '../../infra/db';
import { assignRole, getUserRoles } from '../auth/repos/user.repo';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UserService {
  constructor(private readonly audit: AuditService) {}

  async listBasic() {
    const { rows } = await query(
      `select u.cedula, u.nombres, u.apellidos, u.email,
              coalesce(json_agg(ur.nombre_rol) filter (where ur.nombre_rol is not null), '[]') as roles
         from usuario.usuarios u
    left join usuario.usuario_rol ur on ur.cedula = u.cedula
     group by u.cedula
     order by u.apellidos, u.nombres
     limit 200`,
    );
    return rows.map((r: any) => ({ ...r, roles: r.roles as string[] }));
  }

  async assignRole(adminCedula: string, cedula: string, nombre_rol: string) {
    await assignRole(cedula, nombre_rol);
    await this.audit.log({
      cedula: adminCedula,
      modulo: 'USUARIOS',
      accion: 'CAMBIO_ROL',
      referencia_clave: cedula,
      descripcion: `asignado rol ${nombre_rol}`,
    });
    return { cedula, roles: await getUserRoles(cedula) };
  }
}

