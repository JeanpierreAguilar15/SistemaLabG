'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Stats {
  totalReservas: number
  reservasHoy: number
  ingresosMes: number
  usuariosActivos: number
}

interface ReservaReciente {
  id: string
  fecha: string
  horaInicio: string
  estado: string
  usuario: {
    nombre: string
    apellido: string
  }
  cancha: {
    nombre: string
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalReservas: 0,
    reservasHoy: 0,
    ingresosMes: 0,
    usuariosActivos: 0,
  })
  const [reservasRecientes, setReservasRecientes] = useState<ReservaReciente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulamos datos del dashboard (en producción vendría del API)
    const cargarDatos = async () => {
      try {
        // Aquí normalmente cargaríamos los datos del API
        // Por ahora usamos datos de ejemplo
        setStats({
          totalReservas: 156,
          reservasHoy: 12,
          ingresosMes: 8500,
          usuariosActivos: 45,
        })

        setReservasRecientes([
          {
            id: '1',
            fecha: new Date().toISOString(),
            horaInicio: '10:00',
            estado: 'CONFIRMADA',
            usuario: { nombre: 'Juan', apellido: 'Pérez' },
            cancha: { nombre: 'Cancha Fútbol 1' },
          },
          {
            id: '2',
            fecha: new Date().toISOString(),
            horaInicio: '14:00',
            estado: 'PENDIENTE',
            usuario: { nombre: 'María', apellido: 'García' },
            cancha: { nombre: 'Cancha Tenis A' },
          },
          {
            id: '3',
            fecha: new Date().toISOString(),
            horaInicio: '16:00',
            estado: 'CONFIRMADA',
            usuario: { nombre: 'Carlos', apellido: 'López' },
            cancha: { nombre: 'Cancha Básquet' },
          },
        ])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Reservas Hoy</p>
              <p className="text-2xl font-bold text-gray-800">{stats.reservasHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-gray-800">Bs. {stats.ingresosMes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Reservas</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalReservas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.usuariosActivos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Acciones Rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/reservas" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
              <span className="text-2xl block mb-2">📅</span>
              <span className="text-sm font-medium text-blue-700">Ver Reservas</span>
            </Link>
            <Link href="/admin/canchas" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
              <span className="text-2xl block mb-2">🏟️</span>
              <span className="text-sm font-medium text-green-700">Gestionar Canchas</span>
            </Link>
            <Link href="/admin/usuarios" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
              <span className="text-2xl block mb-2">👥</span>
              <span className="text-sm font-medium text-purple-700">Ver Usuarios</span>
            </Link>
            <button className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition-colors">
              <span className="text-2xl block mb-2">📊</span>
              <span className="text-sm font-medium text-yellow-700">Generar Reporte</span>
            </button>
          </div>
        </div>

        {/* Reservas Recientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Reservas Recientes</h2>
            <Link href="/admin/reservas" className="text-primary-600 text-sm hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-4">
            {reservasRecientes.map((reserva) => (
              <div key={reserva.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{reserva.usuario.nombre} {reserva.usuario.apellido}</p>
                  <p className="text-sm text-gray-500">
                    {reserva.cancha.nombre} • {formatFecha(reserva.fecha)} {reserva.horaInicio}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  reserva.estado === 'CONFIRMADA'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {reserva.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
