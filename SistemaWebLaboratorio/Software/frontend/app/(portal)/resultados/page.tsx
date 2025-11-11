"use client";
import { useEffect, useState } from 'react';
import { Header } from '../components/header';
import { ResultsSection } from '../../../components/data/results.client';
import { ResultsKpis } from '../../../components/data/results-kpis.client';
import { ResultsTimeline } from '../../../components/charts/results-timeline.client';
import { Button } from '../../../components/ui/button';
import { DownloadIcon, ShareIcon, BeakerIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { api } from '../../../lib/api';
import { useSessionStore } from '../../../lib/session-store';

type ResultItem = {
  codigo_resultado: number;
  codigo_prueba: string;
  id_muestra: string;
  estado: 'EN_PROCESO' | 'COMPLETADO';
  fecha_resultado: string | null;
};

export default function Page(){
  const { accessToken } = useSessionStore();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!accessToken) return;
      try {
        const res = await api<{ items: ResultItem[] }>('/results', { method: 'GET' }, accessToken);
        setResults(res.items || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  return (
    <section aria-label="resultados" className="space-y-6">
      <Header
        meta="Servicios"
        title="Resultados de analisis"
        subtitle="Visualiza, descarga y comparte tus informes clinicos"
        actions={
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => location.href = '/citas'}>
              <BeakerIcon className="w-4 h-4" />
              Solicitar nuevas pruebas
            </Button>
            <Button variant="outline" onClick={() => location.href = '/historial'}>
              Ver historial completo
            </Button>
          </div>
        }
      />

      <ResultsKpis />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results List - 2 columns */}
        <div className="lg:col-span-2">
          <ResultsSection />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Timeline Chart */}
          {!loading && <ResultsTimeline items={results} />}

          {/* Quick Actions */}
          <div className="panel">
            <div className="panel-heading">Acciones rapidas</div>
            <div className="panel-sub mb-4">Gestiona tus resultados facilmente</div>

            <div className="space-y-3">
              <button
                onClick={() => alert('Funcionalidad en desarrollo')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-soft)] bg-white hover:bg-[var(--surface-hover)] hover:border-[var(--brand-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#DBEAFE] transition-colors">
                    <DownloadIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-main)] text-sm">Descargar todos</div>
                    <div className="text-xs text-[var(--text-muted)]">Exportar historial completo</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
              </button>

              <button
                onClick={() => alert('Funcionalidad en desarrollo')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-soft)] bg-white hover:bg-[var(--surface-hover)] hover:border-[var(--brand-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center group-hover:bg-[#DCFCE7] transition-colors">
                    <ShareIcon className="w-5 h-5 text-[var(--accent-success)]" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-main)] text-sm">Compartir con medico</div>
                    <div className="text-xs text-[var(--text-muted)]">Enviar por correo electronico</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
              </button>

              <button
                onClick={() => location.href = '/citas'}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-soft)] bg-white hover:bg-[var(--surface-hover)] hover:border-[var(--brand-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center group-hover:bg-[#D1FAE5] transition-colors">
                    <BeakerIcon className="w-5 h-5 text-[var(--accent-success)]" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-main)] text-sm">Solicitar nuevas pruebas</div>
                    <div className="text-xs text-[var(--text-muted)]">Agendar cita para analisis</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="panel bg-[#F0F6FF] border-[#BFDBFE]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[var(--text-main)] mb-1">
                  Interpretacion de resultados
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Los resultados deben ser interpretados por un profesional medico. Si tienes dudas, consulta con tu doctor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
