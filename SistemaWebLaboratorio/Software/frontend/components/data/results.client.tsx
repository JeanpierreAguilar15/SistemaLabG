"use client";
import { useEffect, useMemo, useState } from 'react';
import { ResultsTable } from '../tables/results-table';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast-store';

type ResultRow = {
  codigo_resultado: number;
  codigo_prueba: string;
  id_muestra: string;
  estado: 'EN_PROCESO' | 'COMPLETADO';
  fecha_resultado: string | null;
};

export const ResultsSection = () => {
  const { accessToken } = useSessionStore();
  const [items, setItems] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all'|'done'|'progress'>('all');

  useEffect(() => {
    const handleFetch = async () => {
      if (!accessToken) { setLoading(false); setError('Inicia sesion para ver resultados.'); return; }
      try {
        setLoading(true);
        const res = await api<{ items: ResultRow[] }>(`/results`, { method: 'GET' }, accessToken);
        setItems(res.items || []);
        setError(null);
      } catch {
        setError('No se pudieron cargar los resultados.');
      } finally {
        setLoading(false);
      }
    };
    handleFetch();
  }, [accessToken]);

  const handleView = async (codigo_resultado: number) => {
    if (!accessToken) return;
    try {
      const { url } = await api<{ url: string | null }>(`/results/pdf`, {
        method: 'POST',
        body: JSON.stringify({ codigo_resultado }),
      }, accessToken);
      if (!url) { showToast('PDF no disponible', { title:'Aviso', variant:'info' }); return; }
      window.open(url, '_blank', 'noopener');
    } catch {
      showToast('No fue posible obtener el PDF.', { title:'Error', variant:'error' });
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === 'done') return items.filter(item => item.estado === 'COMPLETADO');
    if (filter === 'progress') return items.filter(item => item.estado !== 'COMPLETADO');
    return items;
  }, [items, filter]);

  if (loading) return <div className="panel" aria-busy="true">Cargando resultados...</div>;
  if (error) return <div className="panel text-[color:var(--danger-fg)]">{error}</div>;

  return (
    <div className="panel" role="region" aria-label="historial de resultados">
      <div className="panel-heading">Resultados de laboratorio</div>
      <div className="panel-sub">Consulta tus ultimos analisis y descarga los informes oficiales.</div>
      <div className="panel-toolbar mt-4">
        <div className="filter-chips">
          <button className={`chip ${filter==='all'?'chip-active':''}`} onClick={()=>setFilter('all')}>
            Todos ({items.length})
          </button>
          <button className={`chip ${filter==='done'?'chip-active':''}`} onClick={()=>setFilter('done')}>
            Completados ({items.filter(i=>i.estado==='COMPLETADO').length})
          </button>
          <button className={`chip ${filter==='progress'?'chip-active':''}`} onClick={()=>setFilter('progress')}>
            En proceso ({items.filter(i=>i.estado!=='COMPLETADO').length})
          </button>
        </div>
        <div className="filter-meta">{filteredItems.length} coincidencia(s)</div>
      </div>
      {filteredItems.length ? (
        <div className="mt-3 overflow-auto">
          <ResultsTable items={filteredItems} onView={handleView} onDownload={handleView} />
        </div>
      ) : (
        <div className="agenda-empty mt-3">No hay resultados para este filtro.</div>
      )}
      {!items.length && !loading && (
        <div className="agenda-empty mt-3">Aun no tienes resultados registrados.</div>
      )}
    </div>
  );
};

