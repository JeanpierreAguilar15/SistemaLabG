"use client";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/header";
import { api } from "../../../lib/api";
import { useSessionStore } from "../../../lib/session-store";
import { StatusBadge } from "../../../components/ui/status-badge";

type Cita = { numero_cita:number; codigo_servicio:string; estado:string; created_at:string };
type Pago = { numero_factura:number; estado:string; monto_total:number; fecha_emision:string };

export default function Page(){
  const { accessToken } = useSessionStore();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'todo'|'citas'|'pagos'>('todo');
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try{
      const data = await api<{ citas:Cita[]; pagos:Pago[] }>(`/profile/history`, { method:'GET' }, accessToken);
      setCitas(data.citas || []);
      setPagos(data.pagos || []);
    }finally{ setLoading(false); }
  };

  useEffect(()=>{ load(); }, [accessToken]);

  const filtered = useMemo(() => {
    const inRange = (d: string) => {
      if (!desde && !hasta) return true;
      const x = new Date(d).toISOString();
      if (desde && x < new Date(desde).toISOString()) return false;
      if (hasta) {
        const end = new Date(hasta);
        end.setHours(23,59,59,999);
        if (x > end.toISOString()) return false;
      }
      return true;
    };
    const eventos: { tipo:'CITA'|'PAGO'; fecha:string; titulo:string; detalle:string; link:string; estado?:string }[] = [];
    if (type === 'todo' || type === 'citas') {
      for (const c of citas) if (inRange(c.created_at)) eventos.push({
        tipo: 'CITA',
        fecha: c.created_at,
        titulo: `Cita #${c.numero_cita}`,
        detalle: `${c.codigo_servicio}`,
        link: '/citas',
        estado: c.estado,
      });
    }
    if (type === 'todo' || type === 'pagos') {
      for (const p of pagos) if (inRange(p.fecha_emision)) eventos.push({
        tipo: 'PAGO',
        fecha: p.fecha_emision,
        titulo: `Factura #${p.numero_factura}`,
        detalle: new Intl.NumberFormat('es-EC',{ style:'currency', currency:'USD' }).format(Number(p.monto_total||0)),
        link: '/pagos',
        estado: p.estado,
      });
    }
    return eventos.sort((a,b)=> new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [citas, pagos, desde, hasta, type]);

  return (
    <section aria-label="historial" className="space-y-5">
      <Header title="Historial" subtitle="Movimientos recientes: citas y pagos" meta="Registro" />
      <div className="panel">
        <div className="panel-heading">Filtrar eventos</div>
        <div className="filter-bar mt-3">
          <label className="space-y-1"><span>Tipo</span>
            <select value={type} onChange={(e)=>setType(e.target.value as any)}>
              <option value="todo">Todo</option>
              <option value="citas">Citas</option>
              <option value="pagos">Pagos</option>
            </select>
          </label>
          <label className="space-y-1"><span>Desde</span>
            <input type="date" value={desde} onChange={(e)=>setDesde(e.target.value)} />
          </label>
          <label className="space-y-1"><span>Hasta</span>
            <input type="date" value={hasta} onChange={(e)=>setHasta(e.target.value)} />
          </label>
          <div>
            <button className="primary w-full" onClick={load}>Actualizar</button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">Eventos</div>
        {loading ? (
          <div className="panel-sub">Cargando...</div>
        ) : filtered.length ? (
          <ul className="data-list mt-3">
            {filtered.map((e, idx) => (
              <li key={idx} className="data-list__item">
                <div>
                  <div className="data-list__title">{e.titulo}</div>
                  <div className="data-list__meta">{new Date(e.fecha).toLocaleString()}  {e.detalle}</div>
                </div>
                <div className="flex items-center gap-3">
                  {e.estado && <StatusBadge status={e.estado as any} />}
                  <a className="btn-link" href={e.link}>Ver</a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="panel-sub">No hay eventos para el filtro aplicado.</div>
        )}
      </div>
    </section>
  );
}
