"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSessionStore } from '../../lib/session-store';
import { HomeIcon, CalendarIcon, FileIcon, ReceiptIcon, CreditCardIcon, UserIcon, LogoutIcon } from './icons';

type Item = {
  href: string;
  label: string;
  icon: (props:{ className?: string }) => JSX.Element;
  hint?: string;
};

const items: Item[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon, hint: 'Resumen personal' },
  { href: '/citas', label: 'Citas', icon: CalendarIcon, hint: 'Agenda y confirmaciones' },
  { href: '/resultados', label: 'Resultados', icon: FileIcon, hint: 'Historial clinico' },
  { href: '/cotizaciones', label: 'Cotizaciones', icon: ReceiptIcon, hint: 'Solicitudes' },
  { href: '/pagos', label: 'Pagos', icon: CreditCardIcon, hint: 'Facturas y recibos' },
  { href: '/perfil', label: 'Perfil', icon: UserIcon, hint: 'Datos personales' },
];

export function SidebarNav(){
  const pathname = usePathname();
  const { clear } = useSessionStore();

  const handleLogout = () => {
    clear();
    location.href = '/login';
  };

  return (
    <nav aria-label="secciones" className="sidebar-nav sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden>LF</div>
        <div className="sidebar-brand-meta">
          <span>Portal</span>
          <strong>Laboratorio</strong>
        </div>
      </div>
      <ul style={{ listStyle:'none', padding:0, margin:0 }}>
        {items.map(({ href, label, icon: Icon, hint }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link className={`nav-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} href={href}>
                <Icon className="w-4 h-4" />
                <div className="nav-link__content">
                  <span className="nav-link__label">{label}</span>
                  {hint && <span className="nav-link__hint">{hint}</span>}
                </div>
              </Link>
            </li>
          );
        })}
        <li className="mt-1">
          <button onClick={handleLogout} className="nav-link w-full text-left" aria-label="Cerrar sesion">
            <LogoutIcon className="w-4 h-4" />
            <div className="nav-link__content">
              <span className="nav-link__label">Cerrar sesion</span>
              <span className="nav-link__hint">Salir de la cuenta</span>
            </div>
          </button>
        </li>
      </ul>
    </nav>
  );
}
