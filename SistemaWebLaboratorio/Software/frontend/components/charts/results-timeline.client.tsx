"use client";
import { useMemo } from 'react';
import { BeakerIcon, CheckCircleIcon } from '../ui/icons';

type ResultItem = {
  fecha_resultado: string | null;
  estado: 'EN_PROCESO' | 'COMPLETADO';
  codigo_prueba: string;
};

type Props = {
  items: ResultItem[];
};

export function ResultsTimeline({ items }: Props) {
  // Group results by month
  const monthlyData = useMemo(() => {
    const last6Months: Record<string, { completed: number; inProgress: number; month: string; year: number }> = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last6Months[key] = {
        completed: 0,
        inProgress: 0,
        month: date.toLocaleDateString('es', { month: 'short' }),
        year: date.getFullYear()
      };
    }

    items.forEach(item => {
      const date = item.fecha_resultado ? new Date(item.fecha_resultado) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (last6Months[key]) {
        if (item.estado === 'COMPLETADO') {
          last6Months[key].completed++;
        } else {
          last6Months[key].inProgress++;
        }
      }
    });

    return Object.values(last6Months);
  }, [items]);

  const maxValue = Math.max(...monthlyData.map(d => d.completed + d.inProgress), 1);

  return (
    <div className="panel">
      <div className="panel-heading">Historial de resultados</div>
      <div className="panel-sub mb-4">Ultimos 6 meses de actividad</div>

      {/* Chart */}
      <div className="space-y-3">
        {monthlyData.map((data, index) => {
          const total = data.completed + data.inProgress;
          const completedPercent = total > 0 ? (data.completed / maxValue) * 100 : 0;
          const inProgressPercent = total > 0 ? (data.inProgress / maxValue) * 100 : 0;

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-main)] capitalize min-w-[60px]">
                  {data.month} {data.year !== new Date().getFullYear() ? data.year : ''}
                </span>
                <span className="text-[var(--text-muted)]">
                  {total} {total === 1 ? 'resultado' : 'resultados'}
                </span>
              </div>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden bg-[var(--surface-base)]">
                {/* Completed bar */}
                {data.completed > 0 && (
                  <div
                    className="bg-[var(--accent-success)] flex items-center justify-center transition-all duration-300 hover:opacity-80"
                    style={{ width: `${completedPercent}%` }}
                    title={`${data.completed} completado${data.completed !== 1 ? 's' : ''}`}
                  >
                    {data.completed > 0 && (
                      <span className="text-xs font-bold text-white">{data.completed}</span>
                    )}
                  </div>
                )}
                {/* In Progress bar */}
                {data.inProgress > 0 && (
                  <div
                    className="bg-[var(--accent-warning)] flex items-center justify-center transition-all duration-300 hover:opacity-80"
                    style={{ width: `${inProgressPercent}%` }}
                    title={`${data.inProgress} en proceso`}
                  >
                    {data.inProgress > 0 && (
                      <span className="text-xs font-bold text-white">{data.inProgress}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-[var(--border-soft)] flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--accent-success)]"></div>
          <span className="text-[var(--text-secondary)]">Completados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--accent-warning)]"></div>
          <span className="text-[var(--text-secondary)]">En proceso</span>
        </div>
      </div>
    </div>
  );
}
