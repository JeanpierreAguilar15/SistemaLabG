import { Injectable, BadRequestException } from '@nestjs/common';
import { query } from '../../infra/db';
import { UpsertServiceDto } from './dtos/upsert-service.dto';

@Injectable()
export class CatalogService {
  async list(){
    const { rows } = await query(`select codigo, nombre, precio, activo, categoria, created_at, updated_at from catalogo.servicio order by categoria asc, nombre asc limit 500`);
    return { items: rows };
  }
  async listActive(){
    const { rows } = await query(`select codigo, nombre, precio, categoria from catalogo.servicio where activo = true order by categoria asc, nombre asc limit 500`);
    return { items: rows };
  }
  async upsert(dto: UpsertServiceDto){
    const codigo = (dto.codigo||'').trim().toUpperCase();
    const nombre = (dto.nombre||'').trim();
    if(!codigo || !nombre) throw new BadRequestException('datos invalidos');
    const precio = Number(dto.precio||0);
    if (isNaN(precio) || precio < 0) throw new BadRequestException('precio inválido');
    const activo = dto.activo !== false;
    const categoria = (dto.categoria || 'OTROS').trim().toUpperCase();
    const duracion_min = dto.duracion_min || 30;
    const instrucciones = dto.instrucciones_preparacion || null;

    await query(
      `insert into catalogo.servicio (codigo, nombre, precio, activo, categoria)
       values ($1,$2,$3,$4,$5)
       on conflict (codigo) do update set nombre = excluded.nombre, precio = excluded.precio, activo = excluded.activo, categoria = excluded.categoria, updated_at = now()`,
      [codigo, nombre, precio, activo, categoria]
    );
    // Mantener sincronizado el catálogo con agenda.servicio (para FK de slots/citas)
    await query(
      `insert into agenda.servicio (codigo_servicio, nombre_servicio, categoria, duracion_min, instrucciones_preparacion, activo)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (codigo_servicio) do update set nombre_servicio = excluded.nombre_servicio, categoria = excluded.categoria, duracion_min = excluded.duracion_min, instrucciones_preparacion = excluded.instrucciones_preparacion, activo = excluded.activo, updated_at = now()`,
      [codigo, nombre, categoria, duracion_min, instrucciones, activo]
    );
    return { ok:true };
  }
  async remove(codigo:string){
    await query(`delete from catalogo.servicio where codigo = $1`, [codigo]);
    // Desactivar en agenda para no romper FKs
    await query(`update agenda.servicio set activo = false, updated_at = now() where codigo_servicio = $1`, [codigo]);
    return { ok:true };
  }
}
