'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface User {
  codigo_usuario: number
  nombres: string
  apellidos: string
  email: string
  cedula: string
  telefono: string | null
  activo: boolean
  rol: {
    codigo_rol: number
    nombre: string
  }
  fecha_creacion: string
}

export default function UsersManagement() {
  const { accessToken } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    loadUsers()
  }, [pagination.page, searchTerm, filterRole, filterActive])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole && { codigo_rol: filterRole }),
        ...(filterActive && { activo: filterActive }),
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setUsers(result.data)
        setPagination(prev => ({ ...prev, ...result.pagination }))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (codigo_usuario: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${codigo_usuario}/toggle-status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Usuarios</h1>
          <p className="text-lab-neutral-600 mt-1">Administra los usuarios del sistema</p>
        </div>
        <Button className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-lab-neutral-700 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Nombre, email o cédula..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-4 py-2 border border-lab-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lab-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-lab-neutral-700 mb-2">Rol</label>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-4 py-2 border border-lab-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lab-primary-500"
            >
              <option value="">Todos</option>
              <option value="1">Paciente</option>
              <option value="2">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-lab-neutral-700 mb-2">Estado</label>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-4 py-2 border border-lab-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lab-primary-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-lab-neutral-50 border-b border-lab-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-700 uppercase tracking-wider">
                      Cédula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-700 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-700 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-lab-neutral-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.codigo_usuario} className="hover:bg-lab-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-lab-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-lab-primary-700">
                                {user.nombres[0]}
                                {user.apellidos[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-lab-neutral-900">
                                {user.nombres} {user.apellidos}
                              </div>
                              {user.telefono && (
                                <div className="text-sm text-lab-neutral-500">{user.telefono}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-lab-neutral-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-lab-neutral-900">{user.cedula}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-lab-primary-100 text-lab-primary-800">
                            {user.rol.nombre}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.activo
                                ? 'bg-lab-success-100 text-lab-success-800'
                                : 'bg-lab-danger-100 text-lab-danger-800'
                            }`}
                          >
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-lab-neutral-500">
                          {new Date(user.fecha_creacion).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button className="text-lab-info-600 hover:text-lab-info-900">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.codigo_usuario)}
                              className={
                                user.activo
                                  ? 'text-lab-danger-600 hover:text-lab-danger-900'
                                  : 'text-lab-success-600 hover:text-lab-success-900'
                              }
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={
                                    user.activo
                                      ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                                      : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                  }
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-lab-neutral-500">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-lab-neutral-200 flex items-center justify-between">
                <div className="text-sm text-lab-neutral-700">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-lab-neutral-700">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
