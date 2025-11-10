import { query } from '../../../infra/db';

export interface UserRow {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  password_hash: string;
  activo: boolean;
}

export async function findUserByCedula(cedula: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>('select * from usuario.usuarios where cedula = $1', [cedula]);
  return rows[0] ?? null;
}

export async function emailExists(email: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>('select exists(select 1 from usuario.usuarios where lower(email) = lower($1)) as exists', [email]);
  return rows[0]?.exists ?? false;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>('select * from usuario.usuarios where lower(email) = lower($1)', [email]);
  return rows[0] ?? null;
}

export async function createUser(u: Omit<UserRow, 'activo'> & { activo?: boolean }): Promise<void> {
  await query(
    `insert into usuario.usuarios (cedula, nombres, apellidos, email, telefono, password_hash, activo)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [u.cedula, u.nombres, u.apellidos, u.email, u.telefono ?? null, u.password_hash, u.activo ?? true],
  );
}

export async function getUserRoles(cedula: string): Promise<string[]> {
  const { rows } = await query<{ nombre_rol: string }>(
    `select nombre_rol from usuario.usuario_rol where cedula = $1`,
    [cedula],
  );
  return rows.map((r) => r.nombre_rol);
}

export async function assignRole(cedula: string, nombre_rol: string): Promise<void> {
  // asegurar que el rol exista para evitar FK violada tras truncates
  await query(`insert into usuario.roles (nombre_rol) values ($1) on conflict do nothing`, [nombre_rol]);
  await query(
    `insert into usuario.usuario_rol (cedula, nombre_rol)
     values ($1,$2)
     on conflict do nothing`,
    [cedula, nombre_rol],
  );
}
