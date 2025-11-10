-- Add observaciones column to agenda.cita table
alter table agenda.cita add column if not exists observaciones text null;

comment on column agenda.cita.observaciones is 'Notas u observaciones adicionales sobre la cita (admin/personal)';
