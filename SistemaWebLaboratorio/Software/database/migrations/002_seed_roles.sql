-- inserta roles mínimos, idempotente
insert into usuario.roles (nombre_rol) values ('PACIENTE') on conflict do nothing;
insert into usuario.roles (nombre_rol) values ('PERSONAL_LAB') on conflict do nothing;
insert into usuario.roles (nombre_rol) values ('ADMIN') on conflict do nothing;

