"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';

type UserItem = { cedula:string; nombres:string; apellidos:string; email:string; roles:string[] };

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = roles.includes('ADMIN');
  useEffect(()=>{ (async()=>{
    if(!isAdmin || !accessToken) return;
    const res = await api<UserItem[]>(`/users`, { method:'GET' }, accessToken);
    setItems(res as any);
    setLoading(false);
  })(); }, [isAdmin, accessToken]);
  if(!isAdmin) return <div className="card">acceso denegado</div>;
  if(loading) return <div className="card">cargando...</div>;
  return (
    <section>
      <div className="card"><div className="title">gestión de usuarios y roles</div><div className="subtitle">asigna/cambia roles</div></div>
      <div className="card" style={{ marginTop:'1rem' }}>
        <table>
          <thead><tr><th scope="col">cédula</th><th scope="col">nombre</th><th scope="col">email</th><th scope="col">roles</th><th scope="col">acción</th></tr></thead>
          <tbody>
            {items.map(u => (
              <tr key={u.cedula}>
                <td>{u.cedula}</td>
                <td>{u.apellidos}, {u.nombres}</td>
                <td>{u.email}</td>
                <td>{u.roles.join(', ')}</td>
                <td>
                  <button className="icon" aria-label="asignar admin" onClick={async()=>{
                    // asignar rol admin
                    await api(`/users/assign-role`, { method:'POST', body: JSON.stringify({ cedula: u.cedula, nombre_rol:'ADMIN' }) }, accessToken);
                    const next = await api<UserItem[]>(`/users`, { method:'GET' }, accessToken);
                    setItems(next as any);
                  }}>hacer admin</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

