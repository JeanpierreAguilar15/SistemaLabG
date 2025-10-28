"use client";
import type { QuotationItem } from './quotation-selector.client';

type Props = {
  items: QuotationItem[];
  subtotal: number;
  impuesto: number;
  total: number;
  count: number;
  onGenerate: () => void;
  onClear: () => void;
};

function money(n: number){
  try { return n.toLocaleString('es-EC', { style:'currency', currency:'USD' }); } catch { return `$${n.toFixed(2)}`; }
}

export function QuotationSummary({ items, subtotal, impuesto, total, count, onGenerate, onClear }: Props){
  return (
    <aside className="card" aria-label="resumen de cotización">
      <div className="flex items-center justify-between">
        <h3 className="title">Resumen de Cotización</h3>
        <span className="text-sm text-[var(--text-muted)]">{count} análisis seleccionado{count!==1?'s':''}</span>
      </div>
      {items.length > 0 && (
        <ul className="mt-2" aria-label="análisis seleccionados" style={{ listStyle:'none', padding:0, margin:0 }}>
          {items.map((i) => (
            <li key={i.codigo_prueba} className="flex items-center justify-between py-1 text-sm">
              <span className="text-[var(--text-main)]">{i.nombre}</span>
              <span className="font-medium">{money(i.precio)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 border-t border-[var(--border-soft)] pt-3">
        <div className="flex items-center justify-between text-sm"><span className="text-[var(--text-muted)]">Subtotal</span><span className="font-medium">{money(subtotal)}</span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-[var(--text-muted)]">IVA (12%)</span><span className="font-medium">{money(impuesto)}</span></div>
        <div className="flex items-center justify-between mt-2"><span className="title">Total</span><span className="text-[color:var(--brand-secondary)] text-xl font-semibold">{money(total)}</span></div>
      </div>
      <div className="mt-3">
        <button className="w-full inline-flex items-center justify-center rounded-md bg-[var(--brand-secondary)] text-white px-3 py-2 text-sm font-medium" onClick={onGenerate} disabled={!items.length}>Generar Cotización</button>
        <button className="w-full mt-2 inline-flex items-center justify-center rounded-md border border-[var(--border-soft)] bg-white px-3 py-2 text-sm" onClick={onClear} disabled={!items.length}>Limpiar Selección</button>
      </div>
      <div className="subtitle mt-3">
        Información importante:
        <ul className="ml-4 list-disc">
          <li>Los precios son por análisis individual</li>
          <li>Precios sujetos a cambio sin previo aviso</li>
          <li>Resultados disponibles en 24–48 horas</li>
          <li>Algunos análisis requieren ayuno previo</li>
        </ul>
      </div>
    </aside>
  );
}
