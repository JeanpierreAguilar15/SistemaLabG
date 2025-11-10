import { ReactNode } from 'react';

export function SummaryCard({ title, value, detail, icon, color }:{
  title: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  color: 'red' | 'blue' | 'orange';
}){
  const badge = color === 'red' ? 'kpi-badge red' : color === 'blue' ? 'kpi-badge blue' : 'kpi-badge orange';
  return (
    <div className={`card hoverable relative`} role="group" aria-label={title}>
      {icon && <div className={badge}>{icon}</div>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="subtitle" style={{ textTransform:'uppercase' }}>{title}</div>
          <div className="title" aria-live="polite">{value}</div>
          {detail && <div className="subtitle">{detail}</div>}
        </div>
      </div>
    </div>
  );
}
