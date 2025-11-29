'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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

interface DetalleCotizacion {
  codigo_detalle_cotizacion: number
  cantidad: number
  precio_unitario: number
  total_linea: number
  examen: {
    codigo_examen: number
    nombre: string
    codigo_interno: string
  }
}

interface Cotizacion {
  codigo_cotizacion: number
  numero_cotizacion: string
  fecha_cotizacion: string
  subtotal: number
  descuento: number
  total: number
  estado: string
  detalles: DetalleCotizacion[]
  cita?: any
}

export default function CotizacionesPage() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const router = useRouter()

  // Estados generales
  const [loading, setLoading] = useState(false)
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [examenesSeleccionados, setExamenesSeleccionados] = useState<Map<number, ExamenSeleccionado>>(new Map())
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('TODAS')
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Estados para agendar cita
  const [showAgendarCitaModal, setShowAgendarCitaModal] = useState(false)
  const [fechaCita, setFechaCita] = useState('')
  const [observacionesCita, setObservacionesCita] = useState('')
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  useEffect(() => {
    loadExamenes()
    loadCotizaciones()
  }, [])

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    if (fechaCita && showAgendarCitaModal) {
      loadSlots()
    }
  }, [fechaCita, showAgendarCitaModal])

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

  const loadSlots = async () => {
    try {
      setLoadingSlots(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/slots/available?fecha=${fechaCita}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data)
      }
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

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

  const handleAgendarCita = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion)
    setShowAgendarCitaModal(true)
    setFechaCita('')
    setAvailableSlots([])
    setSelectedSlot(null)
  }

  const handleConfirmarCita = async () => {
    if (!selectedSlot || !selectedCotizacion) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          codigo_slot: selectedSlot,
          codigo_cotizacion: selectedCotizacion.codigo_cotizacion,
          observaciones: observacionesCita,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cita agendada correctamente' })
        setShowAgendarCitaModal(false)
        loadCotizaciones() // Recargar para actualizar estado
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al agendar cita' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    }
  }

  const handleGenerarCotizacion = async () => {
    if (examenesSeleccionados.size === 0) return

    try {
      const examenes = Array.from(examenesSeleccionados.values()).map((item) => ({
        codigo_examen: item.codigo_examen,
        cantidad: 1, // Siempre 1 ahora
      }))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cotizaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ examenes }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cotización generada exitosamente' })
        setExamenesSeleccionados(new Map())
        loadCotizaciones()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al generar cotización' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    }
  }

  const handleDescargarPDF = async (cotizacion: Cotizacion) => {
    // Implementar descarga de PDF si es necesario
    console.log('Descargar PDF', cotizacion)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'APROBADA':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'RECHAZADA':
        return 'bg-lab-danger-100 text-lab-danger-800'
      case 'CONVERTIDA_A_PAGO':
        return 'bg-lab-info-100 text-lab-info-800'
      case 'EXPIRADA':
        return 'bg-lab-neutral-100 text-lab-neutral-800'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-600'
    }
  }

  const examenesFiltrados = useMemo(() => {
    return examenes.filter((examen) => {
      const matchesSearch =
        examen.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        examen.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategoria =
        categoriaFilter === 'TODAS' || examen.categoria === categoriaFilter

      return matchesSearch && matchesCategoria
    })
  }, [examenes, searchTerm, categoriaFilter])

  const categorias = useMemo(() => {
    const cats = new Set(examenes.map((e) => e.categoria))
    return Array.from(cats).sort()
  }, [examenes])

  const totales = useMemo(() => {
    let subtotal = 0
    let descuento = 0

    examenesSeleccionados.forEach((item) => {
      subtotal += item.subtotal
    })

    return {
      subtotal,
      descuento,
      total: subtotal - descuento,
    }
  }, [examenesSeleccionados])

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Cotizaciones</h1>
        <p className="text-lab-neutral-600 mt-2">Solicita cotizaciones para tus exámenes de laboratorio</p>
      </div>

      {/* Mensaje */}
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === 'success'
            ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
            : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel de Selección de Exámenes */}
        <div className="lg:col-span-2">
          <Card className="h-full">
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
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {examenesFiltrados.map((examen) => {
                    const isSelected = examenesSeleccionados.has(examen.codigo_examen)

                    return (
                      <div
                        key={examen.codigo_examen}
                        onClick={() => handleToggleExamen(examen)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${isSelected
                          ? 'border-lab-primary-500 bg-lab-primary-50'
                          : 'border-lab-neutral-200 hover:border-lab-primary-300'
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 h-5 w-5 rounded border flex items-center justify-center ${isSelected ? 'bg-lab-primary-600 border-lab-primary-600' : 'border-lab-neutral-300'
                            }`}>
                            {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-lab-neutral-900">{examen.nombre}</h3>
                              <span className="font-bold text-lab-neutral-900">${(Number(examen.precio_actual) || 0).toFixed(2)}</span>
                            </div>
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

      {/* Historial de Cotizaciones (Full Width Bottom) */}
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
                  className="flex items-center justify-between p-4 rounded-lg border border-lab-neutral-200 hover:bg-lab-neutral-50 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <h4 className="font-semibold text-lab-neutral-900">{cotizacion.numero_cotizacion}</h4>
                      <p className="text-sm text-lab-neutral-600">
                        {formatDate(new Date(cotizacion.fecha_cotizacion))}
                      </p>
                    </div>

                    <div>
                      <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(cotizacion.estado)}`}>
                        {cotizacion.estado}
                      </span>
                    </div>

                    <div className="text-sm text-lab-neutral-700">
                      <strong>{cotizacion.detalles?.length || 0}</strong> examen{(cotizacion.detalles?.length || 0) !== 1 && 'es'}
                    </div>

                    <div className="font-bold text-lab-neutral-900">
                      ${Number(cotizacion.total).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleDescargarPDF(cotizacion)} title="Descargar PDF">
                      <svg className="w-5 h-5 text-lab-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </Button>
                    {!cotizacion.cita && cotizacion.estado === 'PENDIENTE' && (
                      <Button size="sm" onClick={() => handleAgendarCita(cotizacion)}>
                        Agendar Cita
                      </Button>
                    )}
                    {cotizacion.cita && (
                      <span className="text-xs font-medium text-lab-success-700 bg-lab-success-100 px-2 py-1 rounded">
                        Cita Agendada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Agendar Cita */}
      {showAgendarCitaModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-lab-neutral-200">
              <h2 className="text-xl font-bold text-lab-neutral-900">
                Agendar Cita para {selectedCotizacion.numero_cotizacion}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {fechaCita && (
                <div className="space-y-2">
                  <Label>Horarios Disponibles</Label>
                  {loadingSlots ? (
                    <div className="text-center py-4">Cargando horarios...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-4 text-lab-neutral-500">No hay horarios disponibles para esta fecha</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.codigo_slot}
                          onClick={() => setSelectedSlot(slot.codigo_slot)}
                          className={`p-2 text-sm rounded border ${selectedSlot === slot.codigo_slot
                            ? 'bg-lab-primary-600 text-white border-lab-primary-600'
                            : 'bg-white text-lab-neutral-700 border-lab-neutral-300 hover:border-lab-primary-500'
                            }`}
                        >
                          {slot.hora_inicio.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Observaciones (Opcional)</Label>
                <Input
                  value={observacionesCita}
                  onChange={(e) => setObservacionesCita(e.target.value)}
                  placeholder="Alguna indicación especial..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-lab-neutral-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAgendarCitaModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarCita}
                disabled={!selectedSlot}
              >
                Confirmar Cita
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
