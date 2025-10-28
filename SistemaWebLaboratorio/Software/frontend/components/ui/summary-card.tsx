import { ReactNode } from 'react';

export function SummaryCard({ title, value, detail, icon, color }:{
  title: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  color: 'red' | 'blue' | 'orange';
}){
  const borderCls = color === 'red' ? 'kpi-border-red' : color === 'blue' ? 'kpi-border-blue' : 'kpi-border-orange';
  return (
    <div className={`card ${borderCls}`} role="group" aria-label={title}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="subtitle" style={{ textTransform:'uppercase' }}>{title}</div>
          <div className="title" aria-live="polite">{value}</div>
          {detail && <div className="subtitle">{detail}</div>}
        </div>
        {icon}
      </div>
    </div>
  );
}

