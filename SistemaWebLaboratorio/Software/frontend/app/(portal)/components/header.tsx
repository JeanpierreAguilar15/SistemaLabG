export function Header({ title, subtitle }: { title: string; subtitle: string }){
  return (
    <header className="card" aria-label="encabezado de sección">
      <h1 className="heading-lg">{title}</h1>
      <p className="body-muted">{subtitle}</p>
    </header>
  );
}

