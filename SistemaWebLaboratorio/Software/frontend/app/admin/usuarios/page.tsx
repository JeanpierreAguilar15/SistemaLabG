"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';

type UserItem = {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  activo: boolean;
  roles: string[];
};

type RoleItem = { nombre_rol: string; descripcion?: string | null };

export default function Page() {
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState<{ cedula:string; nombres:string; apellidos:string; email:string; telefono?:string; password?:string; rol?:string }>({ cedula:'', nombres:'', apellidos:'', email:'', telefono:'', password:'', rol:'' });

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdUser, setPwdUser] = useState<string>('');
  const [newPwd, setNewPwd] = useState('');

  const loadAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    try{
      const [u, r] = await Promise.all([
        api<any>(`/users`, { method:'GET' }, accessToken),
        api<any>(`/users/roles/list`, { method:'GET' }, accessToken),
      ]);
      const arr: UserItem[] = Array.isArray(u) ? u : (u?.items || []);
      setUsers(arr);
      setRolesList(Array.isArray(r) ? r : (r?.items || r || []));
    } catch (error) {
      console.error('Error cargando usuarios/roles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ if(isAdmin && accessToken) loadAll(); }, [isAdmin, accessToken]);

  const filtered = useMemo(()=> (users||[]).filter(u => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return u.cedula.toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q);
  }), [users, filter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ cedula:'', nombres:'', apellidos:'', email:'', telefono:'', password:'', rol: rolesList[0]?.nombre_rol || '' });
    setShowUserModal(true);
  };

  const openEdit = (u: UserItem) => {
    setEditing(u);
    setForm({ cedula:u.cedula, nombres:u.nombres, apellidos:u.apellidos, email:u.email, telefono:u.telefono || '', rol:u.roles?.[0] });
    setShowUserModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault(); if(!accessToken) return;
    try{
      if (editing) {
        await api(`/users/${editing.cedula}`, { method:'PUT', body: JSON.stringify(form) }, accessToken);
      } else {
        await api(`/users`, { method:'POST', body: JSON.stringify(form) }, accessToken);
      }
      setShowUserModal(false); await loadAll();
    }catch(e:any){ alert(String(e?.message||'No se pudo guardar')); }
  };

  const toggleStatus = async (cedula:string) => {
    if(!accessToken) return; try{ await api(`/users/${cedula}/toggle-status`, { method:'PUT' }, accessToken); await loadAll(); }catch(e:any){ alert(String(e?.message||'No se pudo cambiar estado')); }
  };

  const askResetPwd = (cedula:string) => { setPwdUser(cedula); setNewPwd(''); setShowPwdModal(true); };
  const doResetPwd = async (e:React.FormEvent) => { e.preventDefault(); if(!accessToken||!pwdUser||!newPwd) return; try{ await api(`/users/${pwdUser}/reset-password`, { method:'PUT', body: JSON.stringify({ newPassword:newPwd }) }, accessToken); setShowPwdModal(false); alert('Contraseña reseteada'); }catch(e:any){ alert(String(e?.message||'No se pudo resetear')); } };

  const removeUser = async (cedula:string) => { if(!accessToken) return; if(!confirm('¿Está seguro de eliminar este usuario?')) return; try{ await api(`/users/${cedula}?force=true`, { method:'DELETE' }, accessToken); await loadAll(); }catch(e:any){ alert(String(e?.message||'No se pudo eliminar')); } };

  if (!isAdmin) return <div className="card">Acceso denegado</div>;

  return (
    <section>
      <div className="card">
        <div className="heading-sm">Gestión de Usuarios y Roles</div>
        <div className="body-muted">Administre usuarios, roles y permisos del sistema</div>
        <div className="mt-4 flex items-center gap-4">
          <input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Buscar por cédula, email o nombre" className="w-80" />
          <button className="btn-primary" onClick={openCreate}>Nuevo Usuario</button>
        </div>
      </div>

      <div className="card mt-4">
        {loading ? <div>Cargando…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-hover">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Roles</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.cedula} className={!u.activo ? 'opacity-50' : ''}>
                    <td className="p-2 border-b border-border-soft">{u.cedula}</td>
                    <td className="p-2 border-b border-border-soft">{u.apellidos}, {u.nombres}</td>
                    <td className="p-2 border-b border-border-soft">{u.email}</td>
                    <td className="p-2 border-b border-border-soft">{u.telefono || '-'}</td>
                    <td className="p-2 border-b border-border-soft">{(u.roles||[]).join(', ') || 'Sin rol'}</td>
                    <td className="p-2 border-b border-border-soft">{u.activo ? 'Activo' : 'Inactivo'}</td>
                    <td className="p-2 border-b border-border-soft">
                      <div className="flex gap-2">
                        <button className="icon" onClick={()=>openEdit(u)}>Editar</button>
                        <button className="icon" onClick={()=>toggleStatus(u.cedula)}>{u.activo ? 'Desactivar' : 'Activar'}</button>
                        <button className="icon" onClick={()=>askResetPwd(u.cedula)}>Resetear Clave</button>
                        <button className="icon" onClick={()=>removeUser(u.cedula)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td className="p-3" colSpan={7}>Sin usuarios</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUserModal && (
        <div className="modal-overlay" onClick={()=>setShowUserModal(false)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="modal-close" onClick={()=>setShowUserModal(false)}>×</button>
            </div>
            <form onSubmit={saveUser} className="modal-body space-y-3">
              {!editing && (
                <div>
                  <label className="form-label">Cédula *</label>
                  <input className="form-input" value={form.cedula} onChange={(e)=>setForm({...form, cedula:e.target.value})} required />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">Nombres *<input className="form-input" value={form.nombres} onChange={(e)=>setForm({...form, nombres:e.target.value})} required /></label>
                <label className="form-label">Apellidos *<input className="form-input" value={form.apellidos} onChange={(e)=>setForm({...form, apellidos:e.target.value})} required /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">Email *<input type="email" className="form-input" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required /></label>
                <label className="form-label">Teléfono<input className="form-input" value={form.telefono} onChange={(e)=>setForm({...form, telefono:e.target.value})} /></label>
              </div>
              {!editing && (
                <label className="form-label">Contraseña temporal<input className="form-input" placeholder="Temp123!" value={form.password||''} onChange={(e)=>setForm({...form, password:e.target.value})} /></label>
              )}
              <div>
                <label className="form-label">Rol</label>
                <select className="form-input" value={form.rol||''} onChange={(e)=>setForm({...form, rol:e.target.value})}>
                  <option value="">(sin rol)</option>
                  {rolesList.map(r=> <option key={r.nombre_rol} value={r.nombre_rol}>{r.nombre_rol}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={()=>setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPwdModal && (
        <div className="modal-overlay" onClick={()=>setShowPwdModal(false)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Resetear Contraseña</h3>
              <button className="modal-close" onClick={()=>setShowPwdModal(false)}>×</button>
            </div>
            <form onSubmit={doResetPwd} className="modal-body space-y-3">
              <label className="form-label">Nueva contraseña<input className="form-input" value={newPwd} onChange={(e)=>setNewPwd(e.target.value)} required /></label>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={()=>setShowPwdModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

