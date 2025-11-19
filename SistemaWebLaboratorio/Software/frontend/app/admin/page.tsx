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
    completed: number
    completionRate: number
  }
  results: {
    pending: number
  }
  inventory: {
    lowStock: number
  }
  revenue: {
    monthly: number
    total: number
  }
  quotations: {
    total: number
    approved: number
    pending: number
    conversionRate: number
  }
  topExams: Array<{
    name: string
    count: number
  }>
  weeklyTrend: Array<{
    date: Date
    appointments: number
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
        {/* Ingresos del Mes */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Ingresos del Mes</p>
              <p className="text-3xl font-bold text-lab-success-600 mt-2">
                ${(stats?.revenue.monthly || 0).toFixed(2)}
              </p>
              <p className="text-sm text-lab-neutral-500 mt-1">Total histórico: ${(stats?.revenue.total || 0).toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-lab-success-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Cotizaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Cotizaciones</p>
              <p className="text-3xl font-bold text-lab-neutral-900 mt-2">{stats?.quotations.total || 0}</p>
              <p className="text-sm text-lab-success-600 mt-1">
                {stats?.quotations.conversionRate || 0}% convertidas
              </p>
            </div>
            <div className="w-12 h-12 bg-lab-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <p className="text-sm font-medium text-lab-neutral-600">Citas</p>
              <p className="text-3xl font-bold text-lab-neutral-900 mt-2">{stats?.appointments.total || 0}</p>
              <p className="text-sm text-lab-info-600 mt-1">
                {stats?.appointments.completionRate || 0}% completadas • {stats?.appointments.today || 0} hoy
              </p>
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

        {/* Resultados Pendientes */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">Resultados Pendientes</p>
              <p className="text-3xl font-bold text-lab-warning-600 mt-2">{stats?.results.pending || 0}</p>
              <p className="text-sm text-lab-neutral-500 mt-1">Requieren procesamiento</p>
            </div>
            <div className="w-12 h-12 bg-lab-warning-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
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

      {/* Business Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Exámenes */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200">
          <div className="px-6 py-4 border-b border-lab-neutral-200">
            <h2 className="text-lg font-semibold text-lab-neutral-900">Exámenes Más Solicitados</h2>
            <p className="text-sm text-lab-neutral-600 mt-1">Top 5 exámenes del período</p>
          </div>
          <div className="p-6">
            {stats?.topExams && stats.topExams.length > 0 ? (
              <div className="space-y-4">
                {stats.topExams.map((exam, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-lab-success-100 text-lab-success-700' :
                        index === 1 ? 'bg-lab-info-100 text-lab-info-700' :
                        'bg-lab-neutral-100 text-lab-neutral-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-lab-neutral-900">{exam.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-lab-neutral-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-lab-success-500' :
                            index === 1 ? 'bg-lab-info-500' :
                            'bg-lab-neutral-400'
                          }`}
                          style={{
                            width: `${Math.min((exam.count / (stats.topExams[0]?.count || 1)) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-lab-neutral-900 w-12 text-right">
                        {exam.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-lab-neutral-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Métricas Adicionales */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200">
          <div className="px-6 py-4 border-b border-lab-neutral-200">
            <h2 className="text-lg font-semibold text-lab-neutral-900">Resumen Operativo</h2>
            <p className="text-sm text-lab-neutral-600 mt-1">Métricas clave del sistema</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Usuarios */}
            <div className="flex items-center justify-between p-4 bg-lab-neutral-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-lab-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-lab-neutral-900">Usuarios del Sistema</p>
                  <p className="text-xs text-lab-neutral-600">{stats?.users.active || 0} activos de {stats?.users.total || 0} totales</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-lab-neutral-900">{stats?.users.total || 0}</div>
            </div>

            {/* Catálogo */}
            <div className="flex items-center justify-between p-4 bg-lab-neutral-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-lab-secondary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-lab-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-lab-neutral-900">Exámenes en Catálogo</p>
                  <p className="text-xs text-lab-neutral-600">Servicios activos</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-lab-neutral-900">{stats?.exams.total || 0}</div>
            </div>

            {/* Inventario */}
            <div className="flex items-center justify-between p-4 bg-lab-warning-50 rounded-lg border border-lab-warning-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-lab-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-lab-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-lab-warning-900">Items con Stock Bajo</p>
                  <p className="text-xs text-lab-warning-700">Requiere reabastecimiento</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-lab-warning-600">{stats?.inventory.lowStock || 0}</div>
            </div>
          </div>
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
