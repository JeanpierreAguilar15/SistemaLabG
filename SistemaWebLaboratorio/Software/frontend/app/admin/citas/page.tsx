'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface Cita {
  codigo_cita: number
  codigo_paciente: number
  codigo_slot: number
  estado: string
  observaciones: string | null
  fecha_creacion: string
  paciente: {
    nombres: string
    apellidos: string
    email: string
    telefono: string | null
  }
  slot: {
    fecha: string
    hora_inicio: string
    hora_fin: string
    servicio: {
      nombre: string
    }
  }
}

export default function CitasAdminPage() {
  const { accessToken } = useAuthStore()
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODAS')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadCitas()
  }, [filtro])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadCitas = async () => {
    try {
      const params = new URLSearchParams()
      if (filtro !== 'TODAS') params.append('estado', filtro)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        // Handle both array and paginated response
        const citas = result.data || result
        setCitas(citas)
      }
    } catch (error) {
      console.error('Error loading citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (codigo_cita: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas/${codigo_cita}/confirm`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cita confirmada correctamente' })
        loadCitas()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al confirmar cita' })
    }
  }

  const handleUpdateEstado = async (codigo_cita: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas/${codigo_cita}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Cita marcada como ${nuevoEstado}` })
        loadCitas()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar cita' })
    }
  }

  const handleViewDetails = (cita: Cita) => {
    setSelectedCita(cita)
    setShowDetailModal(true)
  }

  const handleEdit = (cita: Cita) => {
    setSelectedCita(cita)
    setShowEditModal(true)
  }

  const handleCancelCita = (cita: Cita) => {
    setSelectedCita(cita)
    setShowCancelModal(true)
  }

  const confirmCancel = async (motivoCancelacion: string) => {
    if (!selectedCita) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas/${selectedCita.codigo_cita}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ motivo_cancelacion: motivoCancelacion }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cita cancelada exitosamente' })
        loadCitas()
        setShowCancelModal(false)
        setSelectedCita(null)
      } else {
        setMessage({ type: 'error', text: 'Error al cancelar cita' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cancelar cita' })
    }
  }

  const handleSaveEdit = async (estado: string, observaciones: string) => {
    if (!selectedCita) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas/${selectedCita.codigo_cita}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ estado, observaciones }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cita actualizada exitosamente' })
        loadCitas()
        setShowEditModal(false)
        setSelectedCita(null)
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar cita' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar cita' })
    }
  }

  const filteredCitas = citas.filter((cita) => {
    const matchSearch =
      searchTerm === '' ||
      cita.paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.paciente.email.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'CONFIRMADA':
        return 'bg-lab-info-100 text-lab-info-800'
      case 'COMPLETADA':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'CANCELADA':
        return 'bg-lab-danger-100 text-lab-danger-800'
      case 'NO_ASISTIO':
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
        <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Citas</h1>
        <p className="text-lab-neutral-600 mt-2">Administra todas las citas programadas del sistema</p>
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
              <Label>Buscar Paciente</Label>
              <Input
                placeholder="Nombre, apellido o email..."
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
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="COMPLETADA">Completadas</option>
                <option value="CANCELADA">Canceladas</option>
                <option value="NO_ASISTIO">No Asistió</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Citas ({filteredCitas.length})</CardTitle>
          <CardDescription>Lista de citas programadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Paciente</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha y Hora</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Servicio</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Contacto</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCitas.map((cita) => (
                  <tr key={cita.codigo_cita} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">
                        {cita.paciente.nombres} {cita.paciente.apellidos}
                      </div>
                      <div className="text-sm text-lab-neutral-600">{cita.paciente.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">{formatDate(new Date(cita.slot.fecha))}</div>
                      <div className="text-sm text-lab-neutral-600">
                        {cita.slot.hora_inicio} - {cita.slot.hora_fin}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-700">{cita.slot.servicio.nombre}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-600">{cita.paciente.telefono || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2 flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(cita)}>
                          Ver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(cita)}>
                          Editar
                        </Button>
                        {cita.estado !== 'CANCELADA' && cita.estado !== 'COMPLETADA' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-lab-danger-600 hover:bg-lab-danger-50"
                            onClick={() => handleCancelCita(cita)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCitas.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">No se encontraron citas</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-lab-neutral-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-lab-neutral-900">Detalles de la Cita</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedCita(null)
                  }}
                  className="text-lab-neutral-400 hover:text-lab-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Patient Info */}
              <div className="bg-lab-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-lab-neutral-600 mb-1">Paciente</p>
                <p className="font-semibold text-lab-neutral-900">
                  {selectedCita.paciente.nombres} {selectedCita.paciente.apellidos}
                </p>
                <p className="text-sm text-lab-neutral-600">{selectedCita.paciente.email}</p>
                <p className="text-sm text-lab-neutral-600">{selectedCita.paciente.telefono || 'Sin teléfono'}</p>
              </div>

              {/* Appointment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-lab-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-lab-neutral-600 mb-1">Fecha</p>
                  <p className="font-semibold text-lab-neutral-900">{formatDate(new Date(selectedCita.slot.fecha))}</p>
                </div>
                <div className="bg-lab-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-lab-neutral-600 mb-1">Hora</p>
                  <p className="font-semibold text-lab-neutral-900">
                    {selectedCita.slot.hora_inicio} - {selectedCita.slot.hora_fin}
                  </p>
                </div>
              </div>

              <div className="bg-lab-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-lab-neutral-600 mb-1">Servicio</p>
                <p className="font-semibold text-lab-neutral-900">{selectedCita.slot.servicio.nombre}</p>
              </div>

              <div className="bg-lab-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-lab-neutral-600 mb-1">Estado</p>
                <span className={`text-sm px-3 py-1 rounded ${getEstadoBadge(selectedCita.estado)}`}>
                  {selectedCita.estado}
                </span>
              </div>

              {selectedCita.observaciones && (
                <div className="bg-lab-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-lab-neutral-600 mb-1">Observaciones</p>
                  <p className="text-sm text-lab-neutral-900">{selectedCita.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCita && (
        <EditCitaModal
          cita={selectedCita}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCita(null)
          }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedCita && (
        <CancelCitaModal
          cita={selectedCita}
          onClose={() => {
            setShowCancelModal(false)
            setSelectedCita(null)
          }}
          onConfirm={confirmCancel}
        />
      )}
    </div>
  )
}

// Edit Cita Modal Component
function EditCitaModal({
  cita,
  onClose,
  onSave,
}: {
  cita: Cita
  onClose: () => void
  onSave: (estado: string, observaciones: string) => void
}) {
  const [estado, setEstado] = useState(cita.estado)
  const [observaciones, setObservaciones] = useState(cita.observaciones || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(estado, observaciones)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-lab-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-lab-neutral-900">Editar Cita</h2>
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
              {cita.paciente.nombres} {cita.paciente.apellidos}
            </p>
            <p className="text-sm text-lab-neutral-600">
              {formatDate(new Date(cita.slot.fecha))} - {cita.slot.hora_inicio} a {cita.slot.hora_fin}
            </p>
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
              <option value="CONFIRMADA">Confirmada</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NO_ASISTIO">No Asistió</option>
            </select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-lab-neutral-300"
              placeholder="Notas adicionales sobre la cita..."
            />
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

// Cancel Cita Modal Component
function CancelCitaModal({
  cita,
  onClose,
  onConfirm,
}: {
  cita: Cita
  onClose: () => void
  onConfirm: (motivo: string) => void
}) {
  const [motivo, setMotivo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (motivo.trim()) {
      onConfirm(motivo)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-lab-neutral-200">
          <h2 className="text-xl font-bold text-lab-neutral-900">Cancelar Cita</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-lab-neutral-50 p-4 rounded-lg">
            <p className="text-sm text-lab-neutral-600">Paciente</p>
            <p className="font-semibold text-lab-neutral-900">
              {cita.paciente.nombres} {cita.paciente.apellidos}
            </p>
            <p className="text-sm text-lab-neutral-600">
              {formatDate(new Date(cita.slot.fecha))} - {cita.slot.hora_inicio}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de Cancelación *</Label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-lab-neutral-300"
              placeholder="Explique el motivo de la cancelación..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Volver
            </Button>
            <Button type="submit" className="bg-lab-danger-600 hover:bg-lab-danger-700">
              Confirmar Cancelación
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
