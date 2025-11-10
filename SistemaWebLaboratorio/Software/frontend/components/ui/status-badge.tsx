import { StatusKind } from '../../app/design/tokens';

type Props = {
  status: StatusKind | string | undefined;
  size?: 'sm' | 'md';
  withDot?: boolean;
};

// Modern, flat+material hybrid status chip
export function StatusBadge({ status, size = 'md', withDot = true }: Props){
  // Normalizar posibles estados desde BD (mayúsculas/sinónimos)
  const s = String(status || '').toLowerCase();
  const norm: StatusKind =
    s === 'en_proceso' || s === 'en-proceso' ? 'en-proceso'
    : s === 'confirmada' || s === 'confirmado' ? 'confirmada'
    : s === 'completado' || s === 'completada' ? 'completado'
    : s === 'cancelado' || s === 'cancelada' ? 'cancelada'
    : s === 'finalizada' || s === 'finalizado' ? 'finalizada'
    : s === 'vencido' ? 'vencido'
    : s === 'pagado' ? 'pagado'
    : 'pendiente';

  const base = size === 'sm' ? 'badge badge--sm' : 'badge';

  const map: Record<StatusKind, { cls: string; label: string }> = {
    'completado': { cls: `${base} badge-success`, label: 'completado' },
    'en-proceso': { cls: `${base} badge-warning`, label: 'en proceso' },
    'pendiente': { cls: `${base} badge-warning`, label: 'pendiente' },
    'confirmada': { cls: `${base} badge-info`, label: 'confirmada' },
    'cancelada': { cls: `${base} badge-danger`, label: 'cancelada' },
    'finalizada': { cls: `${base} badge-info`, label: 'finalizada' },
    'vencido': { cls: `${base} badge-danger`, label: 'vencido' },
    'pagado': { cls: `${base} badge-success`, label: 'pagado' },
  };
  const cfg = map[norm];
  return (
    <span className={cfg.cls} aria-label={`estado: ${cfg.label}`}>
      {withDot && <span aria-hidden className="dot" />}
      {cfg.label}
    </span>
  );
}

