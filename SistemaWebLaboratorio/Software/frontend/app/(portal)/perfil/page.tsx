"use client";
import { EditProfileForm } from '../../../components/profile/edit-profile.client';
import { ProfileHero } from '../../../components/profile/profile-hero.client';
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';
import { Toggle } from '../../../components/ui/toggle';
import { Toast } from '../../../components/ui/toast';
import { Tooltip } from '../../../components/ui/tooltip';
import { QuestionIcon } from '../../../components/ui/icons';
import { Header } from '../components/header';

export default function Page(){
  const [consent, setConsent] = useState(false);
  const [toast, setToast] = useState<{ open:boolean; title:string; message:string; variant:'success'|'error'|'info' }>(()=>({ open:false, title:'', message:'', variant:'info' }));
  const { accessToken, clear } = useSessionStore();

  useEffect(() => {
    (async () => {
      try{
        if (!accessToken) return;
        const me: any = await api('/profile/me', { method:'GET' }, accessToken);
        const has = Array.isArray(me?.consentimientos) ? me.consentimientos.includes('USO_DATOS') : false;
        setConsent(!!has);
      }catch{}
    })();
  }, [accessToken]);

  const handleSaveConsent = async (nextVal: boolean) => {
    try{
      await api('/profile/consent', { method:'POST', body: JSON.stringify({ tipo_consentimiento:'USO_DATOS', aceptado: nextVal }) }, accessToken);
      setToast({ open:true, title:'Preferencia guardada', message: nextVal ? 'Consentimiento aceptado' : 'Consentimiento retirado', variant:'success' });
    }catch{
      setConsent((v)=>!nextVal);
      setToast({ open:true, title:'No se pudo', message:'No fue posible actualizar el consentimiento', variant:'error' });
    }
  };

  const handleLogoutAll = async () => {
    try{ if (accessToken) await api('/auth/logout-all', { method:'POST' }, accessToken); }catch{}
    clear();
    setToast({ open:true, title:'Sesiones cerradas', message:'Se cerraron todas tus Sesiones activas.', variant:'success' });
    setTimeout(()=>{ location.href = '/login'; }, 600);
  };

  return (
    <section aria-label="perfil" className="space-y-5">
      <Header meta="Perfil" title="Mi perfil" subtitle="Actualiza tu informacion personal y preferencias" />
      <ProfileHero />
      <div className="portal-grid cols-2">
        <EditProfileForm />
        <div className="panel">
          <div className="panel-heading">Preferencias</div>
          <div className="panel-sub">Configura el uso de datos y notificaciones.</div>
          <div className="flex items-center gap-2 mt-4">
            <Toggle ariaLabel="Aceptar uso de datos" checked={consent} onChange={(v)=>{ setConsent(v); handleSaveConsent(v); }} />
            <span>Acepto uso de datos y notificaciones</span>
            <Tooltip content="Permite usar tu informacion para el asistente virtual y envio de notificaciones.">
              <span className="inline-flex items-center justify-center rounded-full border border-[var(--border-soft)] bg-white p-1 text-[var(--text-muted)]" aria-label="Mas detalles">
                <QuestionIcon />
              </span>
            </Tooltip>
          </div>

          <div className="panel-divider" />
          <div className="panel-heading">Sesiones</div>
          <p className="panel-sub">Cierra tu sesion en todos los dispositivos conectados.</p>
          <button className="mt-3 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-[var(--brand-primary)] text-white" onClick={handleLogoutAll}>
            Cerrar sesion en todos los dispositivos
          </button>
        </div>
      </div>
      <Toast open={toast.open} onClose={()=>setToast(s=>({ ...s, open:false }))} title={toast.title} variant={toast.variant} autoCloseMs={3000}>{toast.message}</Toast>
    </section>
  );
}
