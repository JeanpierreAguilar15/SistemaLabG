"use client";
import React, { useEffect, useState } from 'react';

export type QuotationItem = { codigo_prueba: string; nombre: string; precio: number; categoria?: string };

export function QuotationSelector({ items, onChange, resetKey }:{ items: QuotationItem[]; onChange:(selected: QuotationItem[])=>void; resetKey?: number }){
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => {
    const next = { ...selected, [id]: !selected[id] };
    setSelected(next);
    onChange(items.filter((i) => next[i.codigo_prueba]));
  };
  useEffect(() => { setSelected({}); onChange([]); }, [resetKey, onChange]);
  const groups = items.reduce<Record<string, QuotationItem[]>>((acc, it)=>{
    const cat = (it.categoria || 'OTROS').toUpperCase();
    if (cat === 'OTROS') return acc; // Ocultar por ahora categoría 'OTROS'
    (acc[cat] ||= []).push(it);
    return acc;
  }, {});
  const order = Object.keys(groups).sort();
  return (
    <div className="card" role="group" aria-label="selección de análisis">
      <div className="grid gap-3">
        {order.map(cat => (
          <section key={cat} aria-label={cat} className="border border-[var(--border-soft)] rounded-md p-2">
            <div className="heading-sm mb-1">{cat}</div>
            <div className="grid gap-2">
              {groups[cat].map((i) => {
                const isSel = !!selected[i.codigo_prueba];
                return (
                  <label key={i.codigo_prueba} className={`selectable ${isSel ? 'selected' : ''}`}>
                    <span style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
                      <input aria-label={`seleccionar ${i.nombre}`} type="checkbox" checked={isSel} onChange={() => toggle(i.codigo_prueba)} />
                      <span>{i.nombre}</span>
                    </span>
                    <span>${i.precio.toFixed(2)}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        {/* Se oculta 'Otros exámenes' por ahora */}
      </div>
    </div>
  );
}

function Otros({ onAdd }:{ onAdd:(it:{ nombre:string; precio:number })=>void }){
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<string>('');
  return (
    <div className="mt-2">
      <div className="heading-sm">Otros exámenes</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
        <input placeholder="Nombre del examen" value={nombre} onChange={(e)=>setNombre(e.target.value)} />
        <input placeholder="Precio" type="number" value={precio} onChange={(e)=>setPrecio(e.target.value)} />
        <button className="icon" onClick={()=>{ const p = Number(precio); if(!nombre.trim() || isNaN(p) || p<0) return; onAdd({ nombre: nombre.trim(), precio: p }); setNombre(''); setPrecio(''); }}>Agregar</button>
      </div>
    </div>
  );
}
