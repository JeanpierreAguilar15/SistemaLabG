"use client";
import { EditProfileForm } from '../../../components/profile/edit-profile.client';
import { ChangePasswordForm } from '../../../components/profile/change-password.client';
import { ProfileHero } from '../../../components/profile/profile-hero.client';
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';
import { Toggle } from '../../../components/ui/toggle';
import { Toast } from '../../../components/ui/toast';
import { Tooltip } from '../../../components/ui/tooltip';
import { QuestionIcon, ShieldIcon, BellIcon } from '../../../components/ui/icons';
import { Header } from '../components/header';
import { Button } from '../../../components/ui/button';

type ConsentType = {
  USO_DATOS: boolean;
  NOTIFICACIONES: boolean;
  COMPARTIR_INFO: boolean;
};

export default function Page(){
  const [consents, setConsents] = useState<ConsentType>({
    USO_DATOS: false,
    NOTIFICACIONES: false,
    COMPARTIR_INFO: false,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ open:boolean; title:string; message:string; variant:'success'|'error'|'info' }>(()=>({ open:false, title:'', message:'', variant:'info' }));
  const { accessToken, clear } = useSessionStore();

  useEffect(() => {
    (async () => {
      try{
        if (!accessToken) return;
        const me: any = await api('/profile/me', { method:'GET' }, accessToken);
        const consentArray = Array.isArray(me?.consentimientos) ? me.consentimientos : [];

        setConsents({
          USO_DATOS: consentArray.includes('USO_DATOS'),
          NOTIFICACIONES: consentArray.includes('NOTIFICACIONES'),
          COMPARTIR_INFO: consentArray.includes('COMPARTIR_INFO'),
        });
      }catch{}
      finally{
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const handleSaveConsent = async (tipo: keyof ConsentType, nextVal: boolean) => {
    const previousValue = consents[tipo];
    // Optimistic update
    setConsents(prev => ({ ...prev, [tipo]: nextVal }));

    try{
      await api('/profile/consent', { method:'POST', body: JSON.stringify({ tipo_consentimiento: tipo, aceptado: nextVal }) }, accessToken);
      setToast({ open:true, title:'Preferencia guardada', message: nextVal ? 'Consentimiento aceptado' : 'Consentimiento retirado', variant:'success' });
    }catch{
      // Rollback on error
      setConsents(prev => ({ ...prev, [tipo]: previousValue }));
      setToast({ open:true, title:'Error', message:'No fue posible actualizar el consentimiento', variant:'error' });
    }
  };

  const handleLogoutAll = async () => {
    const confirmLogout = confirm('¿Estas seguro de cerrar sesion en todos los dispositivos?');
    if (!confirmLogout) return;

    try{
      if (accessToken) await api('/auth/logout-all', { method:'POST' }, accessToken);
    }catch{}

    clear();
    setToast({ open:true, title:'Sesiones cerradas', message:'Se cerraron todas tus sesiones activas.', variant:'success' });
    setTimeout(()=>{ location.href = '/login'; }, 1500);
  };

  return (
    <section aria-label="perfil" className="space-y-6">
      <Header
        meta="Mi Cuenta"
        title="Mi perfil"
        subtitle="Gestiona tu informacion personal, seguridad y preferencias de privacidad"
        actions={
          <Button variant="outline" onClick={() => location.href = '/dashboard'}>
            Volver al inicio
          </Button>
        }
      />

      <ProfileHero />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Personal Info */}
        <div className="space-y-6">
          <EditProfileForm />
        </div>

        {/* Right Column - Security & Preferences */}
        <div className="space-y-6">
          {/* Password Change */}
          <ChangePasswordForm />

          {/* Privacy & Consents */}
          <div className="panel">
            <div className="flex items-center gap-2 mb-3">
              <ShieldIcon className="w-5 h-5 text-[var(--brand-primary)]" />
              <div className="panel-heading">Privacidad y Consentimientos</div>
            </div>
            <div className="panel-sub mb-4">
              Controla como se utiliza tu informacion personal
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="skeleton h-12 w-full"></div>
                <div className="skeleton h-12 w-full"></div>
                <div className="skeleton h-12 w-full"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Uso de datos */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-soft)]">
                  <div className="flex-shrink-0 mt-1">
                    <Toggle
                      ariaLabel="Aceptar uso de datos"
                      checked={consents.USO_DATOS}
                      onChange={(v) => handleSaveConsent('USO_DATOS', v)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-main)] text-sm">
                        Uso de datos para servicios
                      </span>
                      <Tooltip content="Permite procesar tu informacion para asistente virtual, recomendaciones y mejora de servicios.">
                        <span className="inline-flex items-center justify-center rounded-full border border-[var(--border-soft)] bg-white p-1 text-[var(--text-muted)]" aria-label="Mas detalles">
                          <QuestionIcon className="w-3 h-3" />
                        </span>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Procesamiento de datos para mejorar tu experiencia y servicios personalizados
                    </p>
                  </div>
                </div>

                {/* Notificaciones */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-soft)]">
                  <div className="flex-shrink-0 mt-1">
                    <Toggle
                      ariaLabel="Recibir notificaciones"
                      checked={consents.NOTIFICACIONES}
                      onChange={(v) => handleSaveConsent('NOTIFICACIONES', v)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <BellIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                      <span className="font-semibold text-[var(--text-main)] text-sm">
                        Notificaciones y alertas
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Recibir recordatorios de citas, resultados disponibles y actualizaciones importantes
                    </p>
                  </div>
                </div>

                {/* Compartir info */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-soft)]">
                  <div className="flex-shrink-0 mt-1">
                    <Toggle
                      ariaLabel="Compartir informacion"
                      checked={consents.COMPARTIR_INFO}
                      onChange={(v) => handleSaveConsent('COMPARTIR_INFO', v)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-main)] text-sm">
                        Compartir con terceros
                      </span>
                      <Tooltip content="Permite compartir informacion anonimizada con socios medicos para investigacion y mejora de servicios.">
                        <span className="inline-flex items-center justify-center rounded-full border border-[var(--border-soft)] bg-white p-1 text-[var(--text-muted)]" aria-label="Mas detalles">
                          <QuestionIcon className="w-3 h-3" />
                        </span>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Compartir datos anonimizados para investigacion medica y estudios cientificos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy notice */}
            <div className="mt-4 p-3 rounded-lg bg-[#F0F6FF] border border-[#BFDBFE]">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Tus datos medicos siempre estan protegidos y nunca se comparten sin tu consentimiento explicito.
                    Lee nuestra <a href="/politica-privacidad" className="text-[var(--brand-primary)] hover:underline">Politica de Privacidad</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Management */}
          <div className="panel">
            <div className="panel-heading">Gestion de sesiones</div>
            <div className="panel-sub mb-4">
              Administra las sesiones activas en tus dispositivos
            </div>

            <div className="p-4 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-soft)] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-success)] bg-opacity-10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm text-[var(--text-main)]">Sesion actual</div>
                  <div className="text-xs text-[var(--text-muted)]">Este dispositivo · Activa ahora</div>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogoutAll} className="w-full">
              Cerrar sesion en todos los dispositivos
            </Button>

            <p className="text-xs text-[var(--text-muted)] mt-2">
              Esto cerrara tu sesion en todos los dispositivos excepto el actual. Tendras que volver a iniciar sesion.
            </p>
          </div>
        </div>
      </div>

      <Toast open={toast.open} onClose={()=>setToast(s=>({ ...s, open:false }))} title={toast.title} variant={toast.variant} autoCloseMs={3000}>{toast.message}</Toast>
    </section>
  );
}
