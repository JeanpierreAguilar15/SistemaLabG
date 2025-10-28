"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';
import { HomeIcon, CalendarIcon, FileIcon, ReceiptIcon, CreditCardIcon, UserIcon, LogoutIcon } from './icons';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/citas', label: 'Citas', icon: CalendarIcon },
  { href: '/resultados', label: 'Resultados', icon: FileIcon },
  { href: '/cotizaciones', label: 'Cotizaciones', icon: ReceiptIcon },
  { href: '/pagos', label: 'Pagos', icon: CreditCardIcon },
  { href: '/perfil', label: 'Perfil', icon: UserIcon },
];

export function SidebarNav(){
  const pathname = usePathname();
  const { accessToken, clear } = useSessionStore();

  const handleLogout = async () => {
    try{ if(accessToken) await api('/auth/logout-all', { method:'POST' }, accessToken); }catch{}
    clear();
    location.href = '/login';
  };

  return (
    <nav aria-label="secciones" className="sidebar card p-2">
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link className={`nav-link flex items-center gap-2 ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} href={href}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="mt-2 pt-2 border-t border-border-soft">
          <button onClick={handleLogout} className="nav-link flex items-center gap-2 w-full text-left" aria-label="Cerrar sesión">
            <LogoutIcon className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
