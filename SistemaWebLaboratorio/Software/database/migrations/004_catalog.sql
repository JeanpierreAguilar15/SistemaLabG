create schema if not exists catalogo;

create table if not exists catalogo.servicio (
  codigo text primary key,
  nombre text not null,
  precio numeric(10,2) not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

