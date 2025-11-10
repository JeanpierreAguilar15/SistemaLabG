"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { QuotationSelector, QuotationItem } from '../../../components/quotation/quotation-selector.client';

type Row = { numero_cotizacion:number; cedula:string; estado:string; total:number; created_at:string };

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [items, setItems] = useState<Row[]>([]);

  const load = async () => {
    if(!isAdmin || !accessToken) return;
    const r = await api<{items:Row[]}>(`/billing/admin/quotes`, { method:'GET' }, accessToken);
    setItems(r.items||[]);
  };
  useEffect(()=>{ load(); }, [isAdmin, accessToken]);
  if(!isAdmin) return <div className="card">acceso denegado</div>;

  const [open, setOpen] = useState(false);
  const [cedula, setCedula] = useState('');
  const [catalog, setCatalog] = useState<QuotationItem[]>([]);
  const [sel, setSel] = useState<QuotationItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!accessToken) return;
        const r: any = await api(`/catalog/services`, { method: 'GET' }, accessToken);
        setCatalog(((r.items||[]) as any[]).map((s:any)=>({ codigo_prueba: s.codigo, nombre: s.nombre, precio: Number(s.precio||0), categoria: s.categoria })));
      } catch {}
    })();
  }, [accessToken]);

  const subtotal = useMemo(()=> sel.reduce((a,b)=> a + b.precio, 0), [sel]);
  const impuesto = useMemo(()=> subtotal * 0.12, [subtotal]);
  const total = useMemo(()=> subtotal + impuesto, [subtotal, impuesto]);

  const create = async () => {
    if (!accessToken) return;
    if (!cedula.trim() || sel.length===0) { alert('Cedula y al menos un item'); return; }
    try{
      setSaving(true);
      const payload = { cedula: cedula.trim(), items: sel.map(i=>({ codigo_prueba:i.codigo_prueba, nombre:i.nombre, precio:i.precio, cantidad:1 })), subtotal, impuesto, total };
      await api(`/billing/admin/quotes`, { method:'POST', body: JSON.stringify(payload) }, accessToken);
      setOpen(false);
      setSel([]);
      setCedula('');
      await load();
    }catch(e:any){
      alert(String(e?.message||'No se pudo crear la cotización'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id:number) => {
    if(!accessToken) return;
    if(!confirm('Eliminar cotización?')) return;
    try{
      await api(`/billing/admin/quotes/${id}`, { method:'DELETE' }, accessToken);
      await load();
    }catch(e:any){
      alert(String(e?.message||'No se pudo eliminar'));
    }
  };

  const convertToInvoice = async (id:number) => {
    if(!accessToken) return;
    if(!confirm('¿Convertir esta cotización a factura?')) return;
    try{
      const result = await api<{ok:boolean; numero_factura?:number; message?:string}>(`/billing/admin/quotes/${id}/convert-to-invoice`, { method:'POST' }, accessToken);
      if(result.ok) {
        alert(`Factura #${result.numero_factura} creada exitosamente`);
        await load();
      } else {
        alert(result.message || 'Error al convertir cotización');
      }
    }catch(e:any){
      alert(String(e?.message||'No se pudo convertir'));
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="heading-sm">Cotizaciones</div>
        <Button onClick={()=>setOpen(true)}>+ Nueva</Button>
      </div>
      <div className="card">
        <table className="w-full border-collapse table-hover mt-2">
          <thead><tr><th className="p-2 text-left border-b border-border-soft">#</th><th className="p-2 text-left border-b border-border-soft">Cédula</th><th className="p-2 text-left border-b border-border-soft">Estado</th><th className="p-2 text-left border-b border-border-soft">Total</th><th className="p-2 text-left border-b border-border-soft">Fecha</th><th className="p-2 text-left border-b border-border-soft">Acción</th></tr></thead>
          <tbody>
            {items.map(q => (
              <tr key={q.numero_cotizacion}>
                <td className="p-2 border-b border-border-soft">{q.numero_cotizacion}</td>
                <td className="p-2 border-b border-border-soft">{q.cedula}</td>
                <td className="p-2 border-b border-border-soft">{q.estado}</td>
                <td className="p-2 border-b border-border-soft">${(q.total||0).toFixed(2)}</td>
                <td className="p-2 border-b border-border-soft">{new Date(q.created_at).toLocaleString()}</td>
                <td className="p-2 border-b border-border-soft space-x-2">
                  {q.estado !== 'FINAL' && (
                    <Button variant="ghost" size="sm" onClick={()=>remove(q.numero_cotizacion)}>Eliminar</Button>
                  )}
                  {(q.estado === 'FINAL' || q.estado === 'BORRADOR') && (
                    <Button size="sm" onClick={()=>convertToInvoice(q.numero_cotizacion)}>Convertir a Factura</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="Nueva Cotización">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Cédula del paciente</label>
            <input className="w-full border border-[var(--border-soft)] rounded-md p-2" value={cedula} onChange={(e)=>setCedula(e.target.value)} placeholder="0102030405" />
          </div>
          <QuotationSelector items={catalog} onChange={setSel} />
          <div className="flex items-center justify-between">
            <div className="subtitle">Subtotal: ${subtotal.toFixed(2)} · IVA: ${impuesto.toFixed(2)} · Total: ${total.toFixed(2)}</div>
            <Button onClick={create} disabled={saving || !cedula.trim() || !sel.length}>{saving? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

