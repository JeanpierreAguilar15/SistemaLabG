'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface Resultado {
  codigo_resultado: number
  codigo_muestra: number
  fecha_resultado: string
  estado: string
  valor_numerico?: number | null
  valor_texto?: string | null
  unidad_medida?: string | null
  nivel?: string | null
  dentro_rango_normal?: boolean
  valor_referencia_min?: number | null
  valor_referencia_max?: number | null
  url_pdf?: string | null
  codigo_verificacion?: string | null
  examen: {
    codigo_examen: number
    nombre: string
    codigo_interno: string
  }
  muestra: {
    codigo_muestra: number
    id_muestra: string
    fecha_toma: string
    tipo_muestra: string | null
  }
}

export default function ResultadosPage() {
  const accessToken = useAuthStore((state) => state.accessToken)

  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [filteredResultados, setFilteredResultados] = useState<Resultado[]>([])
  const [selectedResultado, setSelectedResultado] = useState<Resultado | null>(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('TODOS')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    loadResultados()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [resultados, searchTerm, estadoFilter, fechaDesde, fechaHasta])

  const loadResultados = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/my`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setResultados(data)
      }
    } catch (error) {
      console.error('Error loading resultados:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...resultados]

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.examen.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.muestra.id_muestra.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (estadoFilter !== 'TODOS') {
      filtered = filtered.filter((r) => r.estado === estadoFilter)
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      filtered = filtered.filter((r) => new Date(r.fecha_resultado) >= new Date(fechaDesde))
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      filtered = filtered.filter((r) => new Date(r.fecha_resultado) <= new Date(fechaHasta))
    }

    setFilteredResultados(filtered)
  }

  const handleDescargarPDF = async (resultado: Resultado) => {
    if (!resultado.url_pdf) {
      setMessage({ type: 'error', text: 'Este resultado no tiene PDF disponible' })
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/${resultado.codigo_resultado}/descargar`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resultado_${resultado.muestra.id_muestra}_${resultado.examen.nombre}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        setMessage({ type: 'success', text: 'Resultado descargado correctamente' })
      } else {
        setMessage({ type: 'error', text: 'Error al descargar el resultado' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'LISTO':
      case 'ENTREGADO':
        return 'lab-badge-success'
      case 'VALIDADO':
        return 'lab-badge-info'
      case 'EN_PROCESO':
        return 'lab-badge-neutral'
      default:
        return 'lab-badge-neutral'
    }
  }

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'LISTO':
        return 'Disponible'
      case 'ENTREGADO':
        return 'Entregado'
      case 'VALIDADO':
        return 'Validado'
      case 'EN_PROCESO':
        return 'En Proceso'
      default:
        return estado
    }
  }

  const getNivelBadge = (nivel?: string) => {
    switch (nivel) {
      case 'NORMAL':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'ALTO':
        return 'bg-lab-danger-100 text-lab-danger-800'
      case 'BAJO':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'CRITICO':
        return 'bg-lab-danger-100 text-lab-danger-800 font-bold'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-800'
    }
  }

  const getNivelIcon = (nivel?: string) => {
    switch (nivel) {
      case 'NORMAL':
        return (
          <svg className="w-5 h-5 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'ALTO':
      case 'BAJO':
        return (
          <svg className="w-5 h-5 text-lab-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'CRITICO':
        return (
          <svg className="w-5 h-5 text-lab-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const resultadosDisponibles = filteredResultados.filter((r) => ['LISTO', 'ENTREGADO', 'VALIDADO'].includes(r.estado))
  const resultadosEnProceso = filteredResultados.filter((r) => r.estado === 'EN_PROCESO')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Mis Resultados</h1>
        <p className="text-lab-neutral-600 mt-2">Consulta y descarga tus resultados de laboratorio</p>
      </div>

      {/* Mensaje */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-lab-neutral-600">Disponibles</p>
                <p className="text-3xl font-bold text-lab-success-600">{resultadosDisponibles.length}</p>
              </div>
              <div className="bg-lab-success-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-lab-neutral-600">En Proceso</p>
                <p className="text-3xl font-bold text-lab-warning-600">{resultadosEnProceso.length}</p>
              </div>
              <div className="bg-lab-warning-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-lab-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-lab-neutral-600">Total Resultados</p>
                <p className="text-3xl font-bold text-lab-primary-600">{resultados.length}</p>
              </div>
              <div className="bg-lab-primary-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Examen o código de muestra"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <select
                id="estado"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300 focus:outline-none focus:ring-2 focus:ring-lab-primary-500"
              >
                <option value="TODOS">Todos</option>
                <option value="LISTO">Disponible</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="VALIDADO">Validado</option>
                <option value="EN_PROCESO">En Proceso</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_desde">Desde</Label>
              <Input
                id="fecha_desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_hasta">Hasta</Label>
              <Input
                id="fecha_hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>

          {(searchTerm || estadoFilter !== 'TODOS' || fechaDesde || fechaHasta) && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setEstadoFilter('TODOS')
                  setFechaDesde('')
                  setFechaHasta('')
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados de Exámenes</CardTitle>
          <CardDescription>
            {filteredResultados.length} resultado{filteredResultados.length !== 1 && 's'} encontrado{filteredResultados.length !== 1 && 's'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
            </div>
          ) : filteredResultados.length === 0 ? (
            <div className="text-center py-8 text-lab-neutral-500">
              No se encontraron resultados
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResultados.map((resultado) => (
                <div
                  key={resultado.codigo_resultado}
                  className="flex items-start justify-between p-4 rounded-lg border border-lab-neutral-200 hover:border-lab-primary-300 transition-colors"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getNivelIcon(resultado.nivel)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lab-neutral-900">{resultado.examen.nombre}</h4>
                          <p className="text-sm text-lab-neutral-600 mt-1">
                            Código: {resultado.examen.codigo_interno} • Muestra: {resultado.muestra.id_muestra}
                          </p>
                          <p className="text-sm text-lab-neutral-500">
                            {formatDate(new Date(resultado.fecha_resultado))}
                          </p>
                        </div>
                        <span className={getEstadoBadge(resultado.estado)}>
                          {getEstadoText(resultado.estado)}
                        </span>
                      </div>

                      {['LISTO', 'ENTREGADO', 'VALIDADO'].includes(resultado.estado) && (
                        <div className="mt-3 flex items-center space-x-2">
                          {resultado.nivel && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNivelBadge(resultado.nivel)}`}>
                              {resultado.nivel}
                            </span>
                          )}
                          {resultado.valor_numerico !== null && resultado.valor_numerico !== undefined && (
                            <span className="text-sm text-lab-neutral-700">
                              Valor: <strong>{resultado.valor_numerico}</strong> {resultado.unidad_medida}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2 mt-3">
                        {['LISTO', 'ENTREGADO', 'VALIDADO'].includes(resultado.estado) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedResultado(resultado)
                                setShowDetalleModal(true)
                              }}
                            >
                              Ver Detalle
                            </Button>
                            {resultado.url_pdf && (
                              <Button size="sm" onClick={() => handleDescargarPDF(resultado)}>
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar PDF
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detalle */}
      {showDetalleModal && selectedResultado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-lab-neutral-900">Detalle del Resultado</h2>
                <button
                  onClick={() => {
                    setShowDetalleModal(false)
                    setSelectedResultado(null)
                  }}
                  className="text-lab-neutral-400 hover:text-lab-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Info General */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-lab-neutral-600">Examen</p>
                    <p className="font-semibold text-lab-neutral-900">{selectedResultado.examen.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-lab-neutral-600">Código</p>
                    <p className="font-semibold text-lab-neutral-900">{selectedResultado.examen.codigo_interno}</p>
                  </div>
                  <div>
                    <p className="text-sm text-lab-neutral-600">ID Muestra</p>
                    <p className="font-semibold text-lab-neutral-900">{selectedResultado.muestra.id_muestra}</p>
                  </div>
                  <div>
                    <p className="text-sm text-lab-neutral-600">Fecha</p>
                    <p className="font-semibold text-lab-neutral-900">
                      {formatDate(new Date(selectedResultado.fecha_resultado))}
                    </p>
                  </div>
                </div>

                {/* Resultado */}
                <div className="p-4 bg-lab-neutral-50 rounded-lg">
                  <h3 className="font-semibold text-lab-neutral-900 mb-3">Resultado</h3>
                  <div className="space-y-2">
                    {selectedResultado.valor_numerico !== null && selectedResultado.valor_numerico !== undefined ? (
                      <div>
                        <p className="text-sm text-lab-neutral-600">Valor</p>
                        <p className="text-2xl font-bold text-lab-neutral-900">
                          {selectedResultado.valor_numerico} {selectedResultado.unidad_medida}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-lab-neutral-600">Resultado</p>
                        <p className="text-lg font-semibold text-lab-neutral-900">{selectedResultado.valor_texto}</p>
                      </div>
                    )}

                    {selectedResultado.nivel && (
                      <div className="flex items-center space-x-2 mt-2">
                        {getNivelIcon(selectedResultado.nivel)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getNivelBadge(selectedResultado.nivel)}`}>
                          {selectedResultado.nivel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Valores de Referencia */}
                {(selectedResultado.valor_referencia_min !== null || selectedResultado.valor_referencia_max !== null) && (
                  <div className="p-4 bg-lab-primary-50 rounded-lg">
                    <h3 className="font-semibold text-lab-neutral-900 mb-2">Valores de Referencia</h3>
                    <p className="text-sm text-lab-neutral-700">
                      {selectedResultado.valor_referencia_min} - {selectedResultado.valor_referencia_max} {selectedResultado.unidad_medida}
                    </p>
                  </div>
                )}

                {selectedResultado.codigo_verificacion && (
                  <div className="p-4 bg-lab-neutral-100 rounded-lg">
                    <p className="text-xs text-lab-neutral-600">Código de Verificación</p>
                    <p className="font-mono text-sm text-lab-neutral-900 mt-1">{selectedResultado.codigo_verificacion}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetalleModal(false)
                      setSelectedResultado(null)
                    }}
                  >
                    Cerrar
                  </Button>
                  {selectedResultado.url_pdf && (
                    <Button onClick={() => handleDescargarPDF(selectedResultado)}>
                      Descargar PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
