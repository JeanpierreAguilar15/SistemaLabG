"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';

type EventRow = { evento_id:number; fecha_evento:string; cedula:string; modulo:string; accion:string; referencia_clave:string|null; descripcion:string|null };

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [cedula, setCedula] = useState('');
  const [items, setItems] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (filter?: string) => {
    if(!isAdmin || !accessToken) return;
    setLoading(true);
    const qs = filter ? `?cedula=${encodeURIComponent(filter)}` : '';
    const res = await api<{ items: EventRow[] }>(`/audit/events${qs}`, { method:'GET' }, accessToken);
    setItems(res.items || []);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [isAdmin, accessToken]);

  if(!isAdmin) return <div className="card">Acceso denegado</div>;
  return (
    <section>
      <div className="card">
        <div className="heading-sm">Auditoría</div>
        <div className="mt-2 flex items-center gap-2">
          <input value={cedula} onChange={(e)=>setCedula(e.target.value)} placeholder="Filtrar por cédula" className="w-60" />
          <button className="icon" onClick={()=>load(cedula || undefined)}>Filtrar</button>
          <a className="icon" href={`/api/audit/events.csv${cedula ? `?cedula=${encodeURIComponent(cedula)}` : ''}`} target="_blank" rel="noreferrer">Descargar CSV</a>
        </div>
      </div>
      <div className="card mt-3">
        {loading ? 'Cargando…' : (
          <table className="w-full border-collapse table-hover">
            <thead>
              <tr>
                <th className="p-2 text-left border-b border-border-soft">Fecha</th>
                <th className="p-2 text-left border-b border-border-soft">Cédula</th>
                <th className="p-2 text-left border-b border-border-soft">Módulo</th>
                <th className="p-2 text-left border-b border-border-soft">Acción</th>
                <th className="p-2 text-left border-b border-border-soft">Referencia</th>
                <th className="p-2 text-left border-b border-border-soft">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {items.map(ev => (
                <tr key={ev.evento_id}>
                  <td className="p-2 border-b border-border-soft whitespace-nowrap">{new Date(ev.fecha_evento).toLocaleString()}</td>
                  <td className="p-2 border-b border-border-soft">{ev.cedula}</td>
                  <td className="p-2 border-b border-border-soft">{ev.modulo}</td>
                  <td className="p-2 border-b border-border-soft">{ev.accion}</td>
                  <td className="p-2 border-b border-border-soft">{ev.referencia_clave ?? '-'}</td>
                  <td className="p-2 border-b border-border-soft">{ev.descripcion ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
