'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface Role {
  codigo_rol: number
  nombre: string
  descripcion: string | null
  nivel_acceso: number
  activo: boolean
  fecha_creacion: string
}

export default function RolesManagement() {
  const { accessToken } = useAuthStore()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Roles</h1>
          <p className="text-lab-neutral-600 mt-1">Administra los roles y permisos del sistema</p>
        </div>
        <Button className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Rol
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-lab-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Total Roles</p>
              <p className="text-2xl font-bold text-lab-neutral-900">{roles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-lab-success-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Roles Activos</p>
              <p className="text-2xl font-bold text-lab-neutral-900">{roles.filter(r => r.activo).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-lab-info-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Nivel Máximo</p>
              <p className="text-2xl font-bold text-lab-neutral-900">{Math.max(...roles.map(r => r.nivel_acceso), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200">
        <div className="px-6 py-4 border-b border-lab-neutral-200">
          <h2 className="text-lg font-semibold text-lab-neutral-900">Roles Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-lab-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Nivel de Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-lab-neutral-200">
              {roles.map((role) => (
                <tr key={role.codigo_rol} className="hover:bg-lab-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-lab-primary-100 flex items-center justify-center">
                        <span className="text-lab-primary-700 font-semibold text-sm">
                          {role.nombre.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-lab-neutral-900">{role.nombre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-lab-neutral-600">
                      {role.descripcion || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lab-info-100 text-lab-info-800">
                      Nivel {role.nivel_acceso}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role.activo
                          ? 'bg-lab-success-100 text-lab-success-800'
                          : 'bg-lab-neutral-100 text-lab-neutral-800'
                      }`}
                    >
                      {role.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-lab-neutral-600">
                    {new Date(role.fecha_creacion).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
