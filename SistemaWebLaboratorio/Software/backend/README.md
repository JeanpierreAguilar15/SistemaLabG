backend nestjs modular

modulos base:
- auth: registro/login/logout global, recuperación contraseña, auditoría de login.
- users: perfil básico, gestión de roles (admin).
- appointments: disponibilidad, crear/reprogramar/cancelar cita.
- results: listar resultados propios y stub descarga pdf (auditable).
- billing: cotizaciones/facturas/pagos (stubs iniciales).
- audit: consulta bitácora (admin).

nota: repos usan consultas tipadas a postgres. completar variables de entorno y wiring de db/redis en tu entorno.
