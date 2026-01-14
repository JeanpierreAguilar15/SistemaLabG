'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface Pago {
  codigo_pago: number
  codigo_cotizacion: number
  codigo_paciente: number
  monto_total: number
  metodo_pago: string
  referencia_pago: string | null
  estado: string
  observaciones: string | null
  fecha_pago: string
  fecha_creacion: string
  paciente?: {
    nombres: string
    apellidos: string
    email: string
  }
  cotizacion?: {
    numero_cotizacion: string
    total: number
  }
}

export default function PagosAdminPage() {
  const { accessToken } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [filters, setFilters] = useState({
    estado: '',
    metodo_pago: '',
    fecha_desde: '',
    fecha_hasta: '',
  })

  // Modal
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevoMonto, setNuevoMonto] = useState('')
  const [nuevoMetodo, setNuevoMetodo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    loadPagos()
  }, [])

  const loadPagos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.metodo_pago) params.append('metodo_pago', filters.metodo_pago)
      if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
      if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pagos/admin/all?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setPagos(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Error loading pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePago = async () => {
    if (!selectedPago || !nuevoEstado) return

    const montoNum = parseFloat(nuevoMonto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setMessage({ type: 'error', text: 'El monto debe ser un número positivo' })
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pagos/admin/${selectedPago.codigo_pago}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            estado: nuevoEstado,
            monto: montoNum,
            metodo_pago: nuevoMetodo,
            observaciones,
          }),
        }
      )

      if (response.ok) {
        setMessage({ type: 'success', text: 'Pago actualizado correctamente' })
        loadPagos() // Recargar para obtener datos actualizados
        setSelectedPago(null)
        setNuevoEstado('')
        setNuevoMonto('')
        setNuevoMetodo('')
        setObservaciones('')
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al actualizar el pago' })
      }
    } catch (error) {
      console.error('Error updating pago:', error)
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setUpdating(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMADO':
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800'
      case 'RECHAZADO':
      case 'CANCELADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0)
  }

  // Pagination
  const totalPages = Math.ceil(pagos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPagos = pagos.slice(startIndex, startIndex + itemsPerPage)

  if (loading && pagos.length === 0) {
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
        <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Pagos</h1>
        <p className="text-lab-neutral-600 mt-2">
          Administra y supervisa todos los pagos del sistema. Edita montos y confirma pagos.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-current opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="COMPLETADO">Completado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <select
                value={filters.metodo_pago}
                onChange={(e) => setFilters({ ...filters, metodo_pago: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="">Todos</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button onClick={loadPagos} className="w-full">
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total Pagos</div>
            <div className="text-2xl font-bold text-lab-neutral-900 mt-1">{pagos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Monto Total</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(pagos.reduce((sum, p) => sum + (Number(p.monto_total) || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {pagos.filter(p => p.estado === 'PENDIENTE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Confirmados</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {pagos.filter(p => ['CONFIRMADO', 'COMPLETADO'].includes(p.estado)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Pagos</CardTitle>
          <CardDescription>Click en un pago para gestionar su estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">ID</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Paciente</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Cotización</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Monto</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Método</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPagos.map((pago) => (
                  <tr key={pago.codigo_pago} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                    <td className="p-4 text-sm font-mono">{pago.codigo_pago}</td>
                    <td className="p-4">
                      {pago.paciente ? (
                        <div>
                          <div className="font-medium text-sm">
                            {pago.paciente.nombres} {pago.paciente.apellidos}
                          </div>
                          <div className="text-xs text-lab-neutral-500">{pago.paciente.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-lab-neutral-500">ID: {pago.codigo_paciente}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-mono">
                      {pago.cotizacion?.numero_cotizacion || `#${pago.codigo_cotizacion}`}
                    </td>
                    <td className="p-4 text-sm font-bold text-green-600">
                      {formatCurrency(Number(pago.monto_total))}
                    </td>
                    <td className="p-4 text-sm">{pago.metodo_pago}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoBadge(pago.estado)}`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-600">
                      {formatDate(new Date(pago.fecha_pago || pago.fecha_creacion))}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPago(pago)
                          setNuevoEstado(pago.estado)
                          setNuevoMonto(String(Number(pago.monto_total) || 0))
                          setNuevoMetodo(pago.metodo_pago || 'EFECTIVO')
                          setObservaciones(pago.observaciones || '')
                        }}
                      >
                        Gestionar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagos.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">
                No se encontraron pagos
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <div className="text-sm text-lab-neutral-600">
                Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, pagos.length)} de {pagos.length}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para gestionar pago */}
      {selectedPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Gestionar Pago #{selectedPago.codigo_pago}</h3>
              <button
                onClick={() => setSelectedPago(null)}
                className="text-lab-neutral-400 hover:text-lab-neutral-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Información de cotización */}
              <div className="p-3 bg-lab-neutral-50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-lab-neutral-600">Cotización:</span>
                  <span className="font-mono">{selectedPago.cotizacion?.numero_cotizacion || `#${selectedPago.codigo_cotizacion}`}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-lab-neutral-600">Referencia:</span>
                  <span>{selectedPago.referencia_pago || '-'}</span>
                </div>
              </div>

              {/* Monto editable */}
              <div className="space-y-2">
                <Label>Monto ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  className="font-bold text-green-600"
                />
                {selectedPago.cotizacion?.total && (
                  <p className="text-xs text-lab-neutral-500">
                    Total cotización: {formatCurrency(Number(selectedPago.cotizacion.total))}
                  </p>
                )}
              </div>

              {/* Método de pago */}
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <select
                  value={nuevoMetodo}
                  onChange={(e) => setNuevoMetodo(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label>Estado del Pago</Label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full h-20 px-3 py-2 rounded-md border border-lab-neutral-300 text-sm"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedPago(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePago} disabled={updating}>
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
