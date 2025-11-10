import { Header } from '../components/header';
import { QuotationItem } from '../../../components/quotation/quotation-selector.client';
import { Suspense } from 'react';
import { QuotationPageClient } from '../../../components/quotation/quotation-page.client';
import { QuoteHistory } from '../../../components/quotation/quote-history.client';
import { fallbackCatalog } from './fallback';

async function getItems(): Promise<QuotationItem[]>{
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try{
    const res = await fetch(`${base}/catalog/public/services`, { cache:'no-store' });
    const data = await res.json();
    const items = (data.items || []).map((s:any)=>({ codigo_prueba: s.codigo, nombre: s.nombre, precio: Number(s.precio||0), categoria: s.categoria || 'OTROS' }));
    if (items.length > 0) return items;
  }catch{}
  return fallbackCatalog;
}

export default async function Page(){
  const items = await getItems();
  return (
    <section aria-label="cotizaciones" className="space-y-5">
      <Header
        meta="Cotizaciones"
        title="Genera tu cotizacion"
        subtitle="Selecciona los analisis que necesitas y obtiene un estimado al instante"
      />
      <div className="portal-grid cols-3">
        <div className="panel hoverable">
          <div className="panel-heading">1. Selecciona examenes</div>
          <div className="panel-sub">Agrupa tus analisis favoritos por categoria.</div>
        </div>
        <div className="panel hoverable">
          <div className="panel-heading">2. Revisa el resumen</div>
          <div className="panel-sub">Verifica precios, impuestos y totales antes de guardar.</div>
        </div>
        <div className="panel hoverable">
          <div className="panel-heading">3. Guarda o agenda</div>
          <div className="panel-sub">Convierte la cotizacion en cita o factura oficial.</div>
        </div>
      </div>
      <Suspense fallback={<div className="panel mt-2">Cargando...</div>}>
        <div className="panel">
          <QuotationPageClient items={items} />
        </div>
      </Suspense>
      <QuoteHistory />
    </section>
  );
}
