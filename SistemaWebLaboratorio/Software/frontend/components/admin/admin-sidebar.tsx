"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserIcon, ReceiptIcon, FileIcon, CalendarIcon, CreditCardIcon, BeakerIcon } from '../ui/icons';

type NavItem = {
  href: string;
  label: string;
  icon: (props:{ className?: string }) => JSX.Element;
  hint?: string;
};
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: 'General', items: [
    { href: '/admin', label: 'Dashboard', icon: HomeIcon, hint: 'Resumen ejecutivo' },
  ]},
  { label: 'Usuarios y seguridad', items: [
    { href: '/admin/usuarios', label: 'Usuarios y Roles', icon: UserIcon, hint: 'Permisos y perfiles' },
    { href: '/admin/sesiones', label: 'Sesiones activas', icon: UserIcon, hint: 'Dispositivos conectados' },
  ]},
  { label: 'Servicios y precios', items: [
    { href: '/admin/servicios', label: 'Servicios Lab', icon: BeakerIcon, hint: 'Portafolio clinico' },
    { href: '/admin/precios', label: 'Precios y Tarifas', icon: CreditCardIcon, hint: 'Tablas y combos' },
    { href: '/admin/config-facturacion', label: 'Config. Facturacion', icon: CreditCardIcon, hint: 'Datos fiscales' },
  ]},
  { label: 'Agenda', items: [
    { href: '/admin/agenda', label: 'Cupos y Horarios', icon: CalendarIcon, hint: 'Bloques disponibles' },
    { href: '/admin/citas', label: 'Gestion de Citas', icon: CalendarIcon, hint: 'Seguimiento diario' },
  ]},
  { label: 'Operaciones', items: [
    { href: '/admin/resultados', label: 'Resultados Lab', icon: FileIcon, hint: 'Entrega y revision' },
  ]},
  { label: 'Facturacion y reportes', items: [
    { href: '/admin/cotizaciones', label: 'Todas las Cotizaciones', icon: ReceiptIcon, hint: 'Propuestas emitidas' },
    { href: '/admin/facturas', label: 'Facturas', icon: ReceiptIcon, hint: 'Cobranza y pagos' },
  ]},
  { label: 'Auditoria', items: [
    { href: '/admin/auditoria', label: 'Auditoria', icon: ReceiptIcon, hint: 'Registro de acciones' },
  ]},
];

export function AdminSidebar(){
  const pathname = usePathname();
  return (
    <nav aria-label="admin" className="sidebar-nav sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden>LF</div>
        <div className="sidebar-brand-meta">
          <span>Control</span>
          <strong>Administracion</strong>
        </div>
      </div>
      {groups.map((group) => (
        <div key={group.label} className="nav-group">
          <div className="nav-section">{group.label}</div>
          <ul style={{ listStyle:'none', padding:0, margin:0 }}>
            {group.items.map(({ href, label, icon: Icon, hint }) => {
              const isExact = pathname === href;
              const isChild = href !== '/admin' && (pathname?.startsWith(href + '/') || pathname === href);
              const active = isExact || isChild;
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
          </ul>
        </div>
      ))}
    </nav>
  );
}
