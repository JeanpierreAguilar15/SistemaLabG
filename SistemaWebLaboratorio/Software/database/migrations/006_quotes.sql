-- Cotizaciones simples para Sprint 3 (independiente de resultados.prueba_lab)
create schema if not exists facturacion;

create table if not exists facturacion.cotizacion_simple (
  numero_cotizacion bigserial primary key,
  cedula varchar(20) not null,
  estado text not null default 'BORRADOR',
  items jsonb not null, -- [{codigo_prueba,nombre,precio,cantidad}]
  subtotal numeric(10,2) not null default 0,
  impuesto_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cot_simple_cedula on facturacion.cotizacion_simple(cedula);

