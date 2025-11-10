"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../lib/session-store';
import { getHomePath, isAdminish } from '../../lib/auth-helpers';
import { api } from '../../lib/api';
import { BellIcon, SearchIcon, QuestionIcon } from '../ui/icons';

type Me = { nombres?: string; apellidos?: string } | null;

export function Topbar(){
  const { accessToken, roles, clear } = useSessionStore();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    (async () => {
      try{
        if (!accessToken) return;
        const res = await api<any>('/profile/me', { method:'GET' }, accessToken);
        setMe({ nombres: res?.nombres, apellidos: res?.apellidos });
      }catch(error){
        console.warn('No se pudo cargar perfil de usuario:', error);
        setMe(null);
      }
    })();
  }, [accessToken]);

  const fullName = me?.nombres ? `${me.nombres?.split(' ')[0]} ${me.apellidos?.split(' ')[0] ?? ''}`.trim() : 'Usuario';
  const initial = fullName.charAt(0).toUpperCase();

  const isAdmin = isAdminish(roles);
  const homeHref = getHomePath(roles, accessToken);

  return (
    <div className="toolbar" role="navigation" aria-label="barra superior">
      <div className="toolbar-inner">
        <Link href={homeHref} className="brand-pill" aria-label="Ir al inicio">
          <div aria-hidden className="brand-logo">LF</div>
          <div className="brand-meta">
            <span>Laboratorio</span>
            <strong>Panel Franz</strong>
          </div>
        </Link>

        <div className="toolbar-search" role="search">
          <SearchIcon className="w-4 h-4" aria-hidden="true" />
          <input type="search" aria-label="Buscar en el sistema" placeholder="Buscar en el sistema" />
        </div>

        <div className="toolbar-actions">
          <Link href="/ayuda" className="icon-btn" aria-label="Centro de ayuda"><QuestionIcon className="w-5 h-5" /></Link>
          <button className="icon-btn relative" aria-label="Notificaciones">
            <BellIcon className="w-5 h-5" />
            <span aria-hidden className="badge-dot" />
          </button>
          <div ref={ref} className="relative">
            <button className="avatar-chip" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(!open)}>
              <span aria-hidden className="avatar-initial">{initial}</span>
              <span className="chip-label hidden sm:block">{fullName}</span>
            </button>
            {open && (
              <ul role="menu" aria-label="menu de perfil" className="menu-sheet">
                {isAdmin ? (
                  <li role="menuitem"><Link href="/admin" className="menu-item">Panel Admin</Link></li>
                ) : (
                  <>
                    <li role="menuitem"><Link href="/perfil" className="menu-item">Perfil</Link></li>
                    <li role="menuitem"><Link href="/resultados" className="menu-item">Mis Resultados</Link></li>
                    <li role="menuitem"><Link href="/pagos" className="menu-item">Mis Pagos</Link></li>
                  </>
                )}
                <li role="separator" className="menu-sep" />
                <li role="menuitem">
                  <button className="menu-item" onClick={async()=>{ clear(); location.href = '/login'; }}>Cerrar sesión</button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
