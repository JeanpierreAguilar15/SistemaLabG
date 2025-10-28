"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';
import { BellIcon, SearchIcon } from '../ui/icons';

type Me = { nombres?: string; apellidos?: string } | null;

export function Topbar(){
  const { accessToken, clear } = useSessionStore();
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
      }catch{}
    })();
  }, [accessToken]);

  const fullName = me?.nombres ? `${me.nombres?.split(' ')[0]} ${me.apellidos?.split(' ')[0] ?? ''}`.trim() : 'Usuario';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-soft)] bg-white" role="navigation" aria-label="barra superior">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-[var(--text-main)] no-underline">
          <div aria-hidden className="w-8 h-8 rounded-md" style={{ background:'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }} />
          <span className="heading-sm">Laboratorio Franz</span>
        </Link>
      </div>
      <div className="hidden md:flex items-center flex-1 mx-6">
        <div className="relative w-full max-w-xl">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="search" aria-label="Buscar" placeholder="Search" className="w-full pl-9 pr-3 py-2 rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-md border border-[var(--border-soft)] bg-white" aria-label="Notificaciones">
          <BellIcon className="w-5 h-5" />
        </button>
        <div ref={ref} className="relative">
          <button className="flex items-center gap-2 border border-[var(--border-soft)] rounded-full pl-1 pr-3 py-1 bg-white" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(!open)}>
            <span aria-hidden className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ background:'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))', color:'#fff' }}>{initial}</span>
            <span className="text-sm font-medium hidden sm:block">{fullName}</span>
          </button>
          {open && (
            <ul role="menu" aria-label="menu de perfil" className="absolute right-0 mt-2 w-52 rounded-md border border-[var(--border-soft)] bg-white shadow">
              <li role="menuitem"><Link href="/perfil" className="block px-3 py-2 hover:bg-[#f3f4f6]">Perfil</Link></li>
              <li role="menuitem"><Link href="/resultados" className="block px-3 py-2 hover:bg-[#f3f4f6]">Mis Resultados</Link></li>
              <li role="menuitem"><Link href="/pagos" className="block px-3 py-2 hover:bg-[#f3f4f6]">Mis Pagos</Link></li>
              <li role="separator" className="h-px bg-[var(--border-soft)] my-1" />
              <li role="menuitem">
                <button className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6]" onClick={async()=>{
                  try{ if(accessToken) await api('/auth/logout-all', { method:'POST' }, accessToken); }catch{}
                  clear();
                  location.href = '/login';
                }}>Cerrar sesión</button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
