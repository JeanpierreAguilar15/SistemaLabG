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
    precioPorHora: number
  }
  pago: {
    id: string
    estado: string
    referencia: string
  } | null
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

  const handleCancelar = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return

    setCancelando(id)
    try {
      await api.cancelarReserva(id)
      cargarReservas()
    } catch (error: any) {
      alert(error.message || 'Error al cancelar')
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
                      onClick={() => handleCancelar(reserva.id)}
                      disabled={cancelando === reserva.id}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      {cancelando === reserva.id ? 'Cancelando...' : 'Cancelar'}
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
    </div>
  )
}
