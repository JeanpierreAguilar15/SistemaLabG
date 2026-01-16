'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

interface Reserva {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
  total: number
  usuario: {
    nombre: string
    apellido: string
    email: string
  }
  cancha: {
    nombre: string
    tipo: string
  }
}

const estadoColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
  COMPLETADA: 'bg-blue-100 text-blue-700',
}

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    cargarReservas()
  }, [filtroEstado, filtroFecha])

  const cargarReservas = async () => {
    try {
      setLoading(true)
      const data = await api.getAllReservas(filtroEstado || undefined, filtroFecha || undefined)
      setReservas(data)
    } catch (error) {
      showToast('Error al cargar las reservas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async (id: string) => {
    try {
      setActionLoading(id)
      await api.confirmarReserva(id)
      showToast('Reserva confirmada exitosamente', 'success')
      cargarReservas()
    } catch (error) {
      showToast('Error al confirmar la reserva', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelar = async (id: string) => {
    if (!confirm('¿Estas seguro de cancelar esta reserva?')) return

    try {
      setActionLoading(id)
      await api.cancelarReservaAdmin(id)
      showToast('Reserva cancelada exitosamente', 'success')
      cargarReservas()
    } catch (error) {
      showToast('Error al cancelar la reserva', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const limpiarFiltros = () => {
    setFiltroEstado('')
    setFiltroFecha('')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion de Reservas</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{reservas.length} reservas</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="COMPLETADA">Completada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          {(filtroEstado || filtroFecha) && (
            <button
              onClick={limpiarFiltros}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando reservas...</p>
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">No se encontraron reservas</p>
            {(filtroEstado || filtroFecha) && (
              <button
                onClick={limpiarFiltros}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cancha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{reserva.usuario.nombre} {reserva.usuario.apellido}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]" title={reserva.usuario.email}>
                        {reserva.usuario.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{reserva.cancha.nombre}</p>
                      <p className="text-sm text-gray-500">{reserva.cancha.tipo}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{formatFecha(reserva.fecha)}</td>
                    <td className="px-6 py-4 text-gray-700">{reserva.horaInicio} - {reserva.horaFin}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">${reserva.total?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColors[reserva.estado]}`}>
                        {reserva.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {reserva.estado === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => handleConfirmar(reserva.id)}
                              disabled={actionLoading === reserva.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {actionLoading === reserva.id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleCancelar(reserva.id)}
                              disabled={actionLoading === reserva.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancelar
                            </button>
                          </>
                        )}
                        {reserva.estado === 'CONFIRMADA' && (
                          <button
                            onClick={() => handleCancelar(reserva.id)}
                            disabled={actionLoading === reserva.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {actionLoading === reserva.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            Cancelar
                          </button>
                        )}
                        {(reserva.estado === 'CANCELADA' || reserva.estado === 'COMPLETADA') && (
                          <span className="text-sm text-gray-400">Sin acciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
