"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';
import { Button } from '../ui/button';

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
      }catch{/* ignore */}
    })();
  }, [accessToken]);

  const fullName = me?.nombres ? `${me.nombres} ${me.apellidos ?? ''}`.trim() : 'Paciente';
  const email = me?.email || 'correo@ejemplo.com';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <div className="profile-banner" role="region" aria-label="tarjeta de perfil">
      {me?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={me.avatar_url} alt={fullName} className="profile-banner__avatar object-cover" />
      ) : (
        <div aria-hidden className="profile-banner__avatar">{initial}</div>
      )}
      <div className="profile-banner__body">
        <div className="text-lg font-semibold">{fullName}</div>
        <div className="profile-banner__meta">{email}</div>
        <div className="profile-banner__meta">Paciente activo - Portal Laboratorio</div>
      </div>
      <div className="profile-banner__actions">
        <Button size="sm" variant="outline" onClick={()=>location.href='/resultados'}>Ver resultados</Button>
        <Button size="sm" onClick={()=>location.href='/pagos'}>Ver pagos</Button>
      </div>
    </div>
  );
}
