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
        <div className="heading-sm">Precios</div>
        <div className="body-muted">Gestión de precios base, paquetes y vigencias</div>
      </div>
      <div className="card mt-3">
        <div className="body-muted">Pendiente de integración backend. Incluirá: listado de precios, edición inline/por modal, versionado y exportes.</div>
      </div>
    </section>
  );
}
