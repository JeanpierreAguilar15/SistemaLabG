import { ReactNode } from 'react';

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: 'red' | 'blue' | 'orange' | 'green';
  icon?: ReactNode;
  action?: ReactNode;
};

export function KpiCard({ title, value, subtitle, accent = 'blue', icon, action }: Props){
  const accentMap = {
    red: 'border-l-4 border-[var(--brand-primary)]',
    blue: 'border-l-4 border-[var(--brand-secondary)]',
    orange: 'border-l-4 border-[#ea580c]',
    green: 'border-l-4 border-[#10b981]',
  } as const;
  return (
    <div className={`card ${accentMap[accent]} relative`}>
      {icon && <div className="absolute right-3 top-3 text-[var(--text-muted)]">{icon}</div>}
      <div className="heading-sm">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {subtitle && <div className="body-muted mt-1">{subtitle}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

