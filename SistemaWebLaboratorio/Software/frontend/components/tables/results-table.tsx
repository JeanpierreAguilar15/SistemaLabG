"use client";
import { StatusBadge } from '../ui/status-badge';
import type { StatusKind } from '../../app/design/tokens';

export type ResultItem = {
  codigo_resultado: number;
  codigo_prueba: string;
  id_muestra: string;
  estado: 'EN_PROCESO' | 'COMPLETADO';
  fecha_resultado: string | null;
};

type Props = {
  items: ResultItem[];
  onView?: (codigo_resultado: number) => void;
  onDownload?: (codigo_resultado: number) => void;
};

export function ResultsTable({ items, onView, onDownload }: Props){
  const toStatus = (e: ResultItem['estado']): StatusKind => (e === 'COMPLETADO' ? 'completado' : 'en-proceso');
  return (
    <div className="card" role="region" aria-label="resultados">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">ID Resultado</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Analisis</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Fecha</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">ID Muestra</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Estado</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.codigo_resultado} className="align-top">
              <td className="border-b border-border-soft p-2">{r.codigo_resultado}</td>
              <td className="border-b border-border-soft p-2">{r.codigo_prueba}</td>
              <td className="border-b border-border-soft p-2">{r.fecha_resultado ?? '-'}</td>
              <td className="border-b border-border-soft p-2">{r.id_muestra}</td>
              <td className="border-b border-border-soft p-2"><StatusBadge status={toStatus(r.estado)} /></td>
              <td className="border-b border-border-soft p-2">
                <div className="flex gap-2">
                  <button className="icon" aria-label="Ver resultado" onClick={() => onView?.(r.codigo_resultado)}>Ver</button>
                  <button className="icon" aria-label="Descargar PDF" onClick={() => onDownload?.(r.codigo_resultado)}>Descargar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

