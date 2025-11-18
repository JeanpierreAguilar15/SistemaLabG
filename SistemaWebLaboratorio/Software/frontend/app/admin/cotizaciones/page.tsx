'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface CotizacionDetalle {
  codigo_detalle: number
  codigo_examen: number
  cantidad: number
  precio_unitario: number
  total_linea: number
  examen: {
    codigo_examen: number
    nombre: string
    precio: number
  }
}

interface Cotizacion {
  codigo_cotizacion: number
  numero_cotizacion: string
  codigo_paciente: number
  fecha_cotizacion: string
  fecha_expiracion: string
  subtotal: number
  descuento: number
  total: number
  estado: string
  observaciones?: string
  paciente: {
    nombres: string
    apellidos: string
    email: string
  }
  detalles: CotizacionDetalle[]
}

export default function CotizacionesAdminPage() {
  const { accessToken } = useAuthStore()
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODAS')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadCotizaciones()
  }, [filtro])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadCotizaciones = async () => {
    try {
      const params = new URLSearchParams()
      if (filtro !== 'TODAS') params.append('estado', filtro)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        // Handle both array and paginated response
        const cotizaciones = result.data || result
        setCotizaciones(cotizaciones)
      }
    } catch (error) {
      console.error('Error loading cotizaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEstado = async (codigo_cotizacion: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/admin/${codigo_cotizacion}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Cotización ${nuevoEstado.toLowerCase()}` })
        loadCotizaciones()
        setShowDetailModal(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar cotización' })
    }
  }

  const handleViewDetails = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion)
    setShowDetailModal(true)
  }

  const handleEdit = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion)
    setShowEditModal(true)
  }

  const handleDelete = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedCotizacion) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/admin/${selectedCotizacion.codigo_cotizacion}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cotización eliminada exitosamente' })
        loadCotizaciones()
        setShowDeleteModal(false)
        setSelectedCotizacion(null)
      } else {
        setMessage({ type: 'error', text: 'Error al eliminar cotización' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar cotización' })
    }
  }

  const handleSaveEdit = async (estado: string, descuento: number, observaciones: string) => {
    if (!selectedCotizacion) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/admin/${selectedCotizacion.codigo_cotizacion}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            estado,
            descuento,
            observaciones,
          }),
        }
      )

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cotización actualizada exitosamente' })
        loadCotizaciones()
        setShowEditModal(false)
        setSelectedCotizacion(null)
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar cotización' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar cotización' })
    }
  }

  const filteredCotizaciones = cotizaciones.filter((cotizacion) => {
    const matchSearch =
      searchTerm === '' ||
      cotizacion.numero_cotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotizacion.paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotizacion.paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'APROBADA':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'RECHAZADA':
        return 'bg-lab-danger-100 text-lab-danger-800'
      case 'CONVERTIDA_A_PAGO':
        return 'bg-lab-info-100 text-lab-info-800'
      case 'EXPIRADA':
        return 'bg-lab-neutral-100 text-lab-neutral-800'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-600'
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
        <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Cotizaciones</h1>
        <p className="text-lab-neutral-600 mt-2">
          Administra todas las cotizaciones del sistema. Aprueba o rechaza solicitudes de pacientes.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex justify-between items-center ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4 hover:opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Número, paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Estado</Label>
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="TODAS">Todas</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="APROBADA">Aprobadas</option>
                <option value="RECHAZADA">Rechazadas</option>
                <option value="CONVERTIDA_A_PAGO">Convertidas a Pago</option>
                <option value="EXPIRADA">Expiradas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cotizaciones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones ({filteredCotizaciones.length})</CardTitle>
          <CardDescription>Lista de cotizaciones generadas por pacientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Número</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Paciente</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Items</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Total</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCotizaciones.map((cotizacion) => (
                  <tr
                    key={cotizacion.codigo_cotizacion}
                    className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50"
                  >
                    <td className="p-4 font-mono text-sm text-lab-neutral-700">{cotizacion.numero_cotizacion}</td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">
                        {cotizacion.paciente.nombres} {cotizacion.paciente.apellidos}
                      </div>
                      <div className="text-sm text-lab-neutral-600">{cotizacion.paciente.email}</div>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-700">
                      {formatDate(new Date(cotizacion.fecha_cotizacion))}
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-700">{cotizacion.detalles?.length || 0} examen(es)</td>
                    <td className="p-4 font-semibold text-lab-neutral-900">${Number(cotizacion.total).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(cotizacion.estado)}`}>
                        {cotizacion.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(cotizacion)}>
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(cotizacion)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-lab-danger-600 hover:bg-lab-danger-50"
                        onClick={() => handleDelete(cotizacion)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCotizaciones.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">No se encontraron cotizaciones</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-lab-neutral-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-lab-neutral-900">
                    Cotización {selectedCotizacion.numero_cotizacion}
                  </h2>
                  <p className="text-sm text-lab-neutral-600 mt-1">
                    {selectedCotizacion.paciente.nombres} {selectedCotizacion.paciente.apellidos}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-lab-neutral-400 hover:text-lab-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Items */}
              <div>
                <h3 className="font-semibold text-lab-neutral-900 mb-3">Exámenes Solicitados</h3>
                <div className="space-y-2">
                  {selectedCotizacion.detalles?.map((detalle, index) => (
                    <div key={detalle.codigo_detalle} className="flex justify-between items-center p-3 bg-lab-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-lab-neutral-900">{detalle.examen?.nombre || 'Examen'}</p>
                        <p className="text-sm text-lab-neutral-600">
                          {detalle.cantidad} x ${Number(detalle.precio_unitario).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-lab-neutral-900">${Number(detalle.total_linea).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-lab-neutral-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-lab-neutral-600">Subtotal:</span>
                  <span className="font-semibold">${Number(selectedCotizacion.subtotal).toFixed(2)}</span>
                </div>
                {Number(selectedCotizacion.descuento) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-lab-neutral-600">Descuento:</span>
                    <span className="font-semibold text-lab-success-600">
                      -${Number(selectedCotizacion.descuento).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-lab-neutral-200">
                  <span>Total:</span>
                  <span className="text-lab-primary-600">${Number(selectedCotizacion.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Estado actual */}
              <div className="p-4 bg-lab-neutral-50 rounded-lg">
                <p className="text-sm text-lab-neutral-600 mb-1">Estado Actual</p>
                <span className={`text-sm px-3 py-1 rounded ${getEstadoBadge(selectedCotizacion.estado)}`}>
                  {selectedCotizacion.estado}
                </span>
              </div>

              {/* Actions */}
              {selectedCotizacion.estado === 'PENDIENTE' && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
                  <Button
                    variant="outline"
                    className="text-lab-danger-600"
                    onClick={() => handleUpdateEstado(selectedCotizacion.codigo_cotizacion, 'RECHAZADA')}
                  >
                    Rechazar
                  </Button>
                  <Button onClick={() => handleUpdateEstado(selectedCotizacion.codigo_cotizacion, 'APROBADA')}>
                    Aprobar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCotizacion && (
        <EditCotizacionModal
          cotizacion={selectedCotizacion}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCotizacion(null)
          }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-lab-neutral-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-lab-neutral-600 mb-6">
              ¿Estás seguro de que deseas eliminar la cotización{' '}
              <span className="font-semibold">{selectedCotizacion.numero_cotizacion}</span>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedCotizacion(null)
                }}
              >
                Cancelar
              </Button>
              <Button className="bg-lab-danger-600 hover:bg-lab-danger-700" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Cotizacion Modal Component
function EditCotizacionModal({
  cotizacion,
  onClose,
  onSave,
}: {
  cotizacion: Cotizacion
  onClose: () => void
  onSave: (estado: string, descuento: number, observaciones: string) => void
}) {
  const [estado, setEstado] = useState(cotizacion.estado)
  const [descuento, setDescuento] = useState(Number(cotizacion.descuento))
  const [observaciones, setObservaciones] = useState(cotizacion.observaciones || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(estado, descuento, observaciones)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-lab-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-lab-neutral-900">
              Editar Cotización {cotizacion.numero_cotizacion}
            </h2>
            <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Info (readonly) */}
          <div className="bg-lab-neutral-50 p-4 rounded-lg">
            <p className="text-sm text-lab-neutral-600">Paciente</p>
            <p className="font-semibold text-lab-neutral-900">
              {cotizacion.paciente.nombres} {cotizacion.paciente.apellidos}
            </p>
            <p className="text-sm text-lab-neutral-600">{cotizacion.paciente.email}</p>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              required
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
              <option value="CONVERTIDA_A_PAGO">Convertida a Pago</option>
              <option value="EXPIRADA">Expirada</option>
            </select>
          </div>

          {/* Descuento */}
          <div className="space-y-2">
            <Label htmlFor="descuento">Descuento ($)</Label>
            <Input
              id="descuento"
              type="number"
              step="0.01"
              min="0"
              max={Number(cotizacion.subtotal)}
              value={descuento}
              onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-lab-neutral-300"
              placeholder="Notas o comentarios sobre la cotización..."
            />
          </div>

          {/* Summary */}
          <div className="bg-lab-neutral-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-lab-neutral-600">Subtotal:</span>
              <span className="font-semibold">${Number(cotizacion.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-lab-neutral-600">Descuento:</span>
              <span className="font-semibold text-lab-success-600">-${descuento.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-lab-neutral-200">
              <span>Total:</span>
              <span className="text-lab-primary-600">
                ${(Number(cotizacion.subtotal) - descuento).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
