"use client";
import { StatusBadge } from '../ui/status-badge';
import { api } from '../../lib/api';
import { useSessionStore } from '../../lib/session-store';

type Item = { titulo: string; fecha: string; estado: 'completado' | 'en-proceso'; codigo_resultado?: number };

export function RecentResults({ items }:{ items: Item[] }){
  const { accessToken } = useSessionStore();
  const handleOpenPdf = async (codigo_resultado?: number) => {
    if (!codigo_resultado || !accessToken) return;
    try{
      const { url } = await api<{ url: string | null }>(`/results/pdf`, { method:'POST', body: JSON.stringify({ codigo_resultado }) }, accessToken);
      if (!url) return alert('PDF no disponible.');
      window.open(url, '_blank', 'noopener');
    }catch{
      alert('No fue posible abrir el PDF.');
    }
  };
  return (
    <div className="card">
      <div className="heading-sm">Resultados Recientes</div>
      <div className="body-muted">Historial de analisis clinicos</div>
      <div className="mt-3 space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-md border border-[var(--border-soft)] bg-white p-3">
            <div>
              <div className="font-medium">{it.titulo}</div>
              <div className="body-muted">{it.fecha}</div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={it.estado} />
              <button className="icon" aria-label="Ver PDF" onClick={() => handleOpenPdf(it.codigo_resultado)}>Ver PDF</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

