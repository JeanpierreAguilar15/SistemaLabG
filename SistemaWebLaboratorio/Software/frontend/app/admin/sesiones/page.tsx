"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';

interface Session {
  token_id: number;
  expira_en: string;
  revocado_en: string | null;
  ip_origen: string;
  user_agent: string;
  created_at: string;
}

interface User {
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
}

export default function SessionsPage() {
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    // Cargar lista de usuarios
    api<any>('/users', { method: 'GET' }, accessToken)
      .then((data) => {
        const list: User[] = Array.isArray(data) ? data : (data?.items || []);
        // Normalizar campos esperados por este view
        const normalized = list.map((u: any) => ({
          cedula: u.cedula,
          nombre: (u.nombres || u.nombre || '').split(' ')[0] || '',
          apellido: (u.apellidos || u.apellido || '').split(' ')[0] || '',
          email: u.email,
          roles: Array.isArray(u.roles) ? u.roles : [],
        }));
        setUsers(normalized);
      })
      .catch(console.error);
  }, [isAdmin, accessToken]);

  const loadUserSessions = async (cedula: string) => {
    if (!cedula) return;
    setLoading(true);
    try {
      const data = await api<{ sessions: Session[] }>(`/admin/sessions/${cedula}`, { method: 'GET' }, accessToken);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (tokenId: number) => {
    if (!confirm('¿Está seguro de revocar esta sesión?')) return;
    
    try {
      await api(`/admin/sessions/revoke/${tokenId}`, { method: 'POST' }, accessToken);
      // Recargar sesiones
      if (selectedUser) {
        loadUserSessions(selectedUser);
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      alert('Error al revocar la sesión');
    }
  };

  const revokeAllSessions = async (cedula: string) => {
    if (!confirm('¿Está seguro de revocar TODAS las sesiones de este usuario?')) return;
    
    try {
      await api(`/admin/sessions/revoke-all/${cedula}`, { method: 'POST' }, accessToken);
      // Recargar sesiones
      if (selectedUser) {
        loadUserSessions(selectedUser);
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      alert('Error al revocar las sesiones');
    }
  };

  if (!isAdmin) return <div className="card">Acceso denegado</div>;

  return (
    <section>
      <div className="card">
        <div className="title">Gestión de Sesiones</div>
        <div className="subtitle">Administrar sesiones activas de usuarios</div>
      </div>

      {/* Selector de usuario */}
      <div className="card mt-4">
        <div className="heading-sm mb-4">Seleccionar Usuario</div>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                if (e.target.value) {
                  loadUserSessions(e.target.value);
                } else {
                  setSessions([]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un usuario</option>
              {users.map(user => (
                <option key={user.cedula} value={user.cedula}>
                  {user.nombre} {user.apellido} - {user.cedula} ({user.roles.join(', ')})
                </option>
              ))}
            </select>
          </div>
          {selectedUser && (
            <button
              onClick={() => revokeAllSessions(selectedUser)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Revocar Todas
            </button>
          )}
        </div>
      </div>

      {/* Lista de sesiones */}
      {selectedUser && (
        <div className="card mt-4">
          <div className="heading-sm mb-4">Sesiones Activas</div>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay sesiones activas para este usuario</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3">ID Sesión</th>
                    <th className="text-left p-3">IP Origen</th>
                    <th className="text-left p-3">Dispositivo</th>
                    <th className="text-left p-3">Creada</th>
                    <th className="text-left p-3">Expira</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.token_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{session.token_id}</td>
                      <td className="p-3">{session.ip_origen}</td>
                      <td className="p-3 text-sm truncate max-w-xs">{session.user_agent}</td>
                      <td className="p-3 text-sm">{new Date(session.created_at).toLocaleString()}</td>
                      <td className="p-3 text-sm">{new Date(session.expira_en).toLocaleString()}</td>
                      <td className="p-3">
                        <button
                          onClick={() => revokeSession(session.token_id)}
                          className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Revocar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
