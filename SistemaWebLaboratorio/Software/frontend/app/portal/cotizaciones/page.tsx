'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface Examen {
  codigo_examen: number
  codigo_interno: string
  nombre: string
  descripcion: string
  categoria: string
  precio_actual: number
  requiere_ayuno: boolean
  requiere_preparacion_especial: boolean
  instrucciones_preparacion?: string
}

interface ExamenSeleccionado extends Examen {
  cantidad: number
  subtotal: number
}

interface Cotizacion {
  codigo_cotizacion: number
  numero_cotizacion: string
  fecha_cotizacion: string
  subtotal: number
  descuento: number
  total: number
  estado: string
  items: {
    examen: string
    cantidad: number
    precio_unitario: number
    total_linea: number
  }[]
}

export default function CotizacionesPage() {
  const accessToken = useAuthStore((state) => state.accessToken)

  const [loading, setLoading] = useState(false)
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [examenesSeleccionados, setExamenesSeleccionados] = useState<Map<number, ExamenSeleccionado>>(new Map())
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('TODAS')
  const [showCotizacionModal, setShowCotizacionModal] = useState(false)
  const [showAgendarCitaModal, setShowAgendarCitaModal] = useState(false)
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null)

  // Para agendar cita desde cotización
  const [fechaCita, setFechaCita] = useState('')
  const [horaCita, setHoraCita] = useState('')
  const [observacionesCita, setObservacionesCita] = useState('')

  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    loadExamenes()
    loadCotizaciones()
  }, [])

  const loadExamenes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/examenes/catalogo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExamenes(data)
      }
    } catch (error) {
      console.error('Error loading examenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCotizaciones = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/mis-cotizaciones`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCotizaciones(data)
      }
    } catch (error) {
      console.error('Error loading cotizaciones:', error)
    }
  }

  // Filtrar exámenes
  const examenesFiltrados = useMemo(() => {
    return examenes.filter((examen) => {
      const matchSearch = searchTerm === '' ||
        examen.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        examen.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase())

      const matchCategoria = categoriaFilter === 'TODAS' || examen.categoria === categoriaFilter

      return matchSearch && matchCategoria
    })
  }, [examenes, searchTerm, categoriaFilter])

  // Calcular totales dinámicamente
  const totales = useMemo(() => {
    let subtotal = 0
    examenesSeleccionados.forEach((examen) => {
      subtotal += Number(examen.subtotal) || 0
    })

    const descuento = 0 // Podría calcularse con lógica de descuentos
    const total = subtotal - descuento

    return { subtotal, descuento, total }
  }, [examenesSeleccionados])

  // Categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(examenes.map((e) => e.categoria))
    return Array.from(cats).sort()
  }, [examenes])

  const handleToggleExamen = (examen: Examen) => {
    const newMap = new Map(examenesSeleccionados)

    if (newMap.has(examen.codigo_examen)) {
      // Deseleccionar
      newMap.delete(examen.codigo_examen)
    } else {
      // Seleccionar con cantidad 1
      newMap.set(examen.codigo_examen, {
        ...examen,
        cantidad: 1,
        subtotal: Number(examen.precio_actual) || 0,
      })
    }

    setExamenesSeleccionados(newMap)
  }

  const handleCantidadChange = (codigo_examen: number, cantidad: number) => {
    if (cantidad < 1) return

    const newMap = new Map(examenesSeleccionados)
    const examen = newMap.get(codigo_examen)

    if (examen) {
      newMap.set(codigo_examen, {
        ...examen,
        cantidad,
        subtotal: (Number(examen.precio_actual) || 0) * cantidad,
      })
      setExamenesSeleccionados(newMap)
    }
  }

  const handleGenerarCotizacion = async () => {
    if (examenesSeleccionados.size === 0) {
      setMessage({ type: 'error', text: 'Debes seleccionar al menos un examen' })
      return
    }

    try {
      const items = Array.from(examenesSeleccionados.values()).map((examen) => ({
        codigo_examen: examen.codigo_examen,
        cantidad: examen.cantidad,
        precio_unitario: examen.precio_actual,
        descripcion: examen.nombre,
      }))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cotizaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items,
          subtotal: totales.subtotal,
          descuento: totales.descuento,
          total: totales.total,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: `Cotización ${data.numero_cotizacion} generada correctamente` })
        setExamenesSeleccionados(new Map())
        loadCotizaciones()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al generar la cotización' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleDescargarPDF = async (cotizacion: Cotizacion) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/${cotizacion.codigo_cotizacion}/pdf`,
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
        a.download = `cotizacion_${cotizacion.numero_cotizacion}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al descargar el PDF' })
    }
  }

  const handleAgendarCitaDesdeCotizacion = async () => {
    if (!selectedCotizacion || !fechaCita || !horaCita) {
      setMessage({ type: 'error', text: 'Debes completar la fecha y hora de la cita' })
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/${selectedCotizacion.codigo_cotizacion}/agendar-cita`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fecha: fechaCita,
            hora: horaCita,
            observaciones: observacionesCita,
          }),
        }
      )

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cita agendada correctamente desde la cotización' })
        setShowAgendarCitaModal(false)
        setSelectedCotizacion(null)
        setFechaCita('')
        setHoraCita('')
        setObservacionesCita('')
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al agendar la cita' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'lab-badge-warning'
      case 'APROBADA':
        return 'lab-badge-success'
      case 'RECHAZADA':
        return 'lab-badge-danger'
      case 'CONVERTIDA_A_PAGO':
        return 'lab-badge-info'
      case 'EXPIRADA':
        return 'lab-badge-neutral'
      default:
        return 'lab-badge-neutral'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Cotizaciones</h1>
        <p className="text-lab-neutral-600 mt-2">Solicita cotizaciones para tus exámenes de laboratorio</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Selección de Exámenes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Selecciona tus Exámenes</CardTitle>
              <CardDescription>Marca los exámenes que necesitas</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Examen</Label>
                  <Input
                    id="search"
                    placeholder="Nombre o código del examen"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <select
                    id="categoria"
                    value={categoriaFilter}
                    onChange={(e) => setCategoriaFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-lab-neutral-300 focus:outline-none focus:ring-2 focus:ring-lab-primary-500"
                  >
                    <option value="TODAS">Todas las Categorías</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Exámenes */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {examenesFiltrados.map((examen) => {
                    const isSelected = examenesSeleccionados.has(examen.codigo_examen)
                    const cantidad = isSelected ? examenesSeleccionados.get(examen.codigo_examen)!.cantidad : 1

                    return (
                      <div
                        key={examen.codigo_examen}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-lab-primary-500 bg-lab-primary-50'
                            : 'border-lab-neutral-200 hover:border-lab-primary-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={`examen-${examen.codigo_examen}`}
                            checked={isSelected}
                            onChange={() => handleToggleExamen(examen)}
                            className="mt-1 h-5 w-5 rounded border-lab-neutral-300 text-lab-primary-600 focus:ring-lab-primary-500"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`examen-${examen.codigo_examen}`}
                              className="font-medium text-lab-neutral-900 cursor-pointer"
                            >
                              {examen.nombre}
                            </label>
                            <p className="text-sm text-lab-neutral-600 mt-1">
                              {examen.codigo_interno} • {examen.categoria}
                            </p>
                            {examen.descripcion && (
                              <p className="text-sm text-lab-neutral-500 mt-1">{examen.descripcion}</p>
                            )}
                            {(examen.requiere_ayuno || examen.requiere_preparacion_especial) && (
                              <div className="flex items-center space-x-2 mt-2">
                                {examen.requiere_ayuno && (
                                  <span className="text-xs px-2 py-1 bg-lab-warning-100 text-lab-warning-800 rounded">
                                    Requiere Ayuno
                                  </span>
                                )}
                                {examen.requiere_preparacion_especial && (
                                  <span className="text-xs px-2 py-1 bg-lab-info-100 text-lab-info-800 rounded">
                                    Preparación Especial
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lab-neutral-900">
                              ${(Number(examen.precio_actual) || 0).toFixed(2)}
                            </p>
                            {isSelected && (
                              <div className="flex items-center space-x-1 mt-2">
                                <button
                                  onClick={() => handleCantidadChange(examen.codigo_examen, cantidad - 1)}
                                  className="w-6 h-6 rounded bg-lab-neutral-200 hover:bg-lab-neutral-300 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium">{cantidad}</span>
                                <button
                                  onClick={() => handleCantidadChange(examen.codigo_examen, cantidad + 1)}
                                  className="w-6 h-6 rounded bg-lab-neutral-200 hover:bg-lab-neutral-300 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {examenesFiltrados.length === 0 && (
                    <div className="text-center py-8 text-lab-neutral-500">
                      No se encontraron exámenes
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen de Cotización */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>
                  {examenesSeleccionados.size} examen{examenesSeleccionados.size !== 1 && 'es'} seleccionado{examenesSeleccionados.size !== 1 && 's'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de seleccionados */}
                {examenesSeleccionados.size > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto border-b border-lab-neutral-200 pb-4">
                    {Array.from(examenesSeleccionados.values()).map((examen) => (
                      <div key={examen.codigo_examen} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-lab-neutral-900">{examen.nombre}</p>
                          <p className="text-lab-neutral-600">
                            {examen.cantidad} x ${(Number(examen.precio_actual) || 0).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">${(Number(examen.subtotal) || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totales */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-lab-neutral-600">Subtotal:</span>
                    <span className="font-semibold">${totales.subtotal.toFixed(2)}</span>
                  </div>
                  {totales.descuento > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-lab-neutral-600">Descuento:</span>
                      <span className="font-semibold text-lab-success-600">-${totales.descuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-lab-neutral-200">
                    <span>Total:</span>
                    <span className="text-lab-primary-600">${totales.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botones */}
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={handleGenerarCotizacion}
                    disabled={examenesSeleccionados.size === 0}
                    className="w-full"
                  >
                    Generar Cotización
                  </Button>
                  {examenesSeleccionados.size > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setExamenesSeleccionados(new Map())}
                      className="w-full"
                    >
                      Limpiar Selección
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Historial de Cotizaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Cotizaciones</CardTitle>
          <CardDescription>Historial de cotizaciones generadas</CardDescription>
        </CardHeader>
        <CardContent>
          {cotizaciones.length === 0 ? (
            <div className="text-center py-8 text-lab-neutral-500">
              No tienes cotizaciones generadas
            </div>
          ) : (
            <div className="space-y-3">
              {cotizaciones.map((cotizacion) => (
                <div
                  key={cotizacion.codigo_cotizacion}
                  className="flex items-start justify-between p-4 rounded-lg border border-lab-neutral-200"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lab-neutral-900">{cotizacion.numero_cotizacion}</h4>
                        <p className="text-sm text-lab-neutral-600">
                          {formatDate(new Date(cotizacion.fecha_cotizacion))}
                        </p>
                      </div>
                      <span className={getEstadoBadge(cotizacion.estado)}>{cotizacion.estado}</span>
                    </div>

                    <div className="text-sm text-lab-neutral-700 mb-3">
                      <strong>{cotizacion.items.length}</strong> examen{cotizacion.items.length !== 1 && 'es'}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-lab-primary-600">
                        Total: ${(Number(cotizacion.total) || 0).toFixed(2)}
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleDescargarPDF(cotizacion)}>
                          Descargar PDF
                        </Button>
                        {cotizacion.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCotizacion(cotizacion)
                              setShowAgendarCitaModal(true)
                            }}
                          >
                            Agendar Cita
                          </Button>
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

      {/* Modal Agendar Cita desde Cotización */}
      {showAgendarCitaModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-lab-neutral-900">Agendar Cita</h2>
                <button
                  onClick={() => {
                    setShowAgendarCitaModal(false)
                    setSelectedCotizacion(null)
                  }}
                  className="text-lab-neutral-400 hover:text-lab-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-lab-neutral-50 rounded-lg">
                  <h4 className="font-semibold text-lab-neutral-900">{selectedCotizacion.numero_cotizacion}</h4>
                  <p className="text-sm text-lab-neutral-600 mt-1">
                    {selectedCotizacion.items.length} examen{selectedCotizacion.items.length !== 1 && 'es'} •
                    Total: ${(Number(selectedCotizacion.total) || 0).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_cita">Fecha de la Cita *</Label>
                  <Input
                    id="fecha_cita"
                    type="date"
                    value={fechaCita}
                    onChange={(e) => setFechaCita(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_cita">Hora *</Label>
                  <Input
                    id="hora_cita"
                    type="time"
                    value={horaCita}
                    onChange={(e) => setHoraCita(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones_cita">Observaciones</Label>
                  <textarea
                    id="observaciones_cita"
                    value={observacionesCita}
                    onChange={(e) => setObservacionesCita(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-lab-neutral-300 focus:outline-none focus:ring-2 focus:ring-lab-primary-500"
                    placeholder="Información adicional (opcional)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAgendarCitaModal(false)
                      setSelectedCotizacion(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAgendarCitaDesdeCotizacion} disabled={!fechaCita || !horaCita}>
                    Confirmar Cita
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
