'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Pago {
  id: string
  monto: number
  metodo: string
  estado: string
  referencia: string
  createdAt: string
  reserva: {
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
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  PROCESANDO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-green-100 text-green-700',
  FALLIDO: 'bg-red-100 text-red-700',
  REEMBOLSADO: 'bg-purple-100 text-purple-700',
}

const metodoLabels: Record<string, string> = {
  TARJETA: '💳 Tarjeta',
  TRANSFERENCIA: '🏦 Transferencia',
  EFECTIVO: '💵 Efectivo',
}

export default function MisPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMisPagos()
      .then(setPagos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calcular totales
  const totalPagado = pagos
    .filter(p => p.estado === 'COMPLETADO')
    .reduce((sum, p) => sum + Number(p.monto), 0)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mis Pagos</h1>

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <p className="text-white/80 text-sm">Total Pagado</p>
          <p className="text-3xl font-bold">${totalPagado.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Total de Pagos</p>
          <p className="text-3xl font-bold text-gray-800">{pagos.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Pagos Completados</p>
          <p className="text-3xl font-bold text-green-600">
            {pagos.filter(p => p.estado === 'COMPLETADO').length}
          </p>
        </div>
      </div>

      {/* Lista de Pagos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : pagos.length > 0 ? (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Historial de Pagos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-semibold">Referencia</th>
                  <th className="pb-3 font-semibold">Fecha</th>
                  <th className="pb-3 font-semibold">Reserva</th>
                  <th className="pb-3 font-semibold">Método</th>
                  <th className="pb-3 font-semibold text-right">Monto</th>
                  <th className="pb-3 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-b last:border-0">
                    <td className="py-4">
                      <span className="font-mono text-sm">{pago.referencia}</span>
                    </td>
                    <td className="py-4">
                      <p>{formatFecha(pago.createdAt)}</p>
                      <p className="text-xs text-gray-500">{formatHora(pago.createdAt)}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-medium">{pago.reserva.cancha.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {formatFecha(pago.reserva.fecha)} • {pago.reserva.horaInicio}
                      </p>
                    </td>
                    <td className="py-4">
                      <span className="text-sm">{metodoLabels[pago.metodo]}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-semibold">${Number(pago.monto).toFixed(2)}</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${estadoColors[pago.estado]}`}>
                        {pago.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No tienes pagos registrados</p>
        </div>
      )}
    </div>
  )
}
