"use client";
import { ReactNode } from 'react';
import { Topbar } from '../../components/layout/topbar.client';
import { AdminSidebar } from '../../components/admin/admin-sidebar';
import { useRouteProtection } from '../../lib/use-route-protection';

export default function AdminLayout({ children }:{ children: ReactNode }){
  const { isReady, isAuthenticated, isAdmin } = useRouteProtection({
    requireAuth: true,
    requireAdmin: true,
  });

  if (!isReady || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-[var(--text-muted)]">Verificando acceso...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell admin-surface theme-accent-blue">
      <header role="banner">
        <Topbar />
      </header>
      <div className="admin-shell__body">
        <aside className="admin-shell__sidebar hidden md:block" aria-label="Navegacion lateral de administracion">
          <AdminSidebar />
        </aside>
        <main id="contenido" role="main" tabIndex={-1} className="admin-shell__main">
          {children}
        </main>
      </div>
    </div>
  );
}
