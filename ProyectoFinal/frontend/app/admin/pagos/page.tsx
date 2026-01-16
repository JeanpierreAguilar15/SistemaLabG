'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

interface Pago {
  id: string
  monto: number
  metodo: string
  estado: string
  referencia: string
  createdAt: string
  usuario: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  reserva: {
    id: string
    fecha: string
    horaInicio: string
    horaFin: string
    cancha: {
      nombre: string
      tipo: string
    }
  }
}

const estadoColors: Record<string, string> = {
  PENDIENTE: 'bg-orange-100 text-orange-700',
  COMPLETADO: 'bg-green-100 text-green-700',
  RECHAZADO: 'bg-red-100 text-red-700',
}

const metodoLabels: Record<string, string> = {
  EFECTIVO: 'Pago Presencial',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  QR: 'Pago QR',
}

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    cargarPagos()
  }, [filtroEstado])

  const cargarPagos = async () => {
    try {
      setLoading(true)
      const data = await api.getAllPagos(filtroEstado || undefined)
      setPagos(data)
    } catch (error) {
      showToast('Error al cargar los pagos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async (id: string) => {
    if (!confirm('¿Confirmas que el cliente realizo el pago presencial?')) return

    try {
      setActionLoading(id)
      await api.aprobarPago(id)
      showToast('Pago aprobado exitosamente', 'success')
      cargarPagos()
    } catch (error) {
      showToast('Error al aprobar el pago', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRechazar = async (id: string) => {
    const motivo = prompt('Motivo del rechazo (opcional):')
    if (motivo === null) return // Usuario cancelo el prompt

    try {
      setActionLoading(id)
      await api.rechazarPago(id, motivo || undefined)
      showToast('Pago rechazado y reserva cancelada', 'success')
      cargarPagos()
    } catch (error) {
      showToast('Error al rechazar el pago', 'error')
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

  const formatFechaCompleta = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const limpiarFiltros = () => {
    setFiltroEstado('')
  }

  const pagosPendientes = pagos.filter(p => p.estado === 'PENDIENTE').length

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion de Pagos</h1>
        <div className="flex items-center gap-4">
          {pagosPendientes > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              {pagosPendientes} pendiente{pagosPendientes > 1 ? 's' : ''}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{pagos.length} pagos</span>
          </div>
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
              <option value="COMPLETADO">Completado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
          {filtroEstado && (
            <button
              onClick={limpiarFiltros}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando pagos...</p>
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">No se encontraron pagos</p>
            {filtroEstado && (
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Referencia</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reserva</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Metodo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagos.map((pago) => (
                  <tr key={pago.id} className={`hover:bg-gray-50 transition-colors ${pago.estado === 'PENDIENTE' ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-700">{pago.referencia}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{pago.usuario.nombre} {pago.usuario.apellido}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[180px]" title={pago.usuario.email}>
                        {pago.usuario.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{pago.reserva.cancha.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {formatFecha(pago.reserva.fecha)} | {pago.reserva.horaInicio} - {pago.reserva.horaFin}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ${Number(pago.monto).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${pago.metodo === 'EFECTIVO' ? 'text-orange-600' : 'text-blue-600'}`}>
                        {pago.metodo === 'EFECTIVO' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                        {metodoLabels[pago.metodo] || pago.metodo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColors[pago.estado]}`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatFechaCompleta(pago.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {pago.estado === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => handleAprobar(pago.id)}
                              disabled={actionLoading === pago.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                              title="Aprobar pago"
                            >
                              {actionLoading === pago.id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRechazar(pago.id)}
                              disabled={actionLoading === pago.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                              title="Rechazar pago"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Rechazar
                            </button>
                          </>
                        )}
                        {pago.estado !== 'PENDIENTE' && (
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
