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

  async createRole(adminCedula: string, nombre_rol?: string) {
    const role = (nombre_rol || '').trim().toUpperCase();
    if (!role) return { ok: false };
    await query(`insert into usuario.roles (nombre_rol) values ($1) on conflict do nothing`, [role]);
    await this.audit.log({ cedula: adminCedula, modulo: 'USUARIOS', accion: 'CREAR_ROL', descripcion: `rol ${role}` });
    return { ok: true, nombre_rol: role };
  }

  async updateBasic(adminCedula: string, body: { cedula: string; nombres?: string; apellidos?: string; email?: string; telefono?: string | null }) {
    const { cedula, nombres, apellidos, email, telefono } = body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (nombres !== undefined) { fields.push(`nombres = $${idx++}`); values.push(nombres); }
    if (apellidos !== undefined) { fields.push(`apellidos = $${idx++}`); values.push(apellidos); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (telefono !== undefined) { fields.push(`telefono = $${idx++}`); values.push(telefono); }
    if (!fields.length) return { ok: false };
    values.push(cedula);
    await query(`update usuario.usuarios set ${fields.join(', ')} where cedula = $${idx}`, values);
    await this.audit.log({ cedula: adminCedula, modulo: 'USUARIOS', accion: 'UPDATE_BASIC', referencia_clave: cedula });
    return { ok: true };
  }

  // Crear nuevo usuario
  async createUser(adminCedula: string, body: {
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    password?: string;
    rol?: string;
  }) {
    const { cedula, nombres, apellidos, email, telefono, password, rol } = body;
    
    // Verificar si el usuario ya existe
    const existing = await query('select cedula from usuario.usuarios where cedula = $1', [cedula]);
    if (existing.rows.length > 0) {
      throw new Error('El usuario ya existe');
    }

    // Crear el usuario
    const pwd = password || 'Temp123!'; // Contraseña temporal si no se especifica
    await query(
      `insert into usuario.usuarios (cedula, nombres, apellidos, email, telefono, password_hash, activo)
       values ($1, $2, $3, $4, $5, crypt($6, gen_salt('bf')), true)`,
      [cedula, nombres, apellidos, email, telefono || null, pwd]
    );

    // Asignar rol si se especifica
    if (rol) {
      await assignRole(cedula, rol);
    }

    await this.audit.log({
      cedula: adminCedula,
      modulo: 'USUARIOS',
      accion: 'CREAR_USUARIO',
      referencia_clave: cedula,
      descripcion: `usuario creado con rol: ${rol || 'sin rol'}`,
    });

    return { ok: true, cedula };
  }

  // Obtener detalles de un usuario específico
  async getUserByCedula(cedula: string) {
    const userResult = await query(
      `select cedula, nombres, apellidos, email, telefono, activo, created_at, updated_at
       from usuario.usuarios where cedula = $1`,
      [cedula]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const rolesResult = await query(
      `select ur.nombre_rol
       from usuario.usuario_rol ur
       where ur.cedula = $1`,
      [cedula]
    );

    return {
      ...userResult.rows[0],
      roles: rolesResult.rows.map(r => ({ nombre: r.nombre_rol, descripcion: null }))
    };
  }

  // Actualizar usuario completo
  async updateUser(adminCedula: string, cedula: string, body: {
    nombres?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    activo?: boolean;
    rol?: string;
  }) {
    const { nombres, apellidos, email, telefono, activo, rol } = body;
    
    // Actualizar datos básicos
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    
    if (nombres !== undefined) { fields.push(`nombres = $${idx++}`); values.push(nombres); }
    if (apellidos !== undefined) { fields.push(`apellidos = $${idx++}`); values.push(apellidos); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (telefono !== undefined) { fields.push(`telefono = $${idx++}`); values.push(telefono); }
    if (activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(activo); }
    
    if (fields.length > 0) {
      values.push(cedula);
      await query(`update usuario.usuarios set ${fields.join(', ')} where cedula = $${idx}`, values);
    }

    // Actualizar rol si se especifica
    if (rol !== undefined) {
      // Primero eliminar roles existentes
      await query('delete from usuario.usuario_rol where cedula = $1', [cedula]);
      // Luego asignar el nuevo rol
      if (rol) {
        await assignRole(cedula, rol);
      }
    }

    await this.audit.log({
      cedula: adminCedula,
      modulo: 'USUARIOS',
      accion: 'ACTUALIZAR_USUARIO',
      referencia_clave: cedula,
      descripcion: `usuario actualizado`,
    });

    return { ok: true };
  }

  // Cambiar estado activo/inactivo del usuario
  async toggleUserStatus(adminCedula: string, cedula: string) {
    const result = await query(
      'update usuario.usuarios set activo = not activo where cedula = $1 returning activo',
      [cedula]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const nuevoEstado = result.rows[0].activo;
    await this.audit.log({
      cedula: adminCedula,
      modulo: 'USUARIOS',
      accion: 'CAMBIAR_ESTADO',
      referencia_clave: cedula,
      descripcion: `usuario ${nuevoEstado ? 'activado' : 'desactivado'}`,
    });

    return { ok: true, activo: nuevoEstado };
  }

  // Resetear contraseña de usuario
  async resetPassword(adminCedula: string, cedula: string, newPassword: string) {
    await query(
      'update usuario.usuarios set password_hash = crypt($1, gen_salt(\'bf\')) where cedula = $2',
      [newPassword, cedula]
    );

    await this.audit.log({
      cedula: adminCedula,
      modulo: 'USUARIOS',
      accion: 'RESET_PASSWORD',
      referencia_clave: cedula,
      descripcion: `contraseña reseteada`,
    });

    return { ok: true };
  }

  // Eliminar usuario (soft delete)
  async deleteUser(adminCedula: string, cedula: string, force?: boolean) {
    // Verificar si el usuario tiene citas o datos relacionados
    const hasAppointments = await query(
      'select 1 from agenda.cita where cedula = $1 limit 1',
      [cedula]
    );

    if (hasAppointments.rows.length > 0 && !force) {
      throw new Error('No se puede eliminar el usuario porque tiene citas asociadas');
    }

    // Eliminar roles del usuario
    await query('delete from usuario.usuario_rol where cedula = $1', [cedula]);
    
    // Marcar usuario como inactivo en lugar de eliminar físicamente
    await query('update usuario.usuarios set activo = false where cedula = $1', [cedula]);

    await this.audit.log({
      cedula: adminCedula,
      modulo: 'USUARIOS',
      accion: 'ELIMINAR_USUARIO',
      referencia_clave: cedula,
      descripcion: `usuario eliminado (soft delete)${hasAppointments.rows.length ? ' [forzado]' : ''}`,
    });

    return { ok: true };
  }

  // Listar todos los roles disponibles
  async listRoles() {
    const result = await query(
      'select nombre_rol from usuario.roles order by nombre_rol'
    );
    return result.rows.map((r:any) => ({ nombre_rol: r.nombre_rol, descripcion: null }));
  }
}
