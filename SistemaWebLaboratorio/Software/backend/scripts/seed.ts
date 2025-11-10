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
  const pwd = new PasswordService();
  const hash = await pwd.hash(password);
  
  // Verificar si existe el usuario por cédula
  const { rows: existsByCedula } = await query<{ cedula: string }>(`select cedula from usuario.usuarios where cedula = $1`, [cedula]);
  
  if (!existsByCedula[0]) {
    // Si no existe por cédula, verificar si existe por email
    const { rows: existsByEmail } = await query<{ cedula: string }>(`select cedula from usuario.usuarios where email = $1`, [email]);
    
    if (existsByEmail[0]) {
       // Si existe por email pero con diferente cédula, actualizar la cédula
       // Primero eliminar los roles del usuario antiguo
       await query(`delete from usuario.usuario_rol where cedula = $1`, [existsByEmail[0].cedula]);
       // Luego actualizar el usuario
       await query(
         `update usuario.usuarios set cedula = $1, nombres = $2, apellidos = $3, password_hash = $4 where email = $5`,
         [cedula, 'admin', 'principal', hash, email],
       );
     } else {
      // Si no existe ni por cédula ni por email, crear nuevo usuario
      await query(
        `insert into usuario.usuarios (cedula, nombres, apellidos, email, telefono, password_hash)
         values ($1,$2,$3,$4,$5,$6)`,
        [cedula, 'admin', 'principal', email, null, hash],
      );
    }
  } else {
    // Si existe por cédula, actualizar los datos
    await query(
      `update usuario.usuarios set nombres = $1, apellidos = $2, email = $3, password_hash = $4 where cedula = $5`,
      ['admin', 'principal', email, hash, cedula],
    );
  }
  
  await query(`insert into usuario.usuario_rol (cedula, nombre_rol) values ($1,'ADMIN') on conflict do nothing`, [cedula]);
}

async function ensureDefaultSede(){
  await query(
    `insert into agenda.sede (codigo_sede, nombre_sede, direccion)
     values ('UNICA','Sede Principal', null)
     on conflict (codigo_sede) do nothing`
  );
}

async function main() {
  console.log('seeding roles y admin opcional...');
  await ensureRoles();
  await ensureAdmin();
  await ensureDefaultSede();
  console.log('ok');
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });
