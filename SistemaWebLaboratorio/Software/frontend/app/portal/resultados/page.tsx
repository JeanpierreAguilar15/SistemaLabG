'use client'

import { useCallback, useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface Examen {
  codigo_examen: number
  nombre: string
  codigo_interno: string
}

interface ResultadoAgrupado {
  codigo_resultado: number
  examen: Examen
  valor_numerico: number | null
  valor_texto: string | null
  unidad_medida: string | null
  nivel: string | null
  estado: string
  fecha_resultado: string
  url_pdf: string | null
}

interface MuestraAgrupada {
  codigo_muestra: number
  id_muestra: string
  fecha_toma: string
  tipo_muestra: string
  estado_muestra: string
  resultados: ResultadoAgrupado[]
  total_examenes: number
  examenes_listos: number
  examenes_pendientes: number
}

export default function ResultadosPage() {
  const accessToken = useAuthStore((state) => state.accessToken)

  const [loading, setLoading] = useState(false)
  const [muestras, setMuestras] = useState<MuestraAgrupada[]>([])
  const [expandedMuestras, setExpandedMuestras] = useState<Set<number>>(new Set())

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadResultados = useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/my/agrupados`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMuestras(data)
        // Expandir automáticamente si hay pocas muestras
        if (data.length <= 3) {
          setExpandedMuestras(new Set(data.map((m: MuestraAgrupada) => m.codigo_muestra)))
        }
      }
    } catch (error) {
      // Silently fail - empty state shown
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadResultados()
  }, [loadResultados])

  const toggleExpand = (codigoMuestra: number) => {
    const newExpanded = new Set(expandedMuestras)
    if (newExpanded.has(codigoMuestra)) {
      newExpanded.delete(codigoMuestra)
    } else {
      newExpanded.add(codigoMuestra)
    }
    setExpandedMuestras(newExpanded)
  }

  const handleDescargarPDF = async (resultado: ResultadoAgrupado) => {
    if (!resultado.url_pdf) {
      setMessage({ type: 'error', text: 'Este resultado no tiene PDF disponible' })
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/resultados/${resultado.codigo_resultado}/descargar`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resultado_${resultado.examen?.nombre || 'examen'}.pdf`
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

  const handleDescargarTodos = async (muestra: MuestraAgrupada) => {
    const resultadosConPdf = muestra.resultados.filter((r) => r.url_pdf)
    if (resultadosConPdf.length === 0) {
      setMessage({ type: 'error', text: 'No hay PDFs disponibles para descargar' })
      return
    }

    setMessage({ type: 'success', text: `Descargando ${resultadosConPdf.length} resultado(s)...` })

    for (const resultado of resultadosConPdf) {
      await handleDescargarPDF(resultado)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'LISTO':
      case 'ENTREGADO':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'VALIDADO':
        return 'bg-lab-info-100 text-lab-info-800'
      case 'EN_PROCESO':
      case 'PENDIENTE':
        return 'bg-lab-warning-100 text-lab-warning-800'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-600'
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
      case 'PENDIENTE':
        return 'Pendiente'
      default:
        return estado
    }
  }

  const getNivelBadge = (nivel: string | null) => {
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

  // Filtrar muestras
  const filteredMuestras = muestras.filter((muestra) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      muestra.id_muestra.toLowerCase().includes(search) ||
      muestra.resultados.some((r) => r.examen?.nombre.toLowerCase().includes(search))
    )
  })

  // Calcular totales
  const totalResultados = muestras.reduce((sum, m) => sum + m.total_examenes, 0)
  const totalDisponibles = muestras.reduce((sum, m) => sum + m.examenes_listos, 0)
  const totalPendientes = muestras.reduce((sum, m) => sum + m.examenes_pendientes, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Message */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-top-2 fade-in duration-300 ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-lab-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Mis Resultados</h1>
        <p className="text-lab-neutral-600 mt-2">Consulta y descarga tus resultados de laboratorio organizados por muestra</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-lab-neutral-600">Disponibles</p>
                <p className="text-3xl font-bold text-lab-success-600">{totalDisponibles}</p>
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
                <p className="text-3xl font-bold text-lab-warning-600">{totalPendientes}</p>
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
                <p className="text-3xl font-bold text-lab-primary-600">{totalResultados}</p>
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

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Buscar por examen o codigo de muestra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Resultados Agrupados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados por Muestra</CardTitle>
          <CardDescription>
            {filteredMuestras.length} muestra{filteredMuestras.length !== 1 && 's'} con resultados.
            Haz clic en cada una para ver los examenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
            </div>
          ) : filteredMuestras.length === 0 ? (
            <div className="text-center py-12 text-lab-neutral-500">
              <svg className="w-16 h-16 mx-auto text-lab-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No tienes resultados de examenes aun</p>
              <p className="text-sm mt-1">Los resultados apareceran aqui cuando esten listos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMuestras.map((muestra) => {
                const resultadosConPdf = muestra.resultados.filter((r) => r.url_pdf).length

                return (
                  <div
                    key={muestra.codigo_muestra}
                    className="border border-lab-neutral-200 rounded-lg overflow-hidden"
                  >
                    {/* Header - clickable */}
                    <div
                      onClick={() => toggleExpand(muestra.codigo_muestra)}
                      className="bg-lab-neutral-50 p-4 cursor-pointer hover:bg-lab-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-5 h-5 text-lab-neutral-500 transition-transform flex-shrink-0 ${
                            expandedMuestras.has(muestra.codigo_muestra) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-lab-neutral-900 truncate">
                                Muestra: {muestra.id_muestra}
                              </div>
                              <div className="text-sm text-lab-neutral-600">
                                {formatDate(new Date(muestra.fecha_toma))}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-6">
                              <div className="text-left sm:text-right">
                                <div className="text-xs text-lab-neutral-500">Examenes</div>
                                <div className="flex items-center gap-1 text-sm">
                                  {muestra.examenes_listos > 0 && (
                                    <span className="text-lab-success-600 font-medium">
                                      {muestra.examenes_listos} listo{muestra.examenes_listos !== 1 && 's'}
                                    </span>
                                  )}
                                  {muestra.examenes_pendientes > 0 && (
                                    <>
                                      {muestra.examenes_listos > 0 && <span className="text-lab-neutral-400">/</span>}
                                      <span className="text-lab-warning-600 font-medium">
                                        {muestra.examenes_pendientes} pend.
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {resultadosConPdf > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDescargarTodos(muestra)
                                  }}
                                  className="text-lab-primary-600 hover:text-lab-primary-700 flex-shrink-0"
                                >
                                  <svg className="w-4 h-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="hidden sm:inline">Descargar ({resultadosConPdf})</span>
                                  <span className="sm:hidden">({resultadosConPdf})</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content - individual exams */}
                    {expandedMuestras.has(muestra.codigo_muestra) && (
                      <div className="border-t border-lab-neutral-200 bg-white divide-y divide-lab-neutral-100">
                        {muestra.resultados.map((resultado) => (
                          <div
                            key={resultado.codigo_resultado}
                            className="p-4 hover:bg-lab-neutral-50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-medium text-lab-neutral-900 truncate max-w-[200px] sm:max-w-none">
                                    {resultado.examen?.nombre}
                                  </h4>
                                  <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${getEstadoBadge(resultado.estado)}`}>
                                    {getEstadoText(resultado.estado)}
                                  </span>
                                  {resultado.nivel && (
                                    <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${getNivelBadge(resultado.nivel)}`}>
                                      {resultado.nivel}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-3 text-sm text-lab-neutral-500 mt-1">
                                  <span>Codigo: {resultado.examen?.codigo_interno}</span>
                                  {resultado.valor_numerico !== null && resultado.valor_numerico !== undefined && (
                                    <span className="text-lab-neutral-700">
                                      Valor: <strong>{resultado.valor_numerico}</strong> {resultado.unidad_medida}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {resultado.url_pdf && ['LISTO', 'VALIDADO', 'ENTREGADO'].includes(resultado.estado) && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleDescargarPDF(resultado)}
                                    className="w-full sm:w-auto"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar PDF
                                  </Button>
                                )}
                                {!resultado.url_pdf && resultado.estado === 'EN_PROCESO' && (
                                  <span className="text-sm text-lab-neutral-500 italic">
                                    En proceso...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
