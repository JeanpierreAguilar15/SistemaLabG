"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSessionStore } from '../../lib/session-store';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  HomeIcon,
  CalendarIcon,
  FileIcon,
  ReceiptIcon,
  CreditCardIcon,
  UserIcon,
  LogoutIcon,
  ClockIcon,
  BellIcon,
  ChevronRightIcon,
  BeakerIcon,
  HistoryIcon
} from './icons';

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  hint?: string;
  badge?: number | string;
  section?: 'main' | 'services' | 'account';
};

type UserInfo = {
  nombres?: string;
  apellidos?: string;
  email?: string;
};

type Stats = {
  proximasCitas: number;
  resultadosPendientes: number;
  pagosPendientes: number;
};

export function SidebarNav() {
  const pathname = usePathname();
  const { clear, accessToken } = useSessionStore();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ proximasCitas: 0, resultadosPendientes: 0, pagosPendientes: 0 });

  useEffect(() => {
    if (!accessToken) return;

    // Cargar información del usuario
    (async () => {
      try {
        const res = await api<UserInfo>(`/profile/me`, { method: 'GET' }, accessToken);
        setUserInfo(res);
      } catch {}
    })();

    // Cargar estadísticas
    (async () => {
      try {
        const [citas, resultados, pagos] = await Promise.all([
          api<{ items: any[] }>(`/appointments/mis-citas`, { method: 'GET' }, accessToken).catch(() => ({ items: [] })),
          api<{ items: any[] }>(`/results?estado=EN_PROCESO`, { method: 'GET' }, accessToken).catch(() => ({ items: [] })),
          api<{ items: any[] }>(`/billing/facturas?estado=PENDIENTE`, { method: 'GET' }, accessToken).catch(() => ({ items: [] })),
        ]);

        const upcomingCitas = (citas.items || []).filter((c: any) => new Date(c.inicio) > new Date()).length;

        setStats({
          proximasCitas: upcomingCitas,
          resultadosPendientes: (resultados.items || []).length,
          pagosPendientes: (pagos.items || []).length,
        });
      } catch {}
    })();
  }, [accessToken]);

  const mainItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Inicio',
      icon: HomeIcon,
      hint: 'Panel principal',
      section: 'main'
    },
  ];

  const serviceItems: NavItem[] = [
    {
      href: '/citas',
      label: 'Citas',
      icon: CalendarIcon,
      hint: 'Gestión de citas',
      badge: stats.proximasCitas > 0 ? stats.proximasCitas : undefined,
      section: 'services'
    },
    {
      href: '/resultados',
      label: 'Resultados',
      icon: BeakerIcon,
      hint: 'Análisis clínicos',
      badge: stats.resultadosPendientes > 0 ? stats.resultadosPendientes : undefined,
      section: 'services'
    },
    {
      href: '/cotizaciones',
      label: 'Cotizaciones',
      icon: ReceiptIcon,
      hint: 'Solicitar presupuestos',
      section: 'services'
    },
    {
      href: '/pagos',
      label: 'Pagos',
      icon: CreditCardIcon,
      hint: 'Facturación',
      badge: stats.pagosPendientes > 0 ? stats.pagosPendientes : undefined,
      section: 'services'
    },
  ];

  const accountItems: NavItem[] = [
    {
      href: '/perfil',
      label: 'Mi Perfil',
      icon: UserIcon,
      hint: 'Datos personales',
      section: 'account'
    },
    {
      href: '/historial',
      label: 'Historial',
      icon: HistoryIcon,
      hint: 'Actividad reciente',
      section: 'account'
    },
  ];

  const handleLogout = () => {
    clear();
    location.href = '/login';
  };

  const getInitials = () => {
    if (!userInfo?.nombres) return 'U';
    const nombres = userInfo.nombres.split(' ');
    const apellidos = userInfo.apellidos?.split(' ') || [];
    return `${nombres[0]?.[0] || ''}${apellidos[0]?.[0] || ''}`.toUpperCase();
  };

  const getFullName = () => {
    if (!userInfo?.nombres) return 'Usuario';
    const firstName = userInfo.nombres.split(' ')[0];
    const lastName = userInfo.apellidos?.split(' ')[0] || '';
    return `${firstName} ${lastName}`.trim();
  };

  const renderNavItem = (item: NavItem) => {
    const active = pathname?.startsWith(item.href);
    const Icon = item.icon;

    return (
      <li key={item.href}>
        <Link
          className={`nav-link ${active ? 'active' : ''}`}
          aria-current={active ? 'page' : undefined}
          href={item.href}
        >
          <Icon className="w-4 h-4" />
          <div className="nav-link__content">
            <div className="flex items-center justify-between w-full">
              <span className="nav-link__label">{item.label}</span>
              {item.badge && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[var(--accent-danger)] rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            {item.hint && <span className="nav-link__hint">{item.hint}</span>}
          </div>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Navegación principal" className="sidebar-nav sidebar flex flex-col h-full">
      {/* Brand Section */}
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden>LF</div>
        <div className="sidebar-brand-meta">
          <span>Portal</span>
          <strong>Lab. Franz</strong>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-tertiary)] flex items-center justify-center text-white font-bold text-sm">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {getFullName()}
            </div>
            <div className="text-xs text-[var(--sidebar-fg)] opacity-75 truncate">
              {userInfo?.email || 'Cargando...'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mt-6 flex-1 overflow-y-auto">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {mainItems.map(renderNavItem)}
        </ul>

        {/* Services Section */}
        <div className="nav-section mt-4">Servicios</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {serviceItems.map(renderNavItem)}
        </ul>

        {/* Account Section */}
        <div className="nav-section mt-4">Mi Cuenta</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {accountItems.map(renderNavItem)}
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <div className="text-xs font-semibold text-[var(--sidebar-fg)] opacity-75 uppercase tracking-wider mb-2">
          Resumen
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--sidebar-fg)] opacity-90">Próximas citas</span>
          <span className="font-bold text-white">{stats.proximasCitas}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--sidebar-fg)] opacity-90">Resultados</span>
          <span className="font-bold text-white">{stats.resultadosPendientes}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--sidebar-fg)] opacity-90">Pagos pendientes</span>
          <span className="font-bold text-white">{stats.pagosPendientes}</span>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left hover:bg-[var(--accent-danger)]/20"
          aria-label="Cerrar sesión"
        >
          <LogoutIcon className="w-4 h-4" />
          <div className="nav-link__content">
            <span className="nav-link__label">Cerrar sesión</span>
            <span className="nav-link__hint">Salir de tu cuenta</span>
          </div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-4 p-3 text-center">
        <div className="text-[10px] text-[var(--sidebar-fg)] opacity-50">
          Laboratorio Clínico Franz
        </div>
        <div className="text-[10px] text-[var(--sidebar-fg)] opacity-50 mt-0.5">
          v1.0.0 · 2025
        </div>
      </div>
    </nav>
  );
}
