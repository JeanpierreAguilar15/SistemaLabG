'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

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

export default function CanchaDetallePage() {
  const params = useParams()
  const router = useRouter()
  const canchaId = params.id as string

  const [cancha, setCancha] = useState<Cancha | null>(null)
  const [fecha, setFecha] = useState('')
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservando, setReservando] = useState(false)
  const [error, setError] = useState('')

  // Fecha mínima: hoy
  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    api.getCancha(canchaId)
      .then(setCancha)
      .catch(() => router.push('/canchas'))
      .finally(() => setLoading(false))
  }, [canchaId, router])

  useEffect(() => {
    if (fecha) {
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
      router.push('/auth/login')
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

      // Redirigir al pago
      router.push(`/portal/reservas/${reserva.reserva.id}/pagar`)
    } catch (err: any) {
      setError(err.message || 'Error al crear la reserva')
    } finally {
      setReservando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!cancha) return null

  const tipoIcons: Record<string, string> = {
    FUTBOL: '⚽',
    TENIS: '🎾',
    BASQUET: '🏀',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-600 text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/canchas" className="text-white/80 hover:text-white text-sm mb-2 inline-block">
            ← Volver a canchas
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-5xl">{tipoIcons[cancha.tipo]}</span>
            <div>
              <h1 className="text-3xl font-bold">{cancha.nombre}</h1>
              <p className="text-white/80">{cancha.descripcion}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Información y Precio */}
          <div className="md:col-span-1">
            <div className="card sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Precio</h2>
              <p className="text-4xl font-bold text-primary-600 mb-2">
                Bs. {cancha.precioPorHora}
              </p>
              <p className="text-gray-600">por hora</p>

              <hr className="my-6" />

              <h3 className="font-semibold mb-2">Incluye:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Uso exclusivo de la cancha</li>
                <li>✓ Iluminación (si aplica)</li>
                <li>✓ Vestidores</li>
                <li>✓ Estacionamiento</li>
              </ul>
            </div>
          </div>

          {/* Selector de Fecha y Horarios */}
          <div className="md:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Selecciona Fecha y Horario</h2>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Selector de Fecha */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  min={hoy}
                  className="input-field"
                />
              </div>

              {/* Slots de Horario */}
              {fecha && disponibilidad && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horarios Disponibles
                  </label>

                  {!disponibilidad.disponible ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>{disponibilidad.mensaje || 'No hay horarios disponibles para esta fecha'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {disponibilidad.slots.map((slot) => (
                        <button
                          key={slot.horaInicio}
                          onClick={() => slot.disponible && setSelectedSlot(slot)}
                          disabled={!slot.disponible}
                          className={`p-3 rounded-lg text-center transition-colors ${
                            !slot.disponible
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : selectedSlot?.horaInicio === slot.horaInicio
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-gray-200 hover:border-primary-600'
                          }`}
                        >
                          <span className="block font-semibold">{slot.horaInicio}</span>
                          <span className="text-xs">{slot.disponible ? 'Disponible' : 'Ocupado'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resumen y Botón de Reserva */}
              {selectedSlot && (
                <div className="mt-8 p-4 bg-primary-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Resumen de tu reserva</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Cancha:</strong> {cancha.nombre}</p>
                    <p><strong>Fecha:</strong> {new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    <p><strong>Horario:</strong> {selectedSlot.horaInicio} - {selectedSlot.horaFin}</p>
                    <p><strong>Total a pagar:</strong> Bs. {cancha.precioPorHora}</p>
                  </div>

                  <button
                    onClick={handleReservar}
                    disabled={reservando}
                    className="w-full btn-primary mt-4"
                  >
                    {reservando ? 'Procesando...' : 'Reservar y Pagar'}
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
