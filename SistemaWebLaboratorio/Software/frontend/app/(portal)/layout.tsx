"use client";
import { ReactNode } from 'react';
import { SidebarNav } from '../../components/ui/sidebar-nav';
import { Topbar } from '../../components/layout/topbar.client';
import { useRouteProtection } from '../../lib/use-route-protection';

export default function PortalLayout({ children }:{ children: ReactNode }){
  useRouteProtection({
    requireAuth: true,
    redirectIfAdmin: true,
  });

  return (
    <div className="admin-shell theme-accent-blue">
      <header role="banner">
        <Topbar />
      </header>
      <div className="admin-shell__body">
        <aside aria-label="Navegacion lateral" className="admin-shell__sidebar hidden md:block">
          <SidebarNav />
        </aside>
        <main id="contenido" role="main" tabIndex={-1} className="admin-shell__main">
          {children}
        </main>
      </div>
    </div>
  );
}
