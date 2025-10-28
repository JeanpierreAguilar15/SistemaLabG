"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';

type Me = { nombres?: string; apellidos?: string; email?: string; avatar_url?: string } | null;

export function ProfileHero(){
  const { accessToken } = useSessionStore();
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    (async () => {
      try{
        if (!accessToken) return;
        const res = await api<any>('/profile/me', { method:'GET' }, accessToken);
        setMe({ nombres: res?.nombres, apellidos: res?.apellidos, email: res?.email, avatar_url: res?.avatar_url });
      }catch{}
    })();
  }, [accessToken]);

  const fullName = me?.nombres ? `${me.nombres} ${me.apellidos ?? ''}`.trim() : 'Paciente';
  const email = me?.email || 'correo@ejemplo.com';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <div className="card" role="region" aria-label="cabecera de perfil">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {me?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatar_url} alt={fullName} className="w-14 h-14 rounded-full border border-[var(--border-soft)] object-cover" />
          ) : (
            <div aria-hidden className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold" style={{ background:'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' }}>{initial}</div>
          )}
          <div>
            <div className="text-lg font-semibold">{fullName}</div>
            <div className="text-sm text-[var(--text-muted)]">{email}</div>
          </div>
        </div>
        {/* Botón de edición eliminado a solicitud */}
      </div>
    </div>
  );
}
