"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { MonthCalendar } from '../../../components/appointments/month-calendar';

type Sede = { codigo_sede:string; nombre_sede:string; direccion?:string };
type Feriado = { fecha:string; nombre:string; ambito:string };
type Servicio = { codigo_servicio:string; nombre_servicio:string; categoria?:string };
type Slot = { slot_id:number; inicio:string; fin:string; cupo_total:number; cupo_reservado:number; codigo_sede:string };
type Horario = Record<string, { inicio:string; fin:string }[]>;

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [svc, setSvc] = useState('');
  const [sede, setSede] = useState('');
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');
  const [paso, setPaso] = useState<number>(30);
  const [cupo, setCupo] = useState<number>(1);
  const [statusGen, setStatusGen] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [horario, setHorario] = useState<Horario>({});
  const [month, setMonth] = useState<Date>(()=> new Date());

  // Formularios
  const [formSede, setFormSede] = useState<Sede>({ codigo_sede:'', nombre_sede:'', direccion:'' });
  const [formFeriado, setFormFeriado] = useState<Feriado>({ fecha:'', nombre:'', ambito:'NACIONAL' });

  const ready = !!accessToken && isAdmin;

  const loadAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    try{
      const [rSedes, rFeriados, rServicios, rHorario] = await Promise.all([
        api<{ items:Sede[] }>(`/appointments/admin/sedes`, { method:'GET' }, accessToken),
        api<{ items:Feriado[] }>(`/appointments/admin/feriados`, { method:'GET' }, accessToken),
        api<any>(`/catalog/services`, { method:'GET' }, accessToken),
        api<{ horario: Horario }>(`/appointments/admin/schedule`, { method:'GET' }, accessToken),
      ]);
      setSedes(rSedes.items||[]);
      setFeriados(rFeriados.items||[]);
      const svcItems = Array.isArray((rServicios as any)?.items) ? (rServicios as any).items : (Array.isArray(rServicios) ? rServicios : []);
      const mapped: Servicio[] = (svcItems as any[]).map((s:any)=>({ codigo_servicio: s.codigo_servicio || s.codigo, nombre_servicio: s.nombre_servicio || s.nombre, categoria: s.categoria || 'OTROS' }));
      setServicios(mapped);
      setHorario(rHorario?.horario || {});
      if (!svc && mapped.length > 0) setSvc(mapped[0].codigo_servicio);
      if (!sede && (rSedes.items?.length||0) > 0) setSede(rSedes.items![0].codigo_sede);
    }catch(e){ /* no-op */ }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ if (ready) loadAll(); }, [ready]);

  const consultar = async () => {
    if (!accessToken || !svc || !sede || !desde || !hasta) return;
    try{
      const r = await api<{ items: Slot[] }>(`/appointments/disponibilidad?codigo_servicio=${encodeURIComponent(svc)}&codigo_sede=${encodeURIComponent(sede)}&desde=${new Date(desde).toISOString()}&hasta=${new Date(hasta).toISOString()}`, { method:'GET' }, accessToken);
      setSlots(r.items||[]);
      try{ const d = new Date(desde); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }catch{}
    }catch(e:any){ setStatusGen(String(e?.message||'Error consultando disponibilidad')); }
  };

  const generar = async () => {
    if (!accessToken || !svc || !sede || !desde || !hasta) { setStatusGen('Completa servicio, sede y rango de fechas'); return; }
    try{
      setStatusGen('Generando...');
      const body = { codigo_servicio: svc, codigo_sede: sede, desde: new Date(desde).toISOString(), hasta: new Date(hasta).toISOString(), paso_min: paso, cupo, horario } as any;
      const res = await api<{ ok:boolean; generados:number }>(`/appointments/generar-slots`, { method:'POST', body: JSON.stringify(body) }, accessToken);
      setStatusGen(`Generados: ${res.generados ?? 0}`);
      await consultar();
    }catch(e:any){ setStatusGen(String(e?.message||'Error generando slots')); }
  };

  const saveHorario = async () => {
    if (!accessToken) return;
    await api(`/appointments/admin/schedule`, { method:'PUT', body: JSON.stringify({ horario }) }, accessToken);
    alert('Horario guardado');
  };

  // CRUD sedes
  const saveSede = async () => {
    if (!accessToken) return;
    try{
      await api(`/appointments/admin/sedes`, { method:'POST', body: JSON.stringify(formSede) }, accessToken);
      setFormSede({ codigo_sede:'', nombre_sede:'', direccion:'' });
      await loadAll();
    }catch(e:any){ alert(String(e?.message||'Error guardando sede')); }
  };
  const removeSede = async (codigo:string) => {
    if (!accessToken) return; if (!confirm('Eliminar sede?')) return;
    try{ await api(`/appointments/admin/sedes/${encodeURIComponent(codigo)}`, { method:'DELETE' }, accessToken); await loadAll(); }
    catch(e:any){ alert(String(e?.message||'No se pudo eliminar')); }
  };

  // CRUD feriados
  const saveFeriado = async () => {
    if (!accessToken) return;
    try{
      await api(`/appointments/admin/feriados`, { method:'POST', body: JSON.stringify(formFeriado) }, accessToken);
      setFormFeriado({ fecha:'', nombre:'', ambito:'NACIONAL' });
      await loadAll();
    }catch(e:any){ alert(String(e?.message||'Error guardando feriado')); }
  };
  const removeFeriado = async (fecha:string) => {
    if (!accessToken) return; if (!confirm('Eliminar feriado?')) return;
    try{ await api(`/appointments/admin/feriados/${encodeURIComponent(fecha)}`, { method:'DELETE' }, accessToken); await loadAll(); }
    catch(e:any){ alert(String(e?.message||'No se pudo eliminar')); }
  };

  // Métricas simples
  const slotsCount = slots.length;
  const ocupacion = useMemo(()=>{
    const total = slots.reduce((a,s)=> a + s.cupo_total, 0);
    const reservado = slots.reduce((a,s)=> a + s.cupo_reservado, 0);
    return { total, reservado };
  }, [slots]);

  const availableByDay = useMemo(()=>{
    const map: Record<string, number> = {};
    for (const s of slots){
      const d = new Date(s.inicio);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      map[key] = (map[key]||0) + 1;
    }
    return map;
  }, [slots]);

  return (
    <section className="space-y-4">
      {!isAdmin && (<div className="card">Acceso denegado</div>)}
      {loading && (<div className="card">Cargando...</div>)}

      <div className="card">
        <div className="heading-sm">Horario Semanal</div>
        <div className="body-muted">Define rangos por dia (hasta dos por dia). Vacio = sin atencion.</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Dom','Lun','Mar','Mie','Jue','Vie','Sab'].map((name, idx)=>{
            const key = String(idx);
            const arr = horario[key] || [];
            const a = arr[0] || { inicio:'', fin:'' };
            const b = arr[1] || { inicio:'', fin:'' };
            const setArr = (i:number, field:'inicio'|'fin', val:string) => {
              const next = [...(horario[key]||[{inicio:'',fin:''},{inicio:'',fin:''}])];
              next[i] = { ...next[i], [field]: val } as any;
              const cleaned = next.filter(x => (x?.inicio||'') && (x?.fin||''));
              setHorario({ ...horario, [key]: cleaned });
            };
            return (
              <div key={key} className="border border-[var(--border-soft)] rounded-md p-2">
                <div className="subtitle mb-1">{name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">A:</span>
                    <input type="time" value={a.inicio} onChange={(e)=>setArr(0,'inicio',e.target.value)} />
                    <span>-</span>
                    <input type="time" value={a.fin} onChange={(e)=>setArr(0,'fin',e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">B:</span>
                    <input type="time" value={b.inicio} onChange={(e)=>setArr(1,'inicio',e.target.value)} />
                    <span>-</span>
                    <input type="time" value={b.fin} onChange={(e)=>setArr(1,'fin',e.target.value)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Button variant="outline" onClick={saveHorario}>Guardar Horario</Button>
        </div>
      </div>

      <div className="card">
        <div className="heading-sm">Cupos y Horarios</div>
        <div className="body-muted">Configura servicio, sede y rango; genera slots e incluye feriados.</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-3 items-end">
          <Select label="Servicio" value={svc} onChange={(e)=>setSvc(e.target.value)}>
            <option value="">Selecciona</option>
            {servicios.map(s => <option key={s.codigo_servicio} value={s.codigo_servicio}>{s.nombre_servicio}</option>)}
          </Select>
          <Select label="Sede" value={sede} onChange={(e)=>setSede(e.target.value)}>
            <option value="">Selecciona</option>
            {sedes.map(x => <option key={x.codigo_sede} value={x.codigo_sede}>{x.nombre_sede}</option>)}
          </Select>
          <Input label="Desde" type="date" value={desde} placeholder="dd/mm/aaaa" onChange={(e)=>setDesde(e.target.value)} />
          <Input label="Hasta" type="date" value={hasta} placeholder="dd/mm/aaaa" onChange={(e)=>setHasta(e.target.value)} />
          <Input label="Paso (min)" type="number" value={String(paso)} onChange={(e)=>setPaso(parseInt(e.target.value||'30'))} />
          <Input label="Cupo por slot" type="number" value={String(cupo)} onChange={(e)=>setCupo(parseInt(e.target.value||'1'))} />
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Button onClick={generar} disabled={!svc||!sede||!desde||!hasta}>{statusGen || 'Generar slots'}</Button>
          <Button variant="outline" onClick={consultar}>Consultar disponibilidad</Button>
          <div className="subtitle">Slots: {slotsCount} | Reservados: {ocupacion.reservado}/{ocupacion.total}</div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-[var(--border-soft)] p-3 bg-white">
            <div className="heading-sm">Previsualización (mes)</div>
            <MonthCalendar
              currentMonth={month}
              availableByDay={availableByDay}
              selectedDate={null}
              onSelect={()=>{}}
              onPrev={()=> setMonth(m=> new Date(m.getFullYear(), m.getMonth()-1, 1))}
              onNext={()=> setMonth(m=> new Date(m.getFullYear(), m.getMonth()+1, 1))}
            />
          </div>
          <div className="rounded-md border border-[var(--border-soft)] p-3 bg-white overflow-auto">
            <div className="heading-sm">Slots consultados</div>
            <table className="w-full border-collapse table-hover mt-2 text-sm">
              <thead><tr><th className="p-2 text-left border-b border-border-soft">Fecha</th><th className="p-2 text-left border-b border-border-soft">Inicio</th><th className="p-2 text-left border-b border-border-soft">Fin</th><th className="p-2 text-left border-b border-border-soft">Cupo</th><th className="p-2 text-left border-b border-border-soft">Reservados</th></tr></thead>
              <tbody>
                {slots.slice(0,200).map(s=>{
                  const d = new Date(s.inicio);
                  const f = new Date(s.fin);
                  return (
                    <tr key={s.slot_id}>
                      <td className="p-2 border-b border-border-soft">{d.toLocaleDateString()}</td>
                      <td className="p-2 border-b border-border-soft">{d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="p-2 border-b border-border-soft">{f.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="p-2 border-b border-border-soft">{s.cupo_total}</td>
                      <td className="p-2 border-b border-border-soft">{s.cupo_reservado}</td>
                    </tr>
                  );
                })}
                {!slots.length && (
                  <tr><td className="p-2 body-muted" colSpan={5}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="heading-sm">Sedes</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
          <Input label="Código" placeholder="UNICA" value={formSede.codigo_sede} onChange={(e)=>setFormSede({ ...formSede, codigo_sede: e.target.value })} />
          <Input label="Nombre" placeholder="Sede Central" value={formSede.nombre_sede} onChange={(e)=>setFormSede({ ...formSede, nombre_sede: e.target.value })} />
          <Input label="Dirección" placeholder="Av. Siempre Viva 123" value={formSede.direccion} onChange={(e)=>setFormSede({ ...formSede, direccion: e.target.value })} />
        </div>
        <div className="mt-3"><Button onClick={saveSede}>Guardar Sede</Button></div>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse table-hover">
            <thead><tr><th className="p-2 text-left border-b border-border-soft">Codigo</th><th className="p-2 text-left border-b border-border-soft">Nombre</th><th className="p-2 text-left border-b border-border-soft">Direccion</th><th className="p-2 text-left border-b border-border-soft">Accion</th></tr></thead>
            <tbody>
              {sedes.map(s => (
                <tr key={s.codigo_sede}>
                  <td className="p-2 border-b border-border-soft">{s.codigo_sede}</td>
                  <td className="p-2 border-b border-border-soft">{s.nombre_sede}</td>
                  <td className="p-2 border-b border-border-soft">{s.direccion}</td>
                  <td className="p-2 border-b border-border-soft">
                    <Button variant="outline" size="sm" onClick={()=>setFormSede({ ...s })}>Editar</Button>
                    <Button variant="ghost" size="sm" className="ml-2" onClick={()=>removeSede(s.codigo_sede)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="heading-sm">Feriados</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
          <Input label="Fecha" type="date" placeholder="dd/mm/aaaa" value={formFeriado.fecha} onChange={(e)=>setFormFeriado({ ...formFeriado, fecha:e.target.value })} />
          <Input label="Nombre" placeholder="Feriado Nacional" value={formFeriado.nombre} onChange={(e)=>setFormFeriado({ ...formFeriado, nombre:e.target.value })} />
          <Select label="Ámbito" value={formFeriado.ambito} onChange={(e)=>setFormFeriado({ ...formFeriado, ambito:e.target.value })}>
            <option value="NACIONAL">NACIONAL</option>
            <option value="LOCAL">LOCAL</option>
          </Select>
        </div>
        <div className="mt-3"><Button onClick={saveFeriado}>Guardar Feriado</Button></div>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse table-hover">
            <thead><tr><th className="p-2 text-left border-b border-border-soft">Fecha</th><th className="p-2 text-left border-b border-border-soft">Nombre</th><th className="p-2 text-left border-b border-border-soft">Ambito</th><th className="p-2 text-left border-b border-border-soft">Accion</th></tr></thead>
            <tbody>
              {feriados.map(f => (
                <tr key={f.fecha}>
                  <td className="p-2 border-b border-border-soft">{f.fecha}</td>
                  <td className="p-2 border-b border-border-soft">{f.nombre}</td>
                  <td className="p-2 border-b border-border-soft">{f.ambito}</td>
                  <td className="p-2 border-b border-border-soft">
                    <Button variant="ghost" size="sm" className="ml-2" onClick={()=>removeFeriado(f.fecha)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
