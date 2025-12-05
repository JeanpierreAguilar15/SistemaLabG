'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ReportType = 'dashboard' | 'ventas' | 'examenes' | 'citas' | 'cotizaciones' | 'kardex' | 'pacientes'

interface DashboardData {
  ingresos_mes_actual: number
  ingresos_mes_anterior: number
  variacion_ingresos: string
  pagos_este_mes: number
  citas_hoy: number
  items_stock_bajo: number
  cotizaciones_pendientes: number
}

export default function ReportesPage() {
  const { accessToken } = useAuthStore()
  const [activeReport, setActiveReport] = useState<ReportType>('dashboard')
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    loadReport()
  }, [activeReport])

  const loadReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fecha_desde', fechaDesde)
      if (fechaHasta) params.append('fecha_hasta', fechaHasta)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/${activeReport}?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0)
  }

  const reports = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'ventas', label: 'Ventas', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'examenes', label: 'Examenes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'citas', label: 'Citas', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    { id: 'kardex', label: 'Kardex', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
    { id: 'pacientes', label: 'Pacientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ]

  const renderDashboard = (data: DashboardData) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardContent className="pt-6">
          <div className="text-sm opacity-80">Ingresos Este Mes</div>
          <div className="text-3xl font-bold mt-2">{formatCurrency(data.ingresos_mes_actual)}</div>
          <div className={`text-sm mt-2 ${data.variacion_ingresos.startsWith('+') ? 'text-green-200' : 'text-red-200'}`}>
            {data.variacion_ingresos} vs mes anterior
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="text-sm opacity-80">Pagos Este Mes</div>
          <div className="text-3xl font-bold mt-2">{data.pagos_este_mes}</div>
          <div className="text-sm mt-2 opacity-80">transacciones</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="text-sm opacity-80">Citas Hoy</div>
          <div className="text-3xl font-bold mt-2">{data.citas_hoy}</div>
          <div className="text-sm mt-2 opacity-80">programadas</div>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${data.items_stock_bajo > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'} text-white`}>
        <CardContent className="pt-6">
          <div className="text-sm opacity-80">Items Stock Bajo</div>
          <div className="text-3xl font-bold mt-2">{data.items_stock_bajo}</div>
          <div className="text-sm mt-2 opacity-80">requieren atencion</div>
        </CardContent>
      </Card>
    </div>
  )

  const renderVentas = (data: any) => (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total Ingresos</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(data.resumen?.total_ingresos)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Cantidad Pagos</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{data.resumen?.cantidad_pagos || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Promedio por Pago</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(data.resumen?.promedio_pago)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Por Metodo */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Metodo de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.por_metodo?.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-lab-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium">{m.metodo}</div>
                  <div className="text-sm text-lab-neutral-500">{m.cantidad} pagos</div>
                </div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(m.total)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por Dia */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Ultimos 30 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-right p-2">Pagos</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.por_dia?.slice(0, 15).map((d: any, i: number) => (
                  <tr key={i} className="border-b border-lab-neutral-100">
                    <td className="p-2">{new Date(d.fecha).toLocaleDateString('es-ES')}</td>
                    <td className="text-right p-2">{d.cantidad}</td>
                    <td className="text-right p-2 font-medium text-green-600">{formatCurrency(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderExamenes = (data: any) => (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Examenes Diferentes</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{data.total_examenes_diferentes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total Realizados</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{data.total_examenes_realizados || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Ingresos Generados</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(data.ingresos_totales)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Examenes Mas Solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.ranking_top_10?.map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-lab-neutral-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-lab-neutral-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium">{e.nombre}</div>
                    <div className="text-xs text-lab-neutral-500">{e.codigo_interno}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{e.cantidad_solicitada} veces</div>
                  <div className="text-sm text-green-600">{formatCurrency(e.ingresos_generados)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCitas = (data: any) => (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total Citas</div>
            <div className="text-2xl font-bold text-lab-neutral-900 mt-2">{data.resumen?.total_citas || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Completadas</div>
            <div className="text-2xl font-bold text-green-600 mt-2">{data.resumen?.completadas || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Canceladas</div>
            <div className="text-2xl font-bold text-red-600 mt-2">{data.resumen?.canceladas || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Tasa Cumplimiento</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{data.resumen?.tasa_cumplimiento || '0%'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Tasa Cancelacion</div>
            <div className="text-2xl font-bold text-yellow-600 mt-2">{data.resumen?.tasa_cancelacion || '0%'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Por Servicio */}
        <Card>
          <CardHeader>
            <CardTitle>Por Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.por_servicio?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between p-3 bg-lab-neutral-50 rounded">
                  <span>{s.servicio}</span>
                  <span className="font-bold">{s.cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Por Sede */}
        <Card>
          <CardHeader>
            <CardTitle>Por Sede</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.por_sede?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between p-3 bg-lab-neutral-50 rounded">
                  <span>{s.sede}</span>
                  <span className="font-bold">{s.cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCotizaciones = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total Cotizaciones</div>
            <div className="text-2xl font-bold text-lab-neutral-900 mt-2">{data.resumen?.total_cotizaciones || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Pagadas</div>
            <div className="text-2xl font-bold text-green-600 mt-2">{data.resumen?.cotizaciones_pagadas || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600 mt-2">{data.resumen?.cotizaciones_pendientes || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="text-sm opacity-80">Tasa Conversion</div>
            <div className="text-3xl font-bold mt-2">{data.resumen?.tasa_conversion || '0%'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Valor Total Cotizado</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(data.resumen?.valor_total_cotizado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Valor Convertido</div>
            <div className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(data.resumen?.valor_convertido)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Valor No Convertido</div>
            <div className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(data.resumen?.valor_perdido)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderKardex = (data: any) => (
    <div className="space-y-6">
      {/* Alertas */}
      {data.alertas?.items_stock_bajo > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Items con Stock Critico ({data.alertas.items_stock_bajo})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.alertas.items_criticos?.map((item: any) => (
                <div key={item.codigo_item} className="p-3 bg-white rounded border border-red-200">
                  <div className="font-medium text-sm">{item.nombre}</div>
                  <div className="text-xs text-lab-neutral-500">{item.codigo_interno}</div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>Stock: <span className="font-bold text-red-600">{item.stock_actual}</span></span>
                    <span>Min: {item.stock_minimo}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Movimientos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.resumen_movimientos?.por_tipo?.map((t: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg ${
                t.tipo === 'ENTRADA' ? 'bg-green-50 border border-green-200' :
                t.tipo === 'SALIDA' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="font-medium">{t.tipo}</div>
                <div className="text-2xl font-bold mt-1">{t.cantidad_movimientos}</div>
                <div className="text-sm text-lab-neutral-500">{t.unidades_totales} unidades</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items mas movidos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Items Mas Movidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.resumen_movimientos?.items_mas_movidos?.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-lab-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.nombre}</div>
                  <div className="text-xs text-lab-neutral-500">{item.codigo_interno}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{item.cantidad_movimientos} mov.</div>
                  <div className="text-sm text-lab-neutral-500">{item.unidades_movidas} uds.</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPacientes = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total Pacientes</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{data.resumen?.total_pacientes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Nuevos en Periodo</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{data.resumen?.nuevos_en_periodo || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Activos (90 dias)</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{data.resumen?.pacientes_activos_90_dias || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribucion por Genero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.por_genero?.map((g: any, i: number) => (
              <div key={i} className="p-4 bg-lab-neutral-50 rounded-lg text-center">
                <div className="text-2xl font-bold">{g.cantidad}</div>
                <div className="text-sm text-lab-neutral-600">{g.genero}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderReport = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
        </div>
      )
    }

    if (!reportData) {
      return <div className="text-center py-12 text-lab-neutral-500">No hay datos disponibles</div>
    }

    switch (activeReport) {
      case 'dashboard':
        return renderDashboard(reportData)
      case 'ventas':
        return renderVentas(reportData)
      case 'examenes':
        return renderExamenes(reportData)
      case 'citas':
        return renderCitas(reportData)
      case 'cotizaciones':
        return renderCotizaciones(reportData)
      case 'kardex':
        return renderKardex(reportData)
      case 'pacientes':
        return renderPacientes(reportData)
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Centro de Reportes</h1>
        <p className="text-lab-neutral-600 mt-2">
          Analisis y estadisticas del laboratorio
        </p>
      </div>

      {/* Report Selector */}
      <div className="flex flex-wrap gap-2">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id as ReportType)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeReport === report.id
                ? 'bg-lab-primary-600 text-white'
                : 'bg-lab-neutral-100 text-lab-neutral-700 hover:bg-lab-neutral-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={report.icon} />
            </svg>
            <span>{report.label}</span>
          </button>
        ))}
      </div>

      {/* Filters (except dashboard) */}
      {activeReport !== 'dashboard' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Fecha Desde</Label>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Hasta</Label>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-44"
                />
              </div>
              <Button onClick={loadReport}>
                Actualizar Reporte
              </Button>
              <Button variant="outline" onClick={() => { setFechaDesde(''); setFechaHasta(''); }}>
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {renderReport()}
    </div>
  )
}
