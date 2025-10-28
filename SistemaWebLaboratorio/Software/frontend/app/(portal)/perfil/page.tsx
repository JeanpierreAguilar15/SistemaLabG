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

export default function Page(){
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [consent, setConsent] = useState(false);
  const [toast, setToast] = useState<{ open:boolean; title:string; message:string; variant:'success'|'error'|'info' }>(()=>({ open:false, title:'', message:'', variant:'info' }));
  const { accessToken } = useSessionStore();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next) { setToast({ open:true, title:'Datos incompletos', message:'Completa ambos campos.', variant:'info' }); return; }
    try{
      await api('/profile/change-password', { method:'POST', body: JSON.stringify({ current_password: current, new_password: next }) }, accessToken);
      setCurrent(''); setNext('');
      setToast({ open:true, title:'Listo', message:'Contrasena actualizada', variant:'success' });
    }catch{
      setToast({ open:true, title:'No se pudo', message:'No fue posible cambiar la contrasena', variant:'error' });
    }
  };

  // cargar consentimiento actual
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

  return (
    <section aria-label="perfil">
      <ProfileHero />
      <div className="row cols-2" style={{ marginTop:'1rem' }}>
        <EditProfileForm />
        <div className="card">
          <div className="title">Consentimientos</div>
          <div className="flex items-center gap-2">
            <Toggle ariaLabel="Aceptar uso de datos" checked={consent} onChange={(v)=>{ setConsent(v); handleSaveConsent(v); }} />
            <span>Acepto uso de datos y notificaciones</span>
            <Tooltip content="Permite usar tu informacion para el asistente virtual y envio de notificaciones. Puedes cambiarlo cuando quieras.">
              <span className="inline-flex items-center justify-center rounded-full border border-[var(--border-soft)] bg-white p-1 text-[var(--text-muted)]" aria-label="Que es esto?">
                <QuestionIcon />
              </span>
            </Tooltip>
          </div>
          <div className="title" style={{ marginTop:'1rem' }}>Cambiar contraseña</div>
          <form onSubmit={handleChangePassword}>
            <label>
              <span>Contraseña actual</span>
              <input value={current} onChange={(e)=>setCurrent(e.target.value)} type="password" style={{ display:'block', width:'100%', border:'1px solid var(--border-soft)', borderRadius:'.375rem', padding:'.5rem' }} />
            </label>
            <label>
              <span>Nueva contraseña</span>
              <input value={next} onChange={(e)=>setNext(e.target.value)} type="password" style={{ display:'block', width:'100%', border:'1px solid var(--border-soft)', borderRadius:'.375rem', padding:'.5rem' }} />
            </label>
            <button className="primary" style={{ marginTop:'1rem' }}>Cambiar contraseña</button>
          </form>
        </div>
      </div>
      <Toast open={toast.open} onClose={()=>setToast(s=>({ ...s, open:false }))} title={toast.title} variant={toast.variant} autoCloseMs={3000}>{toast.message}</Toast>
    </section>
  );
}
