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
      }catch{}
    };
    fetchCounts();
  }, [accessToken]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
      <KpiCard title="Completados" value={counts.done} accent="green" />
      <KpiCard title="En Proceso" value={counts.inProgress} accent="orange" />
      <KpiCard title="Total Análisis" value={counts.total} accent="blue" />
    </div>
  );
};

