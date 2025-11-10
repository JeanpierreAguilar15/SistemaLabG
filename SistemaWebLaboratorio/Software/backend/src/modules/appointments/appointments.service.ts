import { Injectable, BadRequestException } from '@nestjs/common';
import { query, db } from '../../infra/db';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AppointmentsService {
  constructor(private readonly audit: AuditService) {}

  async disponibilidad(codigo_servicio: string, codigo_sede: string | undefined, desde: string, hasta: string) {
    const from = new Date(desde);
    const to = new Date(hasta);
    if (!(from < to)) throw new BadRequestException('rango invÃ¡lido');
    const nowIso = new Date().toISOString();
    const limitIso = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const sedeCond = codigo_sede ? 'and codigo_sede = $6' : '';
    const params: any[] = [codigo_servicio, desde, hasta, nowIso, limitIso];
    if (codigo_sede) params.push(codigo_sede);
    let { rows } = await query(
      `select slot_id, inicio, fin, cupo_total, cupo_reservado, bloqueado, codigo_sede
         from agenda.slot_disponible
        where codigo_servicio = $1
          and inicio >= greatest($2::timestamptz, $4::timestamptz)
          and fin <= least($3::timestamptz, $5::timestamptz)
          ${sedeCond}
          and bloqueado = false and cupo_reservado < cupo_total
        order by inicio asc`,
      params,
    );
    // Si no hay slots y tenemos sede, intentar generar en caliente usando horario_config
    if ((!rows || rows.length === 0) && codigo_sede) {
      try {
        const { rows: schedRows } = await query<any>(`select day_of_week, inicio_m1, fin_m1, inicio_m2, fin_m2, activo from agenda.horario_config`);
        const horario: Record<string, { inicio:string; fin:string }[]> = {};
        for (const r of schedRows) {
          const k = String(r.day_of_week);
          const arr: { inicio:string; fin:string }[] = [];
          if (r.inicio_m1 && r.fin_m1) arr.push({ inicio: String(r.inicio_m1).slice(0,5), fin: String(r.fin_m1).slice(0,5) });
          if (r.inicio_m2 && r.fin_m2) arr.push({ inicio: String(r.inicio_m2).slice(0,5), fin: String(r.fin_m2).slice(0,5) });
          if ((r.activo ?? true) && arr.length) horario[k] = arr; else horario[k] = [];
        }
        await this.generarSlots({ codigo_servicio, codigo_sede, desde, hasta, pasoMin: 30, cupo: 1, horario });
        const again = await query(
          `select slot_id, inicio, fin, cupo_total, cupo_reservado, bloqueado, codigo_sede
             from agenda.slot_disponible
            where codigo_servicio = $1
              and inicio >= greatest($2::timestamptz, $4::timestamptz)
              and fin <= least($3::timestamptz, $5::timestamptz)
              ${sedeCond}
              and bloqueado = false and cupo_reservado < cupo_total
            order by inicio asc`,
          params,
        );
        rows = again.rows;
      } catch {}
    }
    return { items: rows };
  }

  async crearCita(cedula: string, codigo_servicio: string, slot_id: number) {
    const client = await db.connect();
    try {
      await client.query('begin');
      const rs = await client.query<{ cupo_total: number; cupo_reservado: number; bloqueado: boolean; inicio: Date; codigo_servicio: string }>(
        `select cupo_total, cupo_reservado, bloqueado, inicio, codigo_servicio from agenda.slot_disponible where slot_id = $1 for update`,
        [slot_id],
      );
      const slot = rs.rows[0];
      if (!slot || slot.bloqueado || slot.cupo_reservado >= slot.cupo_total) {
        throw new BadRequestException('sin cupo');
      }
      if (slot.codigo_servicio !== codigo_servicio) throw new BadRequestException('servicio invÃ¡lido');
      if (new Date(slot.inicio) <= new Date()) throw new BadRequestException('no se puede agendar en fechas pasadas');
      const overlap = await client.query<{ c: number }>(
        `select count(*)::int as c
           from agenda.cita c
           join agenda.slot_disponible s on s.slot_id = c.slot_id
          where c.cedula = $1 and s.inicio = (select inicio from agenda.slot_disponible where slot_id = $2)`,
        [cedula, slot_id],
      );
      if ((overlap.rows[0]?.c ?? 0) > 0) throw new BadRequestException('ya tiene una cita en ese horario');
      const upd = await client.query(
        `update agenda.slot_disponible set cupo_reservado = cupo_reservado + 1 where slot_id = $1 and cupo_reservado < cupo_total returning slot_id`,
        [slot_id],
      );
      if (upd.rowCount !== 1) throw new BadRequestException('sin cupo');
      const created = await client.query<{ numero_cita: number }>(
        `insert into agenda.cita (cedula, codigo_servicio, slot_id, estado)
         values ($1,$2,$3,'CONFIRMADA')
         returning numero_cita`,
        [cedula, codigo_servicio, slot_id],
      );
      await client.query('commit');
      await this.audit.log({ cedula, modulo: 'AGENDA', accion: 'CREAR_CITA', referencia_clave: String(created.rows[0].numero_cita) });
      return { numero_cita: created.rows[0].numero_cita };
    } catch (e) {
      try { await client.query('rollback'); } catch {}
      throw e;
    } finally {
      client.release();
    }
  }

  async cancelarCita(cedula: string, numero_cita: number, motivo: string) {
    const cur = await query<{ inicio: Date }>(
      `select s.inicio from agenda.cita c join agenda.slot_disponible s on s.slot_id = c.slot_id where c.numero_cita = $1 and c.cedula = $2`,
      [numero_cita, cedula],
    );
    const row = cur.rows[0];
    if (!row) throw new BadRequestException('cita no encontrada');
    if (new Date(row.inicio) <= new Date()) throw new BadRequestException('no se puede cancelar una cita pasada');
    await query(
      `update agenda.cita set estado = 'CANCELADA', motivo_cancelacion = $1, updated_at = now() where numero_cita = $2 and cedula = $3`,
      [motivo, numero_cita, cedula],
    );
    await this.audit.log({ cedula, modulo: 'AGENDA', accion: 'CANCELAR_CITA', referencia_clave: String(numero_cita), descripcion: motivo });
    return { ok: true };
  }

  // Genera slots entre fechas con las siguientes reglas por defecto:
  // - Lunes a sÃ¡bado: 07:00â€“12:00 y 14:00â€“17:00 (descanso 12â€“14)
  // - Domingo: 07:00â€“12:00
  // - Ignora feriados (se podrÃ¡n bloquear luego)
  async generarSlots(params: { codigo_servicio: string; codigo_sede: string; desde: string; hasta: string; pasoMin: number; cupo: number; horario?: Record<string, { inicio:string; fin:string }[]> }){
    const { codigo_servicio, codigo_sede, desde, hasta, pasoMin, cupo, horario } = params;
    if (!codigo_servicio || !codigo_sede || !desde || !hasta) throw new Error('datos incompletos');
    // Asegurar que el servicio exista para no violar FK
    try {
      const { rows: svcRows } = await query<{ codigo_servicio:string }>(`select codigo_servicio from agenda.servicio where codigo_servicio = $1`, [codigo_servicio]);
      if (!svcRows[0]) {
        // Intentar obtener nombre desde catálogo si existe
        let nombre = codigo_servicio;
        let categoria = 'OTROS';
        try {
          const { rows: cat } = await query<any>(`select nombre, categoria from catalogo.servicio where codigo = $1 limit 1`, [codigo_servicio]);
          if (cat[0]) { nombre = cat[0].nombre || nombre; categoria = cat[0].categoria || categoria; }
        } catch {}
        await query(
          `insert into agenda.servicio (codigo_servicio, nombre_servicio, categoria, duracion_min, instrucciones_preparacion, activo)
           values ($1,$2,$3,$4,null,true)
           on conflict (codigo_servicio) do nothing`,
          [codigo_servicio, nombre, categoria, Math.max(15, Math.min(120, pasoMin || 30))],
        );
      }
    } catch {}
    const start = new Date(desde);
    const end = new Date(hasta);
    if (!(start < end)) throw new Error('rango invÃ¡lido');

    // feriados en el rango
    const { rows: fer } = await query<{ fecha: string }>(
      `select fecha::date as fecha from agenda.feriado where fecha between $1::date and $2::date`,
      [new Date(desde).toISOString().slice(0,10), new Date(hasta).toISOString().slice(0,10)],
    );
    const feriados = new Set(fer.map(f => f.fecha));

    const slots: { inicio: Date; fin: Date }[] = [];
    // Iterar en horario LOCAL para evitar desfases por zona horaria
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= endDay) {
      const dow = cursor.getDay(); // 0 domingo (local)
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const d = cursor.getDate();
      const yyyy_mm_dd = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (feriados.has(yyyy_mm_dd)) { cursor.setDate(cursor.getDate() + 1); continue; }
      const addRange = (h1:number, min1:number, h2:number, min2:number) => {
        const w = (h:number, mi:number) => new Date(y, m, d, h, mi, 0, 0);
        let a = w(h1, min1);
        const b = w(h2, min2);
        while (a < b) {
          const z = new Date(a.getTime() + pasoMin * 60000);
          if (z <= b) slots.push({ inicio: new Date(a), fin: new Date(z) });
          a = z;
        }
      };
      const ranges = horario && (horario[String(dow)] as any);
      if (Array.isArray(ranges) && ranges.length) {
        for (const r of ranges) {
          const parts1 = String(r.inicio || '0:0').split(':');
          const parts2 = String(r.fin || '0:0').split(':');
          const h1 = parseInt(parts1[0] || '0', 10), m1 = parseInt(parts1[1] || '0', 10);
          const h2 = parseInt(parts2[0] || '0', 10), m2 = parseInt(parts2[1] || '0', 10);
          if (isFinite(h1) && isFinite(m1) && isFinite(h2) && isFinite(m2)) addRange(h1, m1, h2, m2);
        }
      } else {
        if (dow === 0) { addRange(7, 0, 12, 0); } else { addRange(7, 0, 12, 0); addRange(14, 0, 17, 0); }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const s of slots) {
      await query(
        `insert into agenda.slot_disponible (codigo_servicio, codigo_sede, inicio, fin, cupo_total)
         select $1,$2,$3,$4,$5
         where not exists (
           select 1 from agenda.slot_disponible
            where codigo_servicio = $1 and codigo_sede = $2 and inicio = $3 and fin = $4
         )`,
        [codigo_servicio, codigo_sede, s.inicio, s.fin, cupo],
      );
    }
    return { ok: true, generados: slots.length };
  }

  async listarCitas(cedula: string) {
    const { rows } = await query<any>(
      `select c.numero_cita, c.codigo_servicio, c.estado, s.inicio, s.fin
         from agenda.cita c
         join agenda.slot_disponible s on s.slot_id = c.slot_id
        where c.cedula = $1
        order by c.created_at desc
        limit 100`,
      [cedula],
    );
    return { items: rows };
  }

  async reprogramarCita(cedula: string, numero_cita: number, nuevo_slot_id: number) {
    // obtener cita actual
    const { rows: cur } = await query<any>(`select slot_id from agenda.cita where numero_cita = $1 and cedula = $2`, [numero_cita, cedula]);
    const actual = cur[0];
    if (!actual) throw new BadRequestException('cita no encontrada');
    // validar nuevo slot
    const { rows: slotRows } = await query<any>(`select cupo_total, cupo_reservado, bloqueado, inicio from agenda.slot_disponible where slot_id = $1`, [nuevo_slot_id]);
    const slot = slotRows[0];
    if (!slot || slot.bloqueado || slot.cupo_reservado >= slot.cupo_total) throw new BadRequestException('sin cupo');
    if (new Date(slot.inicio) <= new Date()) throw new BadRequestException('no se puede reprogramar a fechas pasadas');
    const overlap = await query<{ c: number }>(
      `select count(*)::int as c
         from agenda.cita c
         join agenda.slot_disponible s on s.slot_id = c.slot_id
        where c.cedula = $1 and s.inicio = (select inicio from agenda.slot_disponible where slot_id = $2) and c.numero_cita <> $3`,
      [cedula, nuevo_slot_id, numero_cita],
    );
    if ((overlap.rows[0]?.c ?? 0) > 0) throw new BadRequestException('ya tiene una cita en ese horario');
    // actualizar reserva en transacciÃ³n: reservar nuevo, mover cita y liberar anterior
    const client = await db.connect();
    try {
      await client.query('begin');
      const upd = await client.query(
        `update agenda.slot_disponible set cupo_reservado = cupo_reservado + 1 where slot_id = $1 and cupo_reservado < cupo_total returning slot_id`,
        [nuevo_slot_id],
      );
      if (upd.rowCount !== 1) throw new BadRequestException('sin cupo');
      await client.query(`update agenda.cita set slot_id = $1, updated_at = now() where numero_cita = $2`, [nuevo_slot_id, numero_cita]);
      await client.query(`update agenda.slot_disponible set cupo_reservado = greatest(cupo_reservado - 1, 0) where slot_id = $1`, [actual.slot_id]);
      await client.query('commit');
      await this.audit.log({ cedula, modulo: 'AGENDA', accion: 'REPROGRAMAR_CITA', referencia_clave: String(numero_cita), descripcion: `slot ${actual.slot_id} -> ${nuevo_slot_id}` });
      return { ok: true };
    } catch (e) {
      try { await client.query('rollback'); } catch {}
      throw e;
    } finally {
      client.release();
    }
  }

  async listarCitasAdmin(desde?: string, hasta?: string) {
    const conds: string[] = [];
    const params: any[] = [];
    if (desde) { params.push(desde); conds.push(`s.inicio >= $${params.length}`); }
    if (hasta) { params.push(hasta); conds.push(`s.fin <= $${params.length}`); }
    const where = conds.length ? `where ${conds.join(' and ')}` : '';
    const { rows } = await query<any>(
      `select c.numero_cita, c.cedula, c.codigo_servicio, c.estado, s.inicio, s.fin,
               (u.nombres || ' ' || u.apellidos) as nombre_completo, u.email, u.telefono, s.codigo_sede as sede, c.observaciones
         from agenda.cita c
         join agenda.slot_disponible s on s.slot_id = c.slot_id
         join usuario.usuarios u on u.cedula = c.cedula
        ${where}
        order by c.created_at desc
        limit 300`,
      params,
    );
    return { items: rows };
  }

  // Admin: Crear nueva cita
  async crearCitaAdmin(data: {
    cedula: string;
    codigo_servicio: string;
    sede: string;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
    observaciones?: string;
    estado?: string;
  }) {
    const client = await db.connect();
    try {
      await client.query('begin');
      
      // Buscar o crear slot
      const { rows: slotRows } = await client.query<any>(
        `select slot_id, cupo_total, cupo_reservado, bloqueado 
         from agenda.slot_disponible 
         where codigo_servicio = $1 and codigo_sede = $2 and inicio = $3 and fin = $4
         for update`,
        [data.codigo_servicio, data.sede, data.fecha_hora_inicio, data.fecha_hora_fin]
      );
      
      let slot_id: number;
      if (slotRows.length > 0) {
        const slot = slotRows[0];
        if (slot.bloqueado) throw new BadRequestException('El slot estÃ¡ bloqueado');
        if (slot.cupo_reservado >= slot.cupo_total) throw new BadRequestException('Sin cupo disponible');
        slot_id = slot.slot_id;
        
        // Incrementar cupo reservado
        await client.query(
          `update agenda.slot_disponible set cupo_reservado = cupo_reservado + 1 where slot_id = $1`,
          [slot_id]
        );
      } else {
        // Crear nuevo slot
        const newSlot = await client.query<{ slot_id: number }>(
          `insert into agenda.slot_disponible (codigo_servicio, codigo_sede, inicio, fin, cupo_total, cupo_reservado)
           values ($1, $2, $3, $4, 1, 1)
           returning slot_id`,
          [data.codigo_servicio, data.sede, data.fecha_hora_inicio, data.fecha_hora_fin]
        );
        slot_id = newSlot.rows[0].slot_id;
      }
      
      // Crear cita
      const estado = data.estado || 'PENDIENTE';
      const created = await client.query<{ numero_cita: number }>(
        `insert into agenda.cita (cedula, codigo_servicio, slot_id, estado, observaciones)
         values ($1, $2, $3, $4, $5)
         returning numero_cita`,
        [data.cedula, data.codigo_servicio, slot_id, estado, data.observaciones || null]
      );
      
      await client.query('commit');
      await this.audit.log({ 
        cedula: data.cedula, 
        modulo: 'AGENDA', 
        accion: 'ADMIN_CREAR_CITA', 
        referencia_clave: String(created.rows[0].numero_cita),
        descripcion: `Cita creada por administrador`
      });
      
      return { numero_cita: created.rows[0].numero_cita };
    } catch (e) {
      try { await client.query('rollback'); } catch {}
      throw e;
    } finally {
      client.release();
    }
  }

  // Admin: Actualizar cita existente
  async actualizarCitaAdmin(numero_cita: number, data: {
    cedula?: string;
    codigo_servicio?: string;
    sede?: string;
    fecha_hora_inicio?: string;
    fecha_hora_fin?: string;
    observaciones?: string;
    estado?: string;
  }) {
    const client = await db.connect();
    try {
      await client.query('begin');
      
      // Obtener cita actual
      const { rows: currentRows } = await client.query<any>(
        `select c.*, s.codigo_servicio as current_servicio, s.codigo_sede as current_sede, 
                s.inicio as current_inicio, s.fin as current_fin
         from agenda.cita c
         join agenda.slot_disponible s on s.slot_id = c.slot_id
         where c.numero_cita = $1`,
        [numero_cita]
      );
      
      if (currentRows.length === 0) throw new BadRequestException('Cita no encontrada');
      const current = currentRows[0];
      
      // Si se cambia el horario o servicio, manejar el slot
      if (data.fecha_hora_inicio && data.fecha_hora_fin && 
          (data.fecha_hora_inicio !== current.current_inicio || 
           data.fecha_hora_fin !== current.current_fin ||
           data.codigo_servicio !== current.current_servicio ||
           data.sede !== current.current_sede)) {
        
        // Liberar slot anterior
        await client.query(
          `update agenda.slot_disponible set cupo_reservado = greatest(cupo_reservado - 1, 0) where slot_id = $1`,
          [current.slot_id]
        );
        
        // Buscar o crear nuevo slot
        const newServicio = data.codigo_servicio || current.current_servicio;
        const newSede = data.sede || current.current_sede;
        const newInicio = data.fecha_hora_inicio || current.current_inicio;
        const newFin = data.fecha_hora_fin || current.current_fin;
        
        const { rows: slotRows } = await client.query<any>(
          `select slot_id, cupo_total, cupo_reservado, bloqueado 
           from agenda.slot_disponible 
           where codigo_servicio = $1 and codigo_sede = $2 and inicio = $3 and fin = $4
           for update`,
          [newServicio, newSede, newInicio, newFin]
        );
        
        let new_slot_id: number;
        if (slotRows.length > 0) {
          const slot = slotRows[0];
          if (slot.bloqueado) throw new BadRequestException('El nuevo slot estÃ¡ bloqueado');
          if (slot.cupo_reservado >= slot.cupo_total) throw new BadRequestException('Sin cupo en el nuevo horario');
          new_slot_id = slot.slot_id;
          
          await client.query(
            `update agenda.slot_disponible set cupo_reservado = cupo_reservado + 1 where slot_id = $1`,
            [new_slot_id]
          );
        } else {
          const newSlot = await client.query<{ slot_id: number }>(
            `insert into agenda.slot_disponible (codigo_servicio, codigo_sede, inicio, fin, cupo_total, cupo_reservado)
             values ($1, $2, $3, $4, 1, 1)
             returning slot_id`,
            [newServicio, newSede, newInicio, newFin]
          );
          new_slot_id = newSlot.rows[0].slot_id;
        }
        
        current.slot_id = new_slot_id;
      }
      
      // Actualizar cita
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      if (data.cedula) { updates.push(`cedula = $${paramIndex++}`); params.push(data.cedula); }
      if (data.codigo_servicio) { updates.push(`codigo_servicio = $${paramIndex++}`); params.push(data.codigo_servicio); }
      if (data.estado) { updates.push(`estado = $${paramIndex++}`); params.push(data.estado); }
      if (data.observaciones !== undefined) { updates.push(`observaciones = $${paramIndex++}`); params.push(data.observaciones); }
      if (current.slot_id !== undefined) { updates.push(`slot_id = $${paramIndex++}`); params.push(current.slot_id); }
      
      updates.push(`updated_at = now()`);
      params.push(numero_cita);
      
      const result = await client.query(
        `update agenda.cita set ${updates.join(', ')} where numero_cita = $${paramIndex} returning numero_cita`,
        params
      );
      
      if (result.rowCount === 0) throw new BadRequestException('Cita no actualizada');
      
      await client.query('commit');
      await this.audit.log({ 
        cedula: data.cedula || current.cedula, 
        modulo: 'AGENDA', 
        accion: 'ADMIN_ACTUALIZAR_CITA', 
        referencia_clave: String(numero_cita),
        descripcion: `Cita actualizada por administrador`
      });
      
      return { ok: true };
    } catch (e) {
      try { await client.query('rollback'); } catch {}
      throw e;
    } finally {
      client.release();
    }
  }

  // Admin: Cancelar cita
  async cancelarCitaAdmin(numero_cita: number, motivo?: string) {
    const client = await db.connect();
    try {
      await client.query('begin');
      
      // Obtener cita actual
      const { rows } = await client.query<any>(
        `select c.cedula, c.estado, s.inicio, c.slot_id
         from agenda.cita c
         join agenda.slot_disponible s on s.slot_id = c.slot_id
         where c.numero_cita = $1`,
        [numero_cita]
      );
      
      if (rows.length === 0) throw new BadRequestException('Cita no encontrada');
      const cita = rows[0];
      
      if (cita.estado === 'CANCELADA') {
        return { ok: true, message: 'La cita ya estaba cancelada' };
      }
      
      // Actualizar estado
      await client.query(
        `update agenda.cita set estado = 'CANCELADA', motivo_cancelacion = $1, updated_at = now() where numero_cita = $2`,
        [motivo || 'Cancelada por administrador', numero_cita]
      );
      
      // Liberar slot
      await client.query(
        `update agenda.slot_disponible set cupo_reservado = greatest(cupo_reservado - 1, 0) where slot_id = $1`,
        [cita.slot_id]
      );
      
      await client.query('commit');
      await this.audit.log({ 
        cedula: cita.cedula, 
        modulo: 'AGENDA', 
        accion: 'ADMIN_CANCELAR_CITA', 
        referencia_clave: String(numero_cita),
        descripcion: motivo || 'Cancelada por administrador'
      });
      
      return { ok: true };
    } catch (e) {
      try { await client.query('rollback'); } catch {}
      throw e;
    } finally {
      client.release();
    }
  }

  // ==== Sedes ====
  async listSedes(){
    const { rows } = await query(`select codigo_sede, nombre_sede, direccion, created_at, updated_at from agenda.sede order by nombre_sede asc limit 500`);
    return { items: rows };
  }
  async upsertSede(body: { codigo_sede:string; nombre_sede:string; direccion?:string }){
    const codigo = (body.codigo_sede||'').trim().toUpperCase();
    const nombre = (body.nombre_sede||'').trim();
    if (!codigo || !nombre) throw new BadRequestException('datos invalidos');
    await query(
      `insert into agenda.sede (codigo_sede, nombre_sede, direccion)
       values ($1,$2,$3)
       on conflict (codigo_sede) do update set nombre_sede = excluded.nombre_sede, direccion = excluded.direccion, updated_at = now()`,
      [codigo, nombre, body.direccion ?? null],
    );
    return { ok:true };
  }
  async removeSede(codigo_sede: string){
    const { rows: dep } = await query<{ c:number }>(`select count(*)::int as c from agenda.slot_disponible where codigo_sede = $1`, [codigo_sede]);
    if ((dep[0]?.c ?? 0) > 0) throw new BadRequestException('no se puede eliminar; sede con slots existentes');
    await query(`delete from agenda.sede where codigo_sede = $1`, [codigo_sede]);
    return { ok:true };
  }

  // ==== Feriados ====
  async listFeriados(){
    const { rows } = await query(`select fecha, nombre, ambito from agenda.feriado order by fecha asc limit 1000`);
    return { items: rows };
  }
  async upsertFeriado(body: { fecha:string; nombre:string; ambito?:string }){
    const fecha = (body.fecha||'').slice(0,10);
    const nombre = (body.nombre||'').trim();
    const ambito = (body.ambito||'NACIONAL').trim().toUpperCase();
    if (!fecha || !nombre) throw new BadRequestException('datos invalidos');
    await query(
      `insert into agenda.feriado (fecha, nombre, ambito)
       values ($1,$2,$3)
       on conflict (fecha) do update set nombre = excluded.nombre, ambito = excluded.ambito`,
      [fecha, nombre, ambito],
    );
    return { ok:true };
  }
  async removeFeriado(fecha: string){
    await query(`delete from agenda.feriado where fecha = $1::date`, [fecha]);
    return { ok:true };
  }

  async getSchedule(){
    const { rows } = await query<any>(`select day_of_week, inicio_m1, fin_m1, inicio_m2, fin_m2, activo from agenda.horario_config order by day_of_week asc`);
    if (!rows.length){
      return { horario: {
        '0': [{ inicio:'07:00', fin:'12:00' }],
        '1': [{ inicio:'07:00', fin:'12:00' }, { inicio:'14:00', fin:'17:00' }],
        '2': [{ inicio:'07:00', fin:'12:00' }, { inicio:'14:00', fin:'17:00' }],
        '3': [{ inicio:'07:00', fin:'12:00' }, { inicio:'14:00', fin:'17:00' }],
        '4': [{ inicio:'07:00', fin:'12:00' }, { inicio:'14:00', fin:'17:00' }],
        '5': [{ inicio:'07:00', fin:'12:00' }, { inicio:'14:00', fin:'17:00' }],
        '6': [{ inicio:'07:00', fin:'12:00' }, { inicio:'14:00', fin:'17:00' }],
      }};
    }
    const out: Record<string, { inicio:string; fin:string }[]> = {};
    for(const r of rows){
      const k = String(r.day_of_week);
      const arr: { inicio:string; fin:string }[] = [];
      if (r.inicio_m1 && r.fin_m1) arr.push({ inicio: String(r.inicio_m1).slice(0,5), fin: String(r.fin_m1).slice(0,5) });
      if (r.inicio_m2 && r.fin_m2) arr.push({ inicio: String(r.inicio_m2).slice(0,5), fin: String(r.fin_m2).slice(0,5) });
      if ((r.activo ?? true) && arr.length) out[k] = arr; else out[k] = [];
    }
    return { horario: out };
  }

  async saveSchedule(adminCedula:string, horario: Record<string, { inicio:string; fin:string }[]>) {
    for(let dow=0; dow<=6; dow++){
      const key = String(dow);
      const arr = (horario && horario[key]) || [];
      const i1 = arr[0];
      const i2 = arr[1];
      await query(
        `insert into agenda.horario_config (day_of_week, inicio_m1, fin_m1, inicio_m2, fin_m2, activo)
         values ($1,$2::time,$3::time,$4::time,$5::time,$6)
         on conflict (day_of_week) do update set
           inicio_m1 = excluded.inicio_m1,
           fin_m1 = excluded.fin_m1,
           inicio_m2 = excluded.inicio_m2,
           fin_m2 = excluded.fin_m2,
           activo = excluded.activo,
           updated_at = now()`,
        [dow, i1?.inicio || null, i1?.fin || null, i2?.inicio || null, i2?.fin || null, arr.length > 0]
      );
    }
    await this.audit.log({ cedula: adminCedula, modulo:'AGENDA', accion:'ACTUALIZAR_HORARIO', descripcion:'Horario semanal actualizado' });
    return { ok:true };
  }
}
