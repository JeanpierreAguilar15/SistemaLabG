"use client";
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';

export default function Page(){
  const { roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  if(!isAdmin) return <div className="card">acceso denegado</div>;
  return (
    <section>
      <div className="card">
        <div className="heading-sm">Resultados</div>
        <div className="body-muted">Subir PDFs, gestionar estados y notificaciones</div>
      </div>
      <div className="card mt-3">
        <div className="body-muted">Pendiente de integración backend. Incluirá uploader de PDF, lista de resultados, notificación al paciente y control de liberación.</div>
      </div>
    </section>
  );
}
