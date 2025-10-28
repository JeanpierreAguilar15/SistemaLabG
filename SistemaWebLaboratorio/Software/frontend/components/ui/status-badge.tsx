import { tokens, StatusKind } from '../../app/design/tokens';

export function StatusBadge({ status }:{ status: StatusKind }){
  const map: Record<StatusKind, { cls: string; label: string }> = {
    'completado': { cls: 'badge badge-success', label: 'completado' },
    'en-proceso': { cls: 'badge badge-warning', label: 'en proceso' },
    'pendiente': { cls: 'badge badge-danger', label: 'pendiente' },
    'confirmada': { cls: 'badge badge-info', label: 'confirmada' },
    'vencido': { cls: 'badge badge-danger', label: 'vencido' },
    'pagado': { cls: 'badge badge-success', label: 'pagado' },
  };
  const cfg = map[status];
  return <span className={cfg.cls} aria-label={`estado: ${cfg.label}`}>{cfg.label}</span>;
}

