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
  return (
    <div className="card" role="group" aria-label="selección de análisis">
      <div style={{ display:'grid', gap:'.5rem' }}>
        {items.map((i) => {
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
    </div>
  );
}
