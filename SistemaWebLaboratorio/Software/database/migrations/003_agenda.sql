-- esquema de agenda (slots + citas)
create schema if not exists agenda;

-- tabla de slots disponibles por servicio/sede
create table if not exists agenda.slot_disponible (
  slot_id serial primary key,
  codigo_servicio text not null,
  codigo_sede text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  cupo_total int not null default 1,
  cupo_reservado int not null default 0,
  bloqueado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (codigo_servicio, codigo_sede, inicio, fin)
);
create index if not exists idx_slot_disponible_rango on agenda.slot_disponible (codigo_servicio, codigo_sede, inicio, fin);

-- tabla de citas
create table if not exists agenda.cita (
  numero_cita serial primary key,
  cedula text not null,
  codigo_servicio text not null,
  slot_id int not null references agenda.slot_disponible(slot_id) on delete restrict,
  estado text not null default 'CONFIRMADA', -- CONFIRMADA | CANCELADA
  motivo_cancelacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cita_cedula on agenda.cita (cedula);
create index if not exists idx_cita_slot on agenda.cita (slot_id);

