alter table catalogo.servicio add column if not exists categoria text not null default 'OTROS';
create index if not exists idx_servicio_categoria on catalogo.servicio (categoria);

