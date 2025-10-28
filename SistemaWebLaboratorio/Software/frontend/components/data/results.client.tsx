"use client";
import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleFetch = async () => {
      if (!accessToken) { setLoading(false); setError('Inicia sesión para ver resultados.'); return; }
      try {
        setLoading(true);
        const res = await api<{ items: ResultRow[] }>(`/results`, { method: 'GET' }, accessToken);
        setItems(res.items || []);
      } catch (e) {
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

  const handleDownload = (codigo_resultado: number) => handleView(codigo_resultado);

  if (loading) return <div className="card" aria-busy="true">Cargando resultados…</div>;
  if (error) return <div className="card text-[color:var(--danger-fg)]">{error}</div>;
  if (!items.length) return <div className="card">Aún no tienes resultados registrados.</div>;

  return (
    <ResultsTable items={items} onView={handleView} onDownload={handleDownload} />
  );
};

