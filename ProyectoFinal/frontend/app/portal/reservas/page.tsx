'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

interface Reserva {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
  cancha: {
    nombre: string
    tipo: string
    precioPorHora: number
  }
  pago: {
    id: string
    estado: string
    referencia: string
  } | null
}

interface PoliticaCancelacion {
  puedeCancelar: boolean
  horasHastaReserva: number
  horasMinimas: number
  mensaje: string
}

const estadoColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
  COMPLETADA: 'bg-blue-100 text-blue-700',
}

const tipoIcons: Record<string, string> = {
  FUTBOL: '⚽',
  TENIS: '🎾',
  BASQUET: '🏀',
}

export default function MisReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string>('todas')
  const [cancelando, setCancelando] = useState<string | null>(null)
  const [modalCancelar, setModalCancelar] = useState<{ reserva: Reserva; politica: PoliticaCancelacion } | null>(null)
  const { showSuccess, showError, showWarning } = useToast()

  useEffect(() => {
    cargarReservas()
  }, [])

  const cargarReservas = async () => {
    try {
      const data = await api.getMisReservas()
      setReservas(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMostrarCancelar = async (reserva: Reserva) => {
    try {
      const politica = await api.verificarPoliticaCancelacion(reserva.id)
      setModalCancelar({ reserva, politica })
    } catch (error: any) {
      showError(error.message || 'Error al verificar politica')
    }
  }

  const handleConfirmarCancelar = async (forzar = false) => {
    if (!modalCancelar) return

    setCancelando(modalCancelar.reserva.id)
    try {
      await api.cancelarReserva(modalCancelar.reserva.id, forzar)
      showSuccess('Reserva cancelada exitosamente')
      setModalCancelar(null)
      cargarReservas()
    } catch (error: any) {
      showError(error.message || 'Error al cancelar')
    } finally {
      setCancelando(null)
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const reservasFiltradas = reservas.filter(r => {
    if (filtro === 'todas') return true
    if (filtro === 'proximas') return r.estado === 'CONFIRMADA' && new Date(r.fecha) >= new Date()
    if (filtro === 'pendientes') return r.estado === 'PENDIENTE'
    if (filtro === 'pasadas') return r.estado === 'COMPLETADA' || new Date(r.fecha) < new Date()
    return true
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mis Reservas</h1>
        <Link href="/canchas" className="btn-primary">
          + Nueva Reserva
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['todas', 'proximas', 'pendientes', 'pasadas'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-full capitalize transition-colors ${
              filtro === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f === 'proximas' ? 'Próximas' : f}
          </button>
        ))}
      </div>

      {/* Lista de Reservas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : reservasFiltradas.length > 0 ? (
        <div className="space-y-4">
          {reservasFiltradas.map((reserva) => (
            <div key={reserva.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-3xl">{tipoIcons[reserva.cancha.tipo]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{reserva.cancha.nombre}</h3>
                    <p className="text-gray-600">
                      {formatFecha(reserva.fecha)} • {reserva.horaInicio} - {reserva.horaFin}
                    </p>
                    <p className="text-sm text-gray-500">
                      Bs. {reserva.cancha.precioPorHora}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${estadoColors[reserva.estado]}`}>
                    {reserva.estado}
                  </span>

                  {reserva.estado === 'PENDIENTE' && !reserva.pago && (
                    <Link
                      href={`/portal/reservas/${reserva.id}/pagar`}
                      className="btn-primary text-sm"
                    >
                      Pagar
                    </Link>
                  )}

                  {(reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA') && (
                    <button
                      onClick={() => handleMostrarCancelar(reserva)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Cancelar
                    </button>
                  )}

                  {reserva.pago && (
                    <span className="text-xs text-gray-500">
                      Ref: {reserva.pago.referencia}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No tienes reservas</p>
          <Link href="/canchas" className="btn-primary">
            Hacer mi primera reserva
          </Link>
        </div>
      )}

      {/* Modal de Cancelacion */}
      {modalCancelar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">
                Cancelar Reserva
              </h3>
              <p className="text-center text-gray-600 mb-4">
                {modalCancelar.reserva.cancha.nombre} - {formatFecha(modalCancelar.reserva.fecha)} {modalCancelar.reserva.horaInicio}
              </p>

              {modalCancelar.politica.puedeCancelar ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-800 font-medium">Cancelacion sin penalidad</p>
                      <p className="text-green-700 text-sm">{modalCancelar.politica.mensaje}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-amber-800 font-medium">Cancelacion tardia</p>
                      <p className="text-amber-700 text-sm">{modalCancelar.politica.mensaje}</p>
                      <p className="text-amber-600 text-xs mt-1">
                        La politica requiere cancelar con al menos {modalCancelar.politica.horasMinimas} horas de anticipacion.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setModalCancelar(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={cancelando !== null}
                >
                  Volver
                </button>
                <button
                  onClick={() => handleConfirmarCancelar(!modalCancelar.politica.puedeCancelar)}
                  disabled={cancelando !== null}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {cancelando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Cancelando...
                    </>
                  ) : (
                    'Confirmar Cancelacion'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
