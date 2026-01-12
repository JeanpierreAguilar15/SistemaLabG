'use client'

import { useEffect, useState } from 'react'

interface Reserva {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
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

  useEffect(() => {
    // Simulamos carga de datos
    setTimeout(() => {
      setReservas([
        {
          id: '1',
          fecha: '2024-01-15',
          horaInicio: '10:00',
          horaFin: '11:00',
          estado: 'CONFIRMADA',
          usuario: { nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com' },
          cancha: { nombre: 'Cancha Fútbol 1', tipo: 'FUTBOL' },
        },
        {
          id: '2',
          fecha: '2024-01-15',
          horaInicio: '14:00',
          horaFin: '15:00',
          estado: 'PENDIENTE',
          usuario: { nombre: 'María', apellido: 'García', email: 'maria@test.com' },
          cancha: { nombre: 'Cancha Tenis A', tipo: 'TENIS' },
        },
        {
          id: '3',
          fecha: '2024-01-16',
          horaInicio: '16:00',
          horaFin: '17:00',
          estado: 'CONFIRMADA',
          usuario: { nombre: 'Carlos', apellido: 'López', email: 'carlos@test.com' },
          cancha: { nombre: 'Cancha Básquet', tipo: 'BASQUET' },
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const reservasFiltradas = reservas.filter(r => {
    if (filtroEstado && r.estado !== filtroEstado) return false
    if (filtroFecha && r.fecha !== filtroFecha) return false
    return true
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Reservas</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input-field"
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
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cancha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservasFiltradas.map((reserva) => (
                <tr key={reserva.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{reserva.usuario.nombre} {reserva.usuario.apellido}</p>
                    <p className="text-sm text-gray-500">{reserva.usuario.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p>{reserva.cancha.nombre}</p>
                    <p className="text-sm text-gray-500">{reserva.cancha.tipo}</p>
                  </td>
                  <td className="px-6 py-4">{formatFecha(reserva.fecha)}</td>
                  <td className="px-6 py-4">{reserva.horaInicio} - {reserva.horaFin}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${estadoColors[reserva.estado]}`}>
                      {reserva.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary-600 hover:text-primary-800 text-sm mr-3">
                      Ver
                    </button>
                    {reserva.estado === 'PENDIENTE' && (
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Confirmar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
