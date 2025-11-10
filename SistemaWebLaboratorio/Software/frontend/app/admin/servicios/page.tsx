"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';

type Svc = { codigo:string; nombre:string; precio:number; activo:boolean; categoria?:string };

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [items, setItems] = useState<Svc[]>([]);
  const [form, setForm] = useState<Svc>({ codigo:'', nombre:'', precio:0, activo:true, categoria:'OTROS' });

  const load = async () => {
    if(!accessToken) return;
    try {
      const res = await api<{items:Svc[]}>(`/catalog/services`, { method:'GET' }, accessToken);
      setItems(res.items || []);
    } catch(e:any){
      console.error('Error cargando servicios', e);
      setItems([]);
    }
  };

  useEffect(()=>{ load(); }, [accessToken]);

  const save = async () => {
    if(!accessToken) return;
    try {
      await api(`/catalog/services`, {
        method:'POST',
        body: JSON.stringify({ ...form, precio: Number(form.precio || 0) })
      }, accessToken);
      setForm({ codigo:'', nombre:'', precio:0, activo:true, categoria:'OTROS' });
      await load();
      alert('Guardado');
    } catch(e:any){
      alert(String(e?.message || 'No se pudo guardar'));
    }
  };

  if(!isAdmin) return <div className="card">Acceso denegado</div>;
  return (
    <section>
      <div className="card">
        <div className="heading-sm">Servicios y examenes</div>
        <div className="body-muted">Catalogo (crear/editar, activar/desactivar)</div>
        <div className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <label className="space-y-1"><span>Codigo</span><input placeholder="LAB_GLIC" value={form.codigo} onChange={(e)=>setForm({...form, codigo:(e.target.value||'').toUpperCase()})} /></label>
            <label className="space-y-1 md:col-span-2"><span>Nombre</span><input placeholder="Glucosa en sangre" value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} /></label>
            <label className="space-y-1"><span>Precio</span><input type="number" min={0} step={0.01} value={form.precio} onChange={(e)=>setForm({...form, precio:Number(e.target.value)})} /></label>
            <label className="space-y-1"><span>Categoria</span><input placeholder="BIOQUIMICA" value={form.categoria} onChange={(e)=>setForm({...form, categoria:(e.target.value||'').toUpperCase()})} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.activo} onChange={(e)=>setForm({...form, activo:e.target.checked})} /><span>Activo</span></label>
            <div className="md:col-span-6 text-right">
              <button className="icon" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="card mt-3">
        <table className="w-full border-collapse table-hover">
          <thead>
            <tr>
              <th className="p-2 text-left border-b border-border-soft">Codigo</th>
              <th className="p-2 text-left border-b border-border-soft">Nombre</th>
              <th className="p-2 text-left border-b border-border-soft">Precio</th>
              <th className="p-2 text-left border-b border-border-soft">Categoria</th>
              <th className="p-2 text-left border-b border-border-soft">Estado</th>
              <th className="p-2 text-left border-b border-border-soft">Accion</th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.codigo}>
                <td className="p-2 border-b border-border-soft">{s.codigo}</td>
                <td className="p-2 border-b border-border-soft">{s.nombre}</td>
                <td className="p-2 border-b border-border-soft">${Number((s as any).precio ?? 0).toFixed(2)}</td>
                <td className="p-2 border-b border-border-soft">{s.categoria || 'OTROS'}</td>
                <td className="p-2 border-b border-border-soft">{s.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="p-2 border-b border-border-soft">
                  <button
                    className="icon"
                    onClick={async()=>{
                      if(!accessToken) return;
                      await api(`/catalog/services`, {
                        method:'POST',
                        body: JSON.stringify({ ...s, activo: !s.activo })
                      }, accessToken);
                      await load();
                    }}>{s.activo ? 'Desactivar' : 'Activar'}</button>
                  <button
                    className="icon ml-2"
                    onClick={async()=>{
                      if(!accessToken) return;
                      if(!confirm('Eliminar servicio?')) return;
                      await api(`/catalog/services/${encodeURIComponent(s.codigo)}`, { method:'DELETE' }, accessToken);
                      await load();
                    }}>Eliminar</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="p-3 body-muted" colSpan={6}>Sin servicios aun. Agrega el primero arriba.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

