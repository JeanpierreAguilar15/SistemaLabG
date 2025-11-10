"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast-store';
import { StatusBadge } from '../ui/status-badge';
import { Button } from '../ui/button';

type Quote = { numero_cotizacion:number; estado:string; total:number|string|null; created_at:string };

const sections = [
  { key:'BORRADOR', title:'Pendientes', empty:'No tienes cotizaciones en borrador.' },
  { key:'FINAL', title:'Finalizadas', empty:'No hay cotizaciones finalizadas.' },
] as const;

export function QuoteHistory(){
  const { accessToken } = useSessionStore();
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const grouped = useMemo(()=> sections.map(section => ({
    ...section,
    items: items.filter(q => String(q.estado).toUpperCase() === section.key),
  })), [items]);

  const load = async() => {
    if(!accessToken) { setItems([]); return; }
    setLoading(true);
    try{
      const r = await api<{items:Quote[]}>(`/billing/quotes`, { method:'GET' }, accessToken);
      setItems(r.items || []);
    }catch{/* ignore */}
    finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); }, [accessToken]);

  const eliminar = async(id:number)=>{ if(!accessToken) return; if(!confirm('Eliminar cotizacion?')) return; await api(`/billing/quotes/${id}`, { method:'DELETE' }, accessToken); showToast('Cotizacion eliminada', { variant:'success' }); await load(); };
  const finalizar = async(id:number)=>{ if(!accessToken) return; await api(`/billing/quotes/${id}`, { method:'PATCH', body: JSON.stringify({ estado:'FINAL' }) }, accessToken); showToast('Cotizacion finalizada', { variant:'success' }); await load(); };
  const convertirFactura = async(id:number)=>{ if(!accessToken) return; if(!confirm('Convertir esta cotizacion a factura?')) return; try{ const r = await api<{ok:boolean; numero_factura?:number; message?:string}>(`/billing/quotes/${id}/convert-to-invoice`, { method:'POST' }, accessToken); if(r.ok){ showToast(`Factura #${r.numero_factura} creada`, { variant:'success' }); await load(); } else { showToast(r.message || 'Error al convertir', { variant:'error' }); } }catch(e:any){ showToast(e?.message||'Error al convertir', { variant:'error' }); } };
  const statusLabel = (estado:string) => {
    const value = String(estado).toUpperCase();
    if (value === 'FINAL') return 'finalizada';
    if (value === 'BORRADOR') return 'pendiente';
    return estado.toLowerCase();
  };

  const formatDate = (iso:string) => {
    const date = new Date(iso);
    return {
      date: date.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' }),
      time: date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    };
  };

  return (
    <div className="panel mt-4">
      <div className="panel-heading">Cotizaciones guardadas</div>
      <div className="panel-sub">Visualiza tus borradores y propuestas finalizadas.</div>
      {loading ? (
        <div className="agenda-empty mt-3">Cargando...</div>
      ) : (
        <div className="space-y-6 mt-4">
          {grouped.map(({ key, title, empty, items: list }) => (
            <section key={key}>
              <div className="quote-section__header">{title}</div>
              {list.length ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border-collapse table-hover">
                    <thead>
                      <tr>
                        <th className="p-2 text-left border-b border-border-soft">#</th>
                        <th className="p-2 text-left border-b border-border-soft">Fecha</th>
                        <th className="p-2 text-left border-b border-border-soft">Estado</th>
                        <th className="p-2 text-left border-b border-border-soft">Total</th>
                        <th className="p-2 text-right border-b border-border-soft">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(q => {
                        const { date, time } = formatDate(q.created_at);
                        const isPending = key === 'BORRADOR';
                        return (
                          <tr key={q.numero_cotizacion}>
                            <td className="p-2 border-b border-border-soft">{q.numero_cotizacion}</td>
                            <td className="p-2 border-b border-border-soft">
                              <div className="quote-date">
                                <span className="quote-date__main">{date}</span>
                                <span className="quote-date__sub">{time}</span>
                              </div>
                            </td>
                            <td className="p-2 border-b border-border-soft"><StatusBadge status={statusLabel(q.estado)} size="sm" /></td>
                            <td className="p-2 border-b border-border-soft">${Number(q.total ?? 0).toFixed(2)}</td>
                            <td className="p-2 border-b border-border-soft text-right">
                              <div className="quote-actions">
                                {isPending ? (
                                  <>
                                    <Button type="button" size="sm" variant="brand" onClick={()=>finalizar(q.numero_cotizacion)}>Finalizar</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={()=>{ location.href = `/cotizaciones?load=${q.numero_cotizacion}`; }}>Editar</Button>
                                    <Button type="button" size="sm" variant="danger" onClick={()=>eliminar(q.numero_cotizacion)}>Eliminar</Button>
                                  </>
                                ) : (
                                  <>
                                    <Button type="button" size="sm" variant="brand" onClick={()=>convertirFactura(q.numero_cotizacion)}>Convertir a factura</Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={()=>{ location.href = `/cotizaciones?load=${q.numero_cotizacion}`; }}>Ver</Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="agenda-empty mt-3">{empty}</div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
