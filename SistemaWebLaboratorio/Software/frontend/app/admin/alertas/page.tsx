'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Alerta {
  codigo_item: number
  codigo_interno: string
  nombre: string
  stock_actual: number
  stock_minimo: number
  stock_maximo: number | null
  unidad_medida: string
  tipo_alerta: string
  mensaje: string
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  codigo_lote?: number
  numero_lote?: string
  fecha_vencimiento?: string
  dias_hasta_vencimiento?: number
}

interface Estadisticas {
  total: number
  criticas: number
  altas: number
  medias: number
  bajas: number
  por_tipo: {
    stock_critico: number
    stock_bajo: number
    vencidos: number
    proximos_vencer: number
  }
}

interface Message {
  type: 'success' | 'error'
  text: string
}

const TIPO_ALERTA_CONFIG = {
  STOCK_CRITICO: { label: 'Sin Stock', color: 'bg-lab-danger-100 text-lab-danger-800', icon: '⛔' },
  STOCK_BAJO: { label: 'Stock Bajo', color: 'bg-lab-warning-100 text-lab-warning-800', icon: '⚠️' },
  VENCIDO: { label: 'Vencido', color: 'bg-lab-danger-100 text-lab-danger-800', icon: '🚫' },
  PROXIMO_VENCER: { label: 'Por Vencer', color: 'bg-lab-warning-100 text-lab-warning-800', icon: '⏰' },
}

const PRIORIDAD_CONFIG = {
  CRITICA: { label: 'Crítica', color: 'bg-lab-danger-600 text-white', badge: '🔴' },
  ALTA: { label: 'Alta', color: 'bg-lab-warning-600 text-white', badge: '🟠' },
  MEDIA: { label: 'Media', color: 'bg-lab-primary-500 text-white', badge: '🟡' },
  BAJA: { label: 'Baja', color: 'bg-lab-neutral-400 text-white', badge: '⚪' },
}

export default function AlertasStockPage() {
  const { accessToken } = useAuthStore()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  // Filtros
  const [filterTipo, setFilterTipo] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && accessToken) {
      loadAlertas()
      loadEstadisticas()
    }
  }, [accessToken, mounted])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadAlertas = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filterTipo) params.append('tipo', filterTipo)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/alertas?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAlertas(data)
      } else {
        setMessage({ type: 'error', text: 'Error al cargar alertas' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    } finally {
      setLoading(false)
    }
  }

  const loadEstadisticas = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/alertas/estadisticas`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleApplyFilters = () => {
    loadAlertas()
  }

  const handleClearFilters = () => {
    setFilterTipo('')
    setFilterPrioridad('')
    setTimeout(() => loadAlertas(), 100)
  }

  const filteredAlertas = alertas.filter((alerta) => {
    if (filterPrioridad && alerta.prioridad !== filterPrioridad) return false
    return true
  })

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Alertas de Inventario</h1>
          <p className="text-lab-neutral-600 mt-2">
            Monitoreo de stock bajo, productos vencidos y próximos a vencer
          </p>
        </div>
        <Button onClick={loadAlertas} className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-lab-neutral-600">Total Alertas</div>
              <div className="text-3xl font-bold text-lab-neutral-900 mt-2">{estadisticas.total}</div>
            </CardContent>
          </Card>
          <Card className="border-lab-danger-200 bg-lab-danger-50">
            <CardContent className="pt-6">
              <div className="text-sm text-lab-danger-700 font-medium">🔴 Críticas</div>
              <div className="text-3xl font-bold text-lab-danger-800 mt-2">{estadisticas.criticas}</div>
            </CardContent>
          </Card>
          <Card className="border-lab-warning-200 bg-lab-warning-50">
            <CardContent className="pt-6">
              <div className="text-sm text-lab-warning-700 font-medium">🟠 Altas</div>
              <div className="text-3xl font-bold text-lab-warning-800 mt-2">{estadisticas.altas}</div>
            </CardContent>
          </Card>
          <Card className="border-lab-primary-200 bg-lab-primary-50">
            <CardContent className="pt-6">
              <div className="text-sm text-lab-primary-700 font-medium">🟡 Medias</div>
              <div className="text-3xl font-bold text-lab-primary-800 mt-2">{estadisticas.medias}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-lab-neutral-600">⚪ Bajas</div>
              <div className="text-3xl font-bold text-lab-neutral-700 mt-2">{estadisticas.bajas}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tipos de Alerta */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-lab-neutral-600">⛔ Sin Stock</div>
              <div className="text-2xl font-bold text-lab-danger-600 mt-2">
                {estadisticas.por_tipo.stock_critico}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-lab-neutral-600">⚠️ Stock Bajo</div>
              <div className="text-2xl font-bold text-lab-warning-600 mt-2">
                {estadisticas.por_tipo.stock_bajo}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-lab-neutral-600">🚫 Vencidos</div>
              <div className="text-2xl font-bold text-lab-danger-600 mt-2">
                {estadisticas.por_tipo.vencidos}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-lab-neutral-600">⏰ Por Vencer</div>
              <div className="text-2xl font-bold text-lab-warning-600 mt-2">
                {estadisticas.por_tipo.proximos_vencer}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                Tipo de Alerta
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
              >
                <option value="">Todos los tipos</option>
                <option value="STOCK_CRITICO">⛔ Sin Stock</option>
                <option value="STOCK_BAJO">⚠️ Stock Bajo</option>
                <option value="VENCIDO">🚫 Vencido</option>
                <option value="PROXIMO_VENCER">⏰ Por Vencer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                Prioridad
              </label>
              <select
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
                className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
              >
                <option value="">Todas las prioridades</option>
                <option value="CRITICA">🔴 Crítica</option>
                <option value="ALTA">🟠 Alta</option>
                <option value="MEDIA">🟡 Media</option>
                <option value="BAJA">⚪ Baja</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex space-x-3">
                <Button onClick={handleApplyFilters} className="bg-lab-primary-600 hover:bg-lab-primary-700">
                  Aplicar
                </Button>
                <Button onClick={handleClearFilters} variant="outline">
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas Activas ({filteredAlertas.length})</CardTitle>
          <CardDescription>Productos que requieren atención inmediata</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-lab-neutral-200">
                    <th className="text-left p-4 font-semibold text-lab-neutral-900">Prioridad</th>
                    <th className="text-left p-4 font-semibold text-lab-neutral-900">Tipo</th>
                    <th className="text-left p-4 font-semibold text-lab-neutral-900">Producto</th>
                    <th className="text-center p-4 font-semibold text-lab-neutral-900">Stock</th>
                    <th className="text-left p-4 font-semibold text-lab-neutral-900">Mensaje</th>
                    <th className="text-left p-4 font-semibold text-lab-neutral-900">Lote</th>
                    <th className="text-center p-4 font-semibold text-lab-neutral-900">Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlertas.map((alerta, index) => {
                    const prioridadStyle = PRIORIDAD_CONFIG[alerta.prioridad]
                    const tipoStyle = TIPO_ALERTA_CONFIG[alerta.tipo_alerta]

                    return (
                      <tr key={index} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                        <td className="p-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${prioridadStyle.color}`}>
                            {prioridadStyle.badge} {prioridadStyle.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded ${tipoStyle.color}`}>
                            {tipoStyle.icon} {tipoStyle.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-lab-neutral-900">{alerta.nombre}</div>
                          <div className="text-xs text-lab-neutral-600">{alerta.codigo_interno}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-semibold text-lab-neutral-900">
                            {alerta.stock_actual} {alerta.unidad_medida}
                          </div>
                          <div className="text-xs text-lab-neutral-600">
                            Min: {alerta.stock_minimo}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-lab-neutral-700">
                          {alerta.mensaje}
                        </td>
                        <td className="p-4 text-sm text-lab-neutral-600">
                          {alerta.numero_lote || '-'}
                        </td>
                        <td className="p-4 text-center text-sm">
                          {alerta.fecha_vencimiento ? (
                            <div>
                              <div className="text-lab-neutral-900">
                                {formatDate(alerta.fecha_vencimiento)}
                              </div>
                              {alerta.dias_hasta_vencimiento !== undefined && (
                                <div className={`text-xs ${
                                  alerta.dias_hasta_vencimiento < 0
                                    ? 'text-lab-danger-600 font-semibold'
                                    : alerta.dias_hasta_vencimiento <= 7
                                    ? 'text-lab-warning-600 font-semibold'
                                    : 'text-lab-neutral-600'
                                }`}>
                                  {alerta.dias_hasta_vencimiento < 0
                                    ? `Vencido hace ${Math.abs(alerta.dias_hasta_vencimiento)} días`
                                    : `${alerta.dias_hasta_vencimiento} días`
                                  }
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredAlertas.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <div className="text-xl font-semibold text-lab-success-600 mb-2">
                    ¡No hay alertas activas!
                  </div>
                  <div className="text-lab-neutral-600">
                    Todo el inventario está en niveles óptimos
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
