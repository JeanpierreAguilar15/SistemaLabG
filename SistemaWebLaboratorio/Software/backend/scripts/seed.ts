import 'dotenv/config';
import { query } from '../src/infra/db';
import { PasswordService } from '../src/common/crypto/password.service';

async function ensureRoles() {
  await query(`insert into usuario.roles (nombre_rol) values ('PACIENTE') on conflict do nothing`);
  await query(`insert into usuario.roles (nombre_rol) values ('PERSONAL_LAB') on conflict do nothing`);
  await query(`insert into usuario.roles (nombre_rol) values ('ADMIN') on conflict do nothing`);
}

async function ensureAdmin() {
  const cedula = process.env.ADMIN_CEDULA;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!cedula || !email || !password) return; // opcional
  const { rows: exists } = await query<{ cedula: string }>(`select cedula from usuario.usuarios where cedula = $1`, [cedula]);
  const pwd = new PasswordService();
  if (!exists[0]) {
    const hash = await pwd.hash(password);
    await query(
      `insert into usuario.usuarios (cedula, nombres, apellidos, email, telefono, password_hash)
       values ($1,$2,$3,$4,$5,$6)`,
      [cedula, 'admin', 'principal', email, null, hash],
    );
  }
  await query(`insert into usuario.usuario_rol (cedula, nombre_rol) values ($1,'ADMIN') on conflict do nothing`, [cedula]);
}

async function main() {
  console.log('seeding roles y admin opcional...');
  await ensureRoles();
  await ensureAdmin();
  console.log('ok');
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });

