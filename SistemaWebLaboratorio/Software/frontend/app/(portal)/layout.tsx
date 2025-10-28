import { ReactNode } from 'react';
import { SidebarNav } from '../../components/ui/sidebar-nav';
import { Topbar } from '../../components/layout/topbar.client';

export default function PortalLayout({ children }:{ children: ReactNode }){
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF3FF] to-[#FFF1F2]">
      {/* Full-bleed white shell (fills viewport, sin margenes) */}
      <div className="bg-white w-full min-h-screen">
        <div className="grid gap-0" style={{ gridTemplateRows:'auto 1fr' }}>
          <Topbar />
          <div className="grid gap-6 p-4 md:p-6" style={{ gridTemplateColumns:'220px 1fr' }}>
            <aside aria-label="Navegación lateral" className="hidden md:block">
              <SidebarNav />
            </aside>
            <main className="flex-1 w-full">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
