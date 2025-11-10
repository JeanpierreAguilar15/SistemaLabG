"use client";
import { useEffect, useState } from 'react';
import { KpiCard } from '../ui/kpi-card';
import { api } from '../../lib/api';
import { useSessionStore } from '../../lib/session-store';

type Row = { estado: 'EN_PROCESO' | 'COMPLETADO' };

export const ResultsKpis = () => {
  const { accessToken } = useSessionStore();
  const [counts, setCounts] = useState({ done: 0, inProgress: 0, total: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      if (!accessToken) return;
      try{
        const res = await api<{ items: Row[] }>(`/results`, { method: 'GET' }, accessToken);
        const done = res.items.filter(r => r.estado === 'COMPLETADO').length;
        const inProgress = res.items.filter(r => r.estado !== 'COMPLETADO').length;
        setCounts({ done, inProgress, total: res.items.length });
      }catch{/* ignore */}
    };
    fetchCounts();
  }, [accessToken]);

  return (
    <div className="portal-grid cols-3">
      <KpiCard variant="tile" title="Completados" value={counts.done} subtitle="Listos para descargar" accent="green" />
      <KpiCard variant="tile" title="En proceso" value={counts.inProgress} subtitle="Analisis en curso" accent="orange" />
      <KpiCard variant="tile" title="Total analisis" value={counts.total} subtitle="Historico registrado" accent="blue" />
    </div>
  );
};

