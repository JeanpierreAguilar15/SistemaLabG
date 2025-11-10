-- Sedes y feriados (idempotente)
create schema if not exists agenda;

create table if not exists agenda.sede (
  codigo_sede text primary key,
  nombre_sede text not null,
  direccion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agenda.feriado (
  fecha date primary key,
  nombre text not null,
  ambito text not null default 'NACIONAL', -- NACIONAL/LOCAL
  created_at timestamptz not null default now()
);

-- Semilla de feriados fijos de Ecuador (sin mover puentes ni feriados variables)
insert into agenda.feriado (fecha, nombre, ambito) values
  ('2025-01-01','Año Nuevo','NACIONAL'),
  ('2025-05-01','Día del Trabajo','NACIONAL'),
  ('2025-05-24','Batalla de Pichincha','NACIONAL'),
  ('2025-08-10','Primer Grito de Independencia','NACIONAL'),
  ('2025-10-09','Independencia de Guayaquil','NACIONAL'),
  ('2025-11-02','Día de los Difuntos','NACIONAL'),
  ('2025-11-03','Independencia de Cuenca','NACIONAL'),
  ('2025-12-25','Navidad','NACIONAL')
on conflict (fecha) do nothing;

-- Índices útiles
create index if not exists idx_feriado_fecha on agenda.feriado (fecha);

