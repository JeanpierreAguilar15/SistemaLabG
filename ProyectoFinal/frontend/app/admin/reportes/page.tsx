'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

interface Reporte {
  periodo: {
    inicio: string
    fin: string
  }
  resumen: {
    totalReservas: number
    totalIngresos: number
    totalCanceladas: number
    tasaCancelacion: string | number
  }
  reservasPorCancha: Array<{
    canchaId: string
    nombre: string
    tipo: string
    cantidad: number
  }>
  reservasPorEstado: Array<{
    estado: string
    cantidad: number
  }>
  ingresosPorMetodo: Array<{
    metodo: string
    total: number
    cantidad: number
  }>
  ingresosDiarios: Array<{
    fecha: string
    monto: number
  }>
  topClientes: Array<{
    nombre: string
    reservas: number
  }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: '#F59E0B',
  CONFIRMADA: '#10B981',
  COMPLETADA: '#3B82F6',
  CANCELADA: '#EF4444',
}

export default function ReportesPage() {
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const { showError } = useToast()

  useEffect(() => {
    cargarReporte()
  }, [])

  const cargarReporte = async () => {
    setLoading(true)
    try {
      const data = await api.getReportes(fechaInicio, fechaFin)
      setReporte(data)
    } catch (error) {
      showError('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = () => {
    cargarReporte()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!reporte) {
    return (
      <div className="text-center py-12 text-gray-500">
        No se pudo cargar el reporte
      </div>
    )
  }

  const maxIngresosDiarios = Math.max(...reporte.ingresosDiarios.map((i) => i.monto), 1)
  const maxReservasPorCancha = Math.max(...reporte.reservasPorCancha.map((r) => r.cantidad), 1)
  const totalReservasPorEstado = reporte.reservasPorEstado.reduce((sum, r) => sum + r.cantidad, 0)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Reportes</h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input-field py-2 px-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input-field py-2 px-3 text-sm"
            />
          </div>
          <button
            onClick={handleFiltrar}
            className="btn-primary py-2 px-4 text-sm"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Reservas</p>
              <p className="text-3xl font-bold text-gray-800">{reporte.resumen.totalReservas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ingresos Totales</p>
              <p className="text-3xl font-bold text-green-600">${reporte.resumen.totalIngresos.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Cancelaciones</p>
              <p className="text-3xl font-bold text-red-600">{reporte.resumen.totalCanceladas}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tasa Cancelacion</p>
              <p className="text-3xl font-bold text-amber-600">{reporte.resumen.tasaCancelacion}%</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Ingresos Diarios - Line/Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ingresos Diarios</h2>
          {reporte.ingresosDiarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Sin datos en este periodo</div>
          ) : (
            <div className="h-64 flex items-end gap-1 px-2">
              {reporte.ingresosDiarios.slice(-14).map((dia, index) => (
                <div key={dia.fecha} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ${dia.monto.toLocaleString()}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500"
                      style={{ height: `${(dia.monto / maxIngresosDiarios) * 200}px`, minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {new Date(dia.fecha).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reservas por Estado - Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reservas por Estado</h2>
          {reporte.reservasPorEstado.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Sin datos en este periodo</div>
          ) : (
            <div className="flex items-center gap-8">
              {/* Pie Chart */}
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {(() => {
                    let cumulativePercent = 0
                    return reporte.reservasPorEstado.map((item, index) => {
                      const percent = (item.cantidad / totalReservasPorEstado) * 100
                      const startPercent = cumulativePercent
                      cumulativePercent += percent
                      const largeArcFlag = percent > 50 ? 1 : 0
                      const startX = 50 + 40 * Math.cos(2 * Math.PI * startPercent / 100)
                      const startY = 50 + 40 * Math.sin(2 * Math.PI * startPercent / 100)
                      const endX = 50 + 40 * Math.cos(2 * Math.PI * cumulativePercent / 100)
                      const endY = 50 + 40 * Math.sin(2 * Math.PI * cumulativePercent / 100)

                      if (percent === 100) {
                        return (
                          <circle
                            key={item.estado}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={ESTADO_COLORS[item.estado] || COLORS[index]}
                            strokeWidth="20"
                          />
                        )
                      }

                      return (
                        <path
                          key={item.estado}
                          d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                          fill={ESTADO_COLORS[item.estado] || COLORS[index]}
                          className="hover:opacity-80 transition-opacity"
                        />
                      )
                    })
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{totalReservasPorEstado}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {reporte.reservasPorEstado.map((item, index) => (
                  <div key={item.estado} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ESTADO_COLORS[item.estado] || COLORS[index] }}
                      />
                      <span className="text-sm text-gray-600">{item.estado}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{item.cantidad}</span>
                      <span className="text-xs text-gray-500">
                        ({((item.cantidad / totalReservasPorEstado) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Reservas por Cancha */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reservas por Cancha</h2>
          {reporte.reservasPorCancha.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Sin datos en este periodo</div>
          ) : (
            <div className="space-y-4">
              {reporte.reservasPorCancha.map((cancha, index) => (
                <div key={cancha.canchaId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{cancha.nombre}</span>
                    <span className="text-gray-500">{cancha.cantidad} reservas</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(cancha.cantidad / maxReservasPorCancha) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingresos por Metodo */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ingresos por Metodo de Pago</h2>
          {reporte.ingresosPorMetodo.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Sin datos en este periodo</div>
          ) : (
            <div className="space-y-4">
              {reporte.ingresosPorMetodo.map((metodo, index) => {
                const totalIngresos = reporte.ingresosPorMetodo.reduce((sum, m) => sum + m.total, 0)
                const percent = totalIngresos > 0 ? (metodo.total / totalIngresos) * 100 : 0
                return (
                  <div key={metodo.metodo} className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS[index]}20` }}
                    >
                      {metodo.metodo === 'TARJETA' ? (
                        <svg className="w-6 h-6" style={{ color: COLORS[index] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" style={{ color: COLORS[index] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{metodo.metodo}</span>
                        <span className="text-sm text-gray-500">{metodo.cantidad} pagos</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percent}%`, backgroundColor: COLORS[index] }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">${metodo.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Clientes */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Clientes</h2>
        {reporte.topClientes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Sin datos en este periodo</div>
        ) : (
          <div className="grid md:grid-cols-5 gap-4">
            {reporte.topClientes.map((cliente, index) => (
              <div
                key={cliente.nombre}
                className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg"
                  style={{ backgroundColor: COLORS[index] }}
                >
                  {index + 1}
                </div>
                <p className="font-medium text-gray-800 truncate" title={cliente.nombre}>
                  {cliente.nombre}
                </p>
                <p className="text-sm text-gray-500">{cliente.reservas} reservas</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Period Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Datos del periodo: {new Date(reporte.periodo.inicio).toLocaleDateString('es')} - {new Date(reporte.periodo.fin).toLocaleDateString('es')}
      </div>
    </div>
  )
}
