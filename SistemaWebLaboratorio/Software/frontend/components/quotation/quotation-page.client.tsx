"use client";
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useSessionStore } from '../../lib/session-store';
import { showToast } from '../../lib/toast-store';
import { useSearchParams } from 'next/navigation';
import { QuotationSelector, QuotationItem } from './quotation-selector.client';
import { QuotationSummary } from './quotation-summary';

export function QuotationPageClient({ items }: { items: QuotationItem[] }){
  const [selected, setSelected] = useState<QuotationItem[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const subtotal = selected.reduce((a, b) => a + b.precio, 0);
  const impuesto = subtotal * 0.12;
  const total = subtotal + impuesto;
  const { accessToken } = useSessionStore();
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const sp = useSearchParams();

  // Cargar cotización existente para editar (duplicar selección)
  useEffect(() => {
    const loadId = sp?.get('load');
    if (!loadId || !accessToken) return;
    (async () => {
      try{
        const q: any = await api(`/billing/quotes/${loadId}`, { method:'GET' }, accessToken);
        const map = new Map(items.map(i => [i.codigo_prueba, i]));
        const restored: QuotationItem[] = (q?.items||[]).map((it:any)=> map.get(it.codigo_prueba)).filter(Boolean) as QuotationItem[];
        if (restored.length){ setSelected(restored); setResetKey((k)=>k+1); showToast(`Cotización #${loadId} cargada`, { title:'Edición', variant:'info' }); }
      }catch{}
    })();
  }, [sp, accessToken, items]);
  const saveQuote = async () => {
    if (!accessToken) { showToast('Inicia sesion para guardar la cotizacion', { variant:'info', title:'Aviso' }); return; }
    if (!selected.length) return;
    try{
      setSaving(true);
      const payload = { items: selected.map(i=>({ codigo_prueba:i.codigo_prueba, nombre:i.nombre, precio:i.precio, cantidad:1 })), subtotal, impuesto, total };
      const res = await api<{ numero_cotizacion:number }>(`/billing/quotes`, { method:'POST', body: JSON.stringify(payload) }, accessToken);
      showToast(`Cotización #${res.numero_cotizacion} guardada`, { variant:'success', title:'Éxito' });
    }catch(e:any){ showToast(String(e?.message||'No se pudo guardar'), { variant:'error', title:'Error' }); }
    finally{ setSaving(false); }
  };
  async function exportPdf(){
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const line = (y:number, txt:string, bold=false) => { if (bold) doc.setFont('helvetica','bold'); else doc.setFont('helvetica','normal'); doc.text(txt, 14, y); };
    let y = 18;
    doc.setFontSize(16); line(y, 'Cotización de servicios de laboratorio', true); y += 10;
    doc.setFontSize(11); line(y, `Fecha: ${new Date().toLocaleString()}`); y += 8;
    line(y, `Ítems seleccionados (${selected.length})`); y += 8;
    for (const it of selected){
      const name = it.nombre.length > 64 ? it.nombre.slice(0,61) + '...' : it.nombre;
      line(y, `• ${name}`); doc.text(`$${it.precio.toFixed(2)}`, 180, y, { align:'right' }); y += 7;
      if (y > 270) { doc.addPage(); y = 18; }
    }
    y += 6; doc.line(14, y, 196, y); y += 8;
    line(y, `Subtotal: $${subtotal.toFixed(2)}`); y += 6;
    line(y, `IVA 12%: $${impuesto.toFixed(2)}`); y += 6;
    doc.setFont('helvetica','bold'); line(y, `Total: $${total.toFixed(2)}`); y += 10;
    doc.setFont('helvetica','normal'); doc.setFontSize(9); line(y, 'Precios sujetos a cambio sin previo aviso. Documento no fiscal.');
    doc.save(`cotizacion-${Date.now()}.pdf`);
  }

  const generateOfficial = async () => {
    if (!accessToken) { showToast('Inicia sesión para generar la cotización', { variant:'info', title:'Aviso' }); return; }
    if (!selected.length) return;
    try{
      setSaving(true);
      // 1) Guardar como borrador
      const payload = { items: selected.map(i=>({ codigo_prueba:i.codigo_prueba, nombre:i.nombre, precio:i.precio, cantidad:1 })), subtotal, impuesto, total };
      const res = await api<{ numero_cotizacion:number }>(`/billing/quotes`, { method:'POST', body: JSON.stringify(payload) }, accessToken);
      // 2) Marcar como FINAL
      await api(`/billing/quotes/${res.numero_cotizacion}`, { method:'PATCH', body: JSON.stringify({ estado:'FINAL', subtotal, impuesto, total }) }, accessToken);
      showToast(`Cotización #${res.numero_cotizacion} generada`, { variant:'success', title:'Éxito' });
      // 3) Descargar PDF simple
      await exportPdf();
    }catch(e:any){ showToast(String(e?.message||'No se pudo generar'), { variant:'error', title:'Error' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="row cols-2 mt-4">
      <QuotationSelector items={items} onChange={setSelected} resetKey={resetKey} />
      <QuotationSummary
        items={selected}
        subtotal={subtotal}
        impuesto={impuesto}
        total={total}
        count={selected.length}
        onGenerate={generateOfficial}
        onClear={() => { setSelected([]); setResetKey((k) => k + 1); }}
        onSave={saveQuote}
        saving={saving}
        scheduleHref={selected.length ? `/citas?svc=${encodeURIComponent(selected[0].codigo_prueba)}` : undefined}
      />
    </div>
  );
}
