'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Reserva {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
  cancha: {
    nombre: string
    tipo: string
  }
}

export default function PortalPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMisReservas()
      .then(setReservas)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const reservasProximas = reservas
    .filter(r => r.estado === 'CONFIRMADA' && new Date(r.fecha) >= new Date())
    .slice(0, 3)

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Portal</h1>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link href="/canchas" className="card hover:shadow-lg transition-shadow bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="text-4xl mb-2">⚽</div>
          <h3 className="text-xl font-semibold">Reservar Cancha</h3>
          <p className="opacity-90">Fútbol, Tenis o Básquet</p>
        </Link>

        <Link href="/portal/reservas" className="card hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="text-4xl mb-2">📅</div>
          <h3 className="text-xl font-semibold">Mis Reservas</h3>
          <p className="opacity-90">{reservas.length} reservas totales</p>
        </Link>

        <Link href="/portal/pagos" className="card hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="text-4xl mb-2">💳</div>
          <h3 className="text-xl font-semibold">Mis Pagos</h3>
          <p className="opacity-90">Historial y comprobantes</p>
        </Link>
      </div>

      {/* Próximas Reservas */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Próximas Reservas</h2>
          <Link href="/portal/reservas" className="text-primary-600 hover:underline">
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : reservasProximas.length > 0 ? (
          <div className="space-y-4">
            {reservasProximas.map((reserva) => (
              <div key={reserva.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      {reserva.cancha.tipo === 'FUTBOL' ? '⚽' :
                       reserva.cancha.tipo === 'TENIS' ? '🎾' : '🏀'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{reserva.cancha.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {formatFecha(reserva.fecha)} • {reserva.horaInicio} - {reserva.horaFin}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  Confirmada
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No tienes reservas próximas</p>
            <Link href="/canchas" className="btn-primary mt-4 inline-block">
              Reservar Ahora
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
