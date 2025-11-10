-- Configuracion semanal de horario de atencion (idempotente)
create schema if not exists agenda;

create table if not exists agenda.horario_config (
  day_of_week int primary key, -- 0 domingo .. 6 sabado
  inicio_m1 time,
  fin_m1 time,
  inicio_m2 time,
  fin_m2 time,
  activo boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Semilla por defecto: L-S 07:00-12:00 y 14:00-17:00; Domingo 07:00-12:00
insert into agenda.horario_config (day_of_week, inicio_m1, fin_m1, inicio_m2, fin_m2, activo)
values
  (0, '07:00', '12:00', null, null, true),
  (1, '07:00', '12:00', '14:00', '17:00', true),
  (2, '07:00', '12:00', '14:00', '17:00', true),
  (3, '07:00', '12:00', '14:00', '17:00', true),
  (4, '07:00', '12:00', '14:00', '17:00', true),
  (5, '07:00', '12:00', '14:00', '17:00', true),
  (6, '07:00', '12:00', '14:00', '17:00', true)
on conflict (day_of_week) do nothing;

