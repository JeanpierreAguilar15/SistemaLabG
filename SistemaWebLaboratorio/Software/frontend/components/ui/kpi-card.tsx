import { ReactNode } from 'react';

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: 'red' | 'blue' | 'orange' | 'green';
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'tile';
  trend?: { delta: number; label?: string };
};

export function KpiCard({ title, value, subtitle, accent = 'blue', icon, action, className = '', variant = 'default', trend }: Props){
  const badgeClass = {
    red: 'kpi-badge red',
    blue: 'kpi-badge blue',
    orange: 'kpi-badge orange',
    green: 'kpi-badge green',
  } as const;
  if (variant === 'tile'){
    const iconCircle = {
      red: 'kpi-icon red',
      blue: 'kpi-icon blue',
      orange: 'kpi-icon orange',
      green: 'kpi-icon green',
    } as const;
    return (
      <div className={`card hoverable kpi-tile ${className}`}>
        {icon && <div className={iconCircle[accent]}>{icon}</div>}
        <div className="kpi-stack">
          <div className="kpi-value">{value}</div>
          <div className="kpi-title">{title}</div>
          {subtitle && <div className="kpi-sub">{subtitle}</div>}
          {typeof trend?.delta === 'number' && (
            <div className={`kpi-trend ${trend.delta >= 0 ? 'up' : 'down'}`}>
              <span className="arrow" aria-hidden>{trend.delta >= 0 ? '▲' : '▼'}</span>
              <span>{Math.abs(trend.delta).toFixed(1)}%</span>
              {trend.label && <span className="muted">{trend.label}</span>}
            </div>
          )}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    );
  }
  // default
  return (
    <div className={`card hoverable relative min-h-[120px] ${className}`}>
      {icon && <div className={badgeClass[accent]}>{icon}</div>}
      <div className="heading-sm pr-12">{title}</div>
      <div className="mt-2 text-2xl font-semibold pr-12">{value}</div>
      {subtitle && <div className="body-muted mt-1">{subtitle}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
