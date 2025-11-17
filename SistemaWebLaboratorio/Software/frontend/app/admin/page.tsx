'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'

interface DashboardStats {
  users: {
    total: number
    active: number
  }
  exams: {
    total: number
  }
  appointments: {
    total: number
    today: number
  }
  results: {
    pending: number
  }
  inventory: {
    lowStock: number
  }
  recentActivities: Array<{
    codigo_log: number
    accion: string
    entidad: string | null
    fecha_accion: string
    usuario: {
      nombres: string
      apellidos: string
    } | null
  }>
}

export default function AdminDashboard() {
  const { accessToken } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
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
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Panel de Administración</h1>
        <p className="text-lab-neutral-600 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuarios */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Usuarios Totales</p>
              <p className="text-3xl font-bold text-lab-neutral-900 mt-2">{stats?.users.total || 0}</p>
              <p className="text-sm text-lab-success-600 mt-1">{stats?.users.active || 0} activos</p>
            </div>
            <div className="w-12 h-12 bg-lab-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Exámenes */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Exámenes Activos</p>
              <p className="text-3xl font-bold text-lab-neutral-900 mt-2">{stats?.exams.total || 0}</p>
              <p className="text-sm text-lab-neutral-500 mt-1">En catálogo</p>
            </div>
            <div className="w-12 h-12 bg-lab-secondary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Citas */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Citas Totales</p>
              <p className="text-3xl font-bold text-lab-neutral-900 mt-2">{stats?.appointments.total || 0}</p>
              <p className="text-sm text-lab-info-600 mt-1">{stats?.appointments.today || 0} hoy</p>
            </div>
            <div className="w-12 h-12 bg-lab-info-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Inventario */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Stock Bajo</p>
              <p className="text-3xl font-bold text-lab-neutral-900 mt-2">{stats?.inventory.lowStock || 0}</p>
              <p className="text-sm text-lab-warning-600 mt-1">Requiere atención</p>
            </div>
            <div className="w-12 h-12 bg-lab-warning-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados Pendientes Alert */}
      {stats && stats.results.pending > 0 && (
        <div className="bg-lab-warning-50 border border-lab-warning-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-lab-warning-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-lab-warning-900">
                Hay {stats.results.pending} resultados pendientes de procesamiento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200">
        <div className="px-6 py-4 border-b border-lab-neutral-200">
          <h2 className="text-lg font-semibold text-lab-neutral-900">Actividad Reciente</h2>
        </div>
        <div className="divide-y divide-lab-neutral-200">
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <div key={activity.codigo_log} className="px-6 py-4 hover:bg-lab-neutral-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-lab-neutral-900">{activity.accion}</p>
                    {activity.entidad && (
                      <p className="text-sm text-lab-neutral-600 mt-1">
                        Entidad: <span className="font-medium">{activity.entidad}</span>
                      </p>
                    )}
                    {activity.usuario && (
                      <p className="text-xs text-lab-neutral-500 mt-1">
                        Por {activity.usuario.nombres} {activity.usuario.apellidos}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-lab-neutral-500 ml-4">
                    {new Date(activity.fecha_accion).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-lab-neutral-500">
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          href="/admin/usuarios"
          className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6 hover:border-lab-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-lab-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-lab-neutral-900">Gestionar Usuarios</h3>
              <p className="text-xs text-lab-neutral-600 mt-1">Crear, editar y administrar usuarios</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/examenes"
          className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6 hover:border-lab-secondary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-lab-secondary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-lab-neutral-900">Gestionar Exámenes</h3>
              <p className="text-xs text-lab-neutral-600 mt-1">Agregar y configurar exámenes</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/auditoria"
          className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6 hover:border-lab-info-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-lab-info-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-lab-neutral-900">Ver Auditoría</h3>
              <p className="text-xs text-lab-neutral-600 mt-1">Revisar logs y actividad del sistema</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
