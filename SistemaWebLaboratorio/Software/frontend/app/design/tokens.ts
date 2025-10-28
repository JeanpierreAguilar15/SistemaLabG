export const tokens = {
  brand: {
    primary: 'var(--brand-primary)',
    secondary: 'var(--brand-secondary)',
  },
  surface: {
    page: 'var(--surface-page)',
    card: 'var(--surface-card)',
    border: 'var(--border-soft)',
  },
  text: {
    base: 'var(--text-main)',
    muted: 'var(--text-muted)',
    invert: 'var(--text-invert)'
  },
  state: {
    success: { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
    warning: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
    danger: { bg: 'var(--danger-bg)', fg: 'var(--danger-fg)' },
    info: { bg: 'var(--info-bg)', fg: 'var(--info-fg)' },
  },
  spacing: {
    s8: 'var(--space-8)',
    s16: 'var(--space-16)',
    s24: 'var(--space-24)',
    s32: 'var(--space-32)',
  },
} as const;

export type StatusKind = 'completado' | 'en-proceso' | 'pendiente' | 'confirmada' | 'vencido' | 'pagado';
