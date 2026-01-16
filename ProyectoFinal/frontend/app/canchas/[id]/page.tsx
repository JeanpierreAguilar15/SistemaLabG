'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'

interface Cancha {
  id: string
  nombre: string
  tipo: string
  descripcion: string
  precioPorHora: number
}

interface Slot {
  horaInicio: string
  horaFin: string
  disponible: boolean
}

interface Disponibilidad {
  disponible: boolean
  fecha: string
  cancha: string
  horario: string
  slots: Slot[]
  mensaje?: string
}

const tipoIcons: Record<string, string> = {
  FUTBOL: '⚽',
  TENIS: '🎾',
  BASQUET: '🏀',
}

const tipoGradients: Record<string, string> = {
  FUTBOL: 'sport-gradient-futbol',
  TENIS: 'sport-gradient-tenis',
  BASQUET: 'sport-gradient-basquet',
}

export default function CanchaDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { showSuccess, showError, showInfo } = useToast()
  const canchaId = params.id as string

  const [cancha, setCancha] = useState<Cancha | null>(null)
  const [fecha, setFecha] = useState('')
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservando, setReservando] = useState(false)
  const [error, setError] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Fecha minima: hoy
  const hoy = new Date().toISOString().split('T')[0]
  // Fecha maxima: 30 dias desde hoy
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const fechaMaxima = maxDate.toISOString().split('T')[0]

  useEffect(() => {
    api.getCancha(canchaId)
      .then(setCancha)
      .catch(() => router.push('/canchas'))
      .finally(() => setLoading(false))
  }, [canchaId, router])

  useEffect(() => {
    if (fecha) {
      // Validar que la fecha no sea pasada
      const selectedDate = new Date(fecha)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        setError('No puedes seleccionar una fecha pasada')
        setDisponibilidad(null)
        return
      }

      setError('')
      setDisponibilidad(null)
      setSelectedSlot(null)
      api.getDisponibilidad(canchaId, fecha)
        .then(setDisponibilidad)
        .catch(console.error)
    }
  }, [canchaId, fecha])

  const handleReservar = async () => {
    if (!selectedSlot || !fecha) return

    const token = api.getToken()
    if (!token) {
      setShowLoginModal(true)
      showInfo('Necesitas iniciar sesion para reservar')
      return
    }

    setReservando(true)
    setError('')

    try {
      const reserva = await api.crearReserva({
        canchaId,
        fecha,
        horaInicio: selectedSlot.horaInicio,
        horaFin: selectedSlot.horaFin,
      })

      showSuccess('Reserva creada exitosamente! Redirigiendo al pago...')

      setTimeout(() => {
        router.push(`/portal/reservas/${reserva.reserva.id}/pagar`)
      }, 1500)
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear la reserva'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setReservando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!cancha) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Inicia Sesion</h3>
              <p className="text-gray-600">
                Para reservar una cancha necesitas tener una cuenta. Es rapido y gratis.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full btn-primary text-center"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="/auth/register"
                className="block w-full btn-secondary text-center"
              >
                Crear Cuenta Gratis
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="block w-full text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative pt-24 pb-20 overflow-hidden">
        <div className={`absolute inset-0 ${tipoGradients[cancha.tipo]}`}></div>
        <div className="absolute inset-0 pattern-dots opacity-20"></div>
        <div className="relative container mx-auto px-4">
          <Link href="/canchas" className="inline-flex items-center space-x-2 text-white/80 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver a canchas</span>
          </Link>
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-5xl">{tipoIcons[cancha.tipo]}</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{cancha.nombre}</h1>
              <p className="text-white/80 text-lg">{cancha.descripcion}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 -mt-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Informacion y Precio */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Precio por hora</p>
                <p className="text-5xl font-bold text-blue-600">${cancha.precioPorHora}</p>
              </div>

              <hr className="my-6" />

              <h3 className="font-bold text-gray-900 mb-4">Incluye:</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3 text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Uso exclusivo de la cancha</span>
                </li>
                <li className="flex items-center space-x-3 text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Iluminacion LED profesional</span>
                </li>
                <li className="flex items-center space-x-3 text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Vestidores y duchas</span>
                </li>
                <li className="flex items-center space-x-3 text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Estacionamiento gratuito</span>
                </li>
              </ul>

              <hr className="my-6" />

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">Politica de cancelacion</p>
                    <p className="text-blue-700">Cancelacion gratuita hasta 24 horas antes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Fecha y Horarios */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecciona Fecha y Horario</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center space-x-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Selector de Fecha */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Fecha de reserva
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  min={hoy}
                  max={fechaMaxima}
                  className="input-field text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Puedes reservar hasta 30 dias en adelante
                </p>
              </div>

              {/* Slots de Horario */}
              {fecha && disponibilidad && (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Horarios Disponibles
                  </label>

                  {!disponibilidad.disponible ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">{disponibilidad.mensaje || 'No hay horarios disponibles para esta fecha'}</p>
                      <p className="text-gray-400 text-sm mt-1">Intenta seleccionar otra fecha</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                      {disponibilidad.slots.map((slot) => (
                        <button
                          key={slot.horaInicio}
                          onClick={() => slot.disponible && setSelectedSlot(slot)}
                          disabled={!slot.disponible}
                          className={`p-4 rounded-xl text-center transition-all duration-300 ${
                            !slot.disponible
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : selectedSlot?.horaInicio === slot.horaInicio
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                              : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-md'
                          }`}
                        >
                          <span className="block font-bold text-lg">{slot.horaInicio}</span>
                          <span className={`text-xs ${
                            selectedSlot?.horaInicio === slot.horaInicio
                              ? 'text-white/80'
                              : slot.disponible
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}>
                            {slot.disponible ? 'Disponible' : 'Ocupado'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resumen y Boton de Reserva */}
              {selectedSlot && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Resumen de tu reserva</span>
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">Cancha</p>
                      <p className="font-semibold text-gray-900">{cancha.nombre}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">Horario</p>
                      <p className="font-semibold text-gray-900">{selectedSlot.horaInicio} - {selectedSlot.horaFin}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">Total a pagar</p>
                      <p className="font-bold text-2xl text-blue-600">${cancha.precioPorHora}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleReservar}
                    disabled={reservando}
                    className="w-full btn-primary flex items-center justify-center space-x-2 py-4"
                  >
                    {reservando ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Reservar y Pagar</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
