import { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle: string;
  meta?: string;
  actions?: ReactNode;
};

export function Header({ title, subtitle, meta, actions }: Props){
  return (
    <header className="page-hero" aria-label="encabezado de seccion">
      <div className="page-hero__text">
        {meta && <p className="page-hero__meta">{meta}</p>}
        <h1 className="page-hero__title">{title}</h1>
        <p className="page-hero__subtitle">{subtitle}</p>
      </div>
      {actions && <div className="page-hero__actions">{actions}</div>}
    </header>
  );
}
