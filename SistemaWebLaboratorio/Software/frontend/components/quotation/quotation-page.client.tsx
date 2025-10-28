"use client";
import { useState } from 'react';
import { QuotationSelector, QuotationItem } from './quotation-selector.client';
import { QuotationSummary } from './quotation-summary';

export function QuotationPageClient({ items }: { items: QuotationItem[] }){
  const [selected, setSelected] = useState<QuotationItem[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const subtotal = selected.reduce((a, b) => a + b.precio, 0);
  const impuesto = subtotal * 0.12;
  const total = subtotal + impuesto;
  return (
    <div className="row cols-2 mt-4">
      <QuotationSelector items={items} onChange={setSelected} resetKey={resetKey} />
      <QuotationSummary
        items={selected}
        subtotal={subtotal}
        impuesto={impuesto}
        total={total}
        count={selected.length}
        onGenerate={() => {
          // TODO: pedir generación al backend, crear versión y registrar auditoría
          alert('Generación de cotización: integración de backend pendiente.');
        }}
        onClear={() => { setSelected([]); setResetKey((k) => k + 1); }}
      />
    </div>
  );
}
