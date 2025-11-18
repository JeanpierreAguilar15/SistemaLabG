'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Categoria {
  codigo_categoria: number
  nombre: string
  descripcion: string | null
}

interface Examen {
  codigo_examen: number
  codigo_interno: string
  nombre: string
  descripcion: string | null
  codigo_categoria: number
  requiere_ayuno: boolean
  horas_ayuno: number | null
  instrucciones_preparacion: string | null
  tiempo_entrega_horas: number
  tipo_muestra: string | null
  valor_referencia_min: number | null
  valor_referencia_max: number | null
  unidad_medida: string | null
  activo: boolean
  categoria?: { nombre: string }
  precios?: Array<{ precio: number; activo: boolean }>
}

export default function ExamenesPage() {
  const { accessToken } = useAuthStore()
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingExamen, setEditingExamen] = useState<Examen | null>(null)
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    codigo_interno: '',
    nombre: '',
    descripcion: '',
    codigo_categoria: '',
    requiere_ayuno: false,
    horas_ayuno: '',
    instrucciones_preparacion: '',
    tiempo_entrega_horas: '24',
    tipo_muestra: 'Sangre',
    valor_referencia_min: '',
    valor_referencia_max: '',
    unidad_medida: '',
    precio: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && accessToken) {
      loadExamenes()
      loadCategorias()
    }
  }, [mounted, accessToken])

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadExamenes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/exams`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const result = await response.json()
        // Backend returns paginated data: { data: [], pagination: {} }
        const examenes = result.data || result
        setExamenes(examenes)
      }
    } catch (error) {
      console.error('Error loading examenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/examenes/categorias`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Error loading categorias:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const examenData = {
      codigo_interno: formData.codigo_interno,
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      codigo_categoria: parseInt(formData.codigo_categoria),
      requiere_ayuno: formData.requiere_ayuno,
      horas_ayuno: formData.requiere_ayuno && formData.horas_ayuno ? parseInt(formData.horas_ayuno) : null,
      instrucciones_preparacion: formData.instrucciones_preparacion || null,
      tiempo_entrega_horas: parseInt(formData.tiempo_entrega_horas),
      tipo_muestra: formData.tipo_muestra,
      valor_referencia_min: formData.valor_referencia_min ? parseFloat(formData.valor_referencia_min) : null,
      valor_referencia_max: formData.valor_referencia_max ? parseFloat(formData.valor_referencia_max) : null,
      unidad_medida: formData.unidad_medida || null,
      activo: true,
    }

    try {
      if (editingExamen) {
        // Update
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/exams/${editingExamen.codigo_examen}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(examenData),
          }
        )

        if (response.ok) {
          setMessage({ type: 'success', text: 'Examen actualizado correctamente' })
          loadExamenes()
          handleCloseModal()
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.message || 'Error al actualizar examen' })
        }
      } else {
        // Create
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/exams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(examenData),
        })

        if (response.ok) {
          const newExamen = await response.json()

          // Create precio if provided
          if (formData.precio) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/prices`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                codigo_examen: newExamen.codigo_examen,
                precio: parseFloat(formData.precio),
                activo: true,
              }),
            })
          }

          setMessage({ type: 'success', text: '✅ Examen creado! Los pacientes ya pueden verlo en Cotizaciones' })
          loadExamenes()
          handleCloseModal()
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.message || 'Error al crear examen' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleEdit = (examen: Examen) => {
    setEditingExamen(examen)
    setFormData({
      codigo_interno: examen.codigo_interno,
      nombre: examen.nombre,
      descripcion: examen.descripcion || '',
      codigo_categoria: examen.codigo_categoria.toString(),
      requiere_ayuno: examen.requiere_ayuno,
      horas_ayuno: examen.horas_ayuno?.toString() || '',
      instrucciones_preparacion: examen.instrucciones_preparacion || '',
      tiempo_entrega_horas: examen.tiempo_entrega_horas.toString(),
      tipo_muestra: examen.tipo_muestra || 'Sangre',
      valor_referencia_min: examen.valor_referencia_min?.toString() || '',
      valor_referencia_max: examen.valor_referencia_max?.toString() || '',
      unidad_medida: examen.unidad_medida || '',
      precio: examen.precios?.[0]?.precio.toString() || '',
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedExamen) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/exams/${selectedExamen.codigo_examen}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Examen eliminado correctamente' })
        loadExamenes()
        setShowDeleteModal(false)
        setSelectedExamen(null)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al eliminar examen' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar examen' })
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExamen(null)
    setFormData({
      codigo_interno: '',
      nombre: '',
      descripcion: '',
      codigo_categoria: '',
      requiere_ayuno: false,
      horas_ayuno: '',
      instrucciones_preparacion: '',
      tiempo_entrega_horas: '24',
      tipo_muestra: 'Sangre',
      valor_referencia_min: '',
      valor_referencia_max: '',
      unidad_medida: '',
      precio: '',
    })
  }

  const filteredExamenes = examenes.filter(
    (examen) =>
      examen.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      examen.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Exámenes</h1>
          <p className="text-lab-neutral-600 mt-2">
            Administra el catálogo de exámenes. Los cambios se reflejan inmediatamente en el portal del paciente.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Examen
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          message.type === 'success' ? 'bg-lab-success-50 text-lab-success-800' : 'bg-lab-error-50 text-lab-error-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="ml-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Examenes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exámenes ({filteredExamenes.length})</CardTitle>
          <CardDescription>Lista de todos los exámenes disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Código</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Nombre</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Categoría</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Precio</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Ayuno</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExamenes.map((examen) => (
                  <tr key={examen.codigo_examen} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                    <td className="p-4 text-sm font-mono text-lab-neutral-700">{examen.codigo_interno}</td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">{examen.nombre}</div>
                      {examen.descripcion && (
                        <div className="text-sm text-lab-neutral-600 truncate max-w-xs">{examen.descripcion}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-700">{examen.categoria?.nombre}</td>
                    <td className="p-4 text-sm font-semibold text-lab-neutral-900">
                      ${examen.precios?.[0]?.precio ? Number(examen.precios[0].precio).toFixed(2) : '0.00'}
                    </td>
                    <td className="p-4">
                      {examen.requiere_ayuno ? (
                        <span className="text-xs px-2 py-1 bg-lab-warning-100 text-lab-warning-800 rounded">
                          {examen.horas_ayuno}h
                        </span>
                      ) : (
                        <span className="text-xs text-lab-neutral-500">No</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          examen.activo
                            ? 'bg-lab-success-100 text-lab-success-800'
                            : 'bg-lab-neutral-100 text-lab-neutral-600'
                        }`}
                      >
                        {examen.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedExamen(examen)
                            setShowDetailModal(true)
                          }}
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(examen)} title="Editar">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-lab-error-600 hover:text-lab-error-700"
                          onClick={() => {
                            setSelectedExamen(examen)
                            setShowDeleteModal(true)
                          }}
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredExamenes.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">
                No se encontraron exámenes
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-lab-neutral-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-lab-neutral-900">
                  {editingExamen ? 'Editar Examen' : 'Nuevo Examen'}
                </h2>
                <button onClick={handleCloseModal} className="text-lab-neutral-400 hover:text-lab-neutral-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_interno">Código Interno *</Label>
                  <Input
                    id="codigo_interno"
                    value={formData.codigo_interno}
                    onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                    placeholder="BIOQ-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_categoria">Categoría *</Label>
                  <select
                    id="codigo_categoria"
                    value={formData.codigo_categoria}
                    onChange={(e) => setFormData({ ...formData, codigo_categoria: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map((cat) => (
                      <option key={cat.codigo_categoria} value={cat.codigo_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Examen *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Glucosa en Ayunas"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-lab-neutral-300"
                  placeholder="Medición de glucosa en sangre"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio ($) *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="15.00"
                    required={!editingExamen}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_muestra">Tipo de Muestra</Label>
                  <select
                    id="tipo_muestra"
                    value={formData.tipo_muestra}
                    onChange={(e) => setFormData({ ...formData, tipo_muestra: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
                  >
                    <option value="Sangre">Sangre</option>
                    <option value="Orina">Orina</option>
                    <option value="Heces">Heces</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiempo_entrega_horas">Entrega (horas)</Label>
                  <Input
                    id="tiempo_entrega_horas"
                    type="number"
                    value={formData.tiempo_entrega_horas}
                    onChange={(e) => setFormData({ ...formData, tiempo_entrega_horas: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiere_ayuno"
                  checked={formData.requiere_ayuno}
                  onChange={(e) => setFormData({ ...formData, requiere_ayuno: e.target.checked })}
                  className="h-4 w-4 rounded border-lab-neutral-300"
                />
                <Label htmlFor="requiere_ayuno" className="cursor-pointer">
                  Requiere Ayuno
                </Label>
              </div>

              {formData.requiere_ayuno && (
                <div className="space-y-2">
                  <Label htmlFor="horas_ayuno">Horas de Ayuno</Label>
                  <Input
                    id="horas_ayuno"
                    type="number"
                    value={formData.horas_ayuno}
                    onChange={(e) => setFormData({ ...formData, horas_ayuno: e.target.value })}
                    placeholder="8"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="instrucciones_preparacion">Instrucciones de Preparación</Label>
                <textarea
                  id="instrucciones_preparacion"
                  value={formData.instrucciones_preparacion}
                  onChange={(e) => setFormData({ ...formData, instrucciones_preparacion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-lab-neutral-300"
                  placeholder="Primera orina de la mañana"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_referencia_min">Valor Mín.</Label>
                  <Input
                    id="valor_referencia_min"
                    type="number"
                    step="0.01"
                    value={formData.valor_referencia_min}
                    onChange={(e) => setFormData({ ...formData, valor_referencia_min: e.target.value })}
                    placeholder="70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_referencia_max">Valor Máx.</Label>
                  <Input
                    id="valor_referencia_max"
                    type="number"
                    step="0.01"
                    value={formData.valor_referencia_max}
                    onChange={(e) => setFormData({ ...formData, valor_referencia_max: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidad_medida">Unidad</Label>
                  <Input
                    id="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                    placeholder="mg/dL"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit">{editingExamen ? 'Actualizar' : 'Crear'} Examen</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedExamen && (
        <ExamenDetailModal
          examen={selectedExamen}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedExamen(null)
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedExamen && (
        <DeleteConfirmationModal
          examenName={selectedExamen.nombre}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedExamen(null)
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

// Examen Detail Modal Component
function ExamenDetailModal({
  examen,
  onClose,
}: {
  examen: Examen
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-lab-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-lab-neutral-900">Detalles del Examen</h2>
          <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Código Interno</label>
                <p className="text-lab-neutral-900 font-mono">{examen.codigo_interno}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Nombre</label>
                <p className="text-lab-neutral-900 font-semibold">{examen.nombre}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Categoría</label>
                <p className="text-lab-neutral-900">{examen.categoria?.nombre || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Precio</label>
                <p className="text-lab-neutral-900 font-semibold">
                  ${examen.precios?.[0]?.precio ? Number(examen.precios[0].precio).toFixed(2) : '0.00'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Tipo de Muestra</label>
                <p className="text-lab-neutral-900">{examen.tipo_muestra || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Tiempo de Entrega</label>
                <p className="text-lab-neutral-900">{examen.tiempo_entrega_horas} horas</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Descripción</label>
                <p className="text-lab-neutral-900">{examen.descripcion || '-'}</p>
              </div>
            </div>
          </div>

          {/* Preparation */}
          <div>
            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Preparación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Requiere Ayuno</label>
                <p className="text-lab-neutral-900">
                  {examen.requiere_ayuno ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lab-warning-100 text-lab-warning-800">
                      Sí - {examen.horas_ayuno} horas
                    </span>
                  ) : (
                    <span className="text-lab-neutral-600">No</span>
                  )}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Instrucciones de Preparación</label>
                <p className="text-lab-neutral-900">{examen.instrucciones_preparacion || '-'}</p>
              </div>
            </div>
          </div>

          {/* Reference Values */}
          <div>
            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Valores de Referencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Valor Mínimo</label>
                <p className="text-lab-neutral-900">{examen.valor_referencia_min ?? '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Valor Máximo</label>
                <p className="text-lab-neutral-900">{examen.valor_referencia_max ?? '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Unidad de Medida</label>
                <p className="text-lab-neutral-900">{examen.unidad_medida || '-'}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Estado</label>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                examen.activo
                  ? 'bg-lab-success-100 text-lab-success-800'
                  : 'bg-lab-neutral-100 text-lab-neutral-800'
              }`}
            >
              {examen.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="flex justify-end pt-4 border-t border-lab-neutral-200">
            <Button onClick={onClose} className="bg-lab-primary-600 hover:bg-lab-primary-700">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  examenName,
  onClose,
  onConfirm,
}: {
  examenName: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-lab-error-100 rounded-full">
            <svg className="w-6 h-6 text-lab-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="mt-4 text-lg font-semibold text-center text-lab-neutral-900">
            ¿Eliminar Examen?
          </h3>
          <p className="mt-2 text-sm text-center text-lab-neutral-600">
            ¿Estás seguro de que deseas eliminar el examen <strong>{examenName}</strong>? Esta acción no se puede deshacer y podría afectar cotizaciones y paquetes existentes.
          </p>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-lab-error-600 hover:bg-lab-error-700 text-white"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
