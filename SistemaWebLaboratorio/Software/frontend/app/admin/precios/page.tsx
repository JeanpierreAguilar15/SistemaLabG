'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Examen {
  codigo_examen: number
  codigo_interno: string
  nombre: string
}

interface Precio {
  codigo_precio: number
  codigo_examen: number
  precio: number
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
  examen?: {
    codigo_examen: number
    nombre: string
    codigo_interno: string
  }
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function PreciosPage() {
  const { accessToken } = useAuthStore()
  const [precios, setPrecios] = useState<Precio[]>([])
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPrecio, setEditingPrecio] = useState<Precio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActivo, setFilterActivo] = useState<string>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    codigo_examen: '',
    precio: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true,
  })

  useEffect(() => {
    loadPrecios()
    loadExamenes()
  }, [currentPage, filterActivo])

  const loadPrecios = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (filterActivo !== 'all') {
        params.append('activo', filterActivo)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/prices?${params}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      if (response.ok) {
        const result = await response.json()
        setPrecios(result.data || [])
        setPagination(result.pagination || null)
      }
    } catch (error) {
      console.error('Error loading precios:', error)
      setMessage({ type: 'error', text: 'Error al cargar precios' })
    } finally {
      setLoading(false)
    }
  }

  const loadExamenes = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/exams?limit=500`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      if (response.ok) {
        const result = await response.json()
        setExamenes(result.data || result || [])
      }
    } catch (error) {
      console.error('Error loading examenes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    const precio = parseFloat(formData.precio)
    if (isNaN(precio) || precio <= 0) {
      setMessage({ type: 'error', text: 'El precio debe ser un valor positivo mayor a 0' })
      return
    }

    if (!formData.codigo_examen) {
      setMessage({ type: 'error', text: 'Debe seleccionar un examen' })
      return
    }

    // Validar fechas si ambas están presentes
    if (formData.fecha_inicio && formData.fecha_fin) {
      const fechaInicio = new Date(formData.fecha_inicio)
      const fechaFin = new Date(formData.fecha_fin)
      if (fechaFin <= fechaInicio) {
        setMessage({ type: 'error', text: 'La fecha de fin debe ser posterior a la fecha de inicio' })
        return
      }
    }

    const precioData = {
      codigo_examen: parseInt(formData.codigo_examen),
      precio: precio,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      activo: formData.activo,
    }

    try {
      if (editingPrecio) {
        // Update
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/prices/${editingPrecio.codigo_precio}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(precioData),
          }
        )

        if (response.ok) {
          setMessage({ type: 'success', text: 'Precio actualizado correctamente' })
          loadPrecios()
          handleCloseModal()
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.message || 'Error al actualizar precio' })
        }
      } else {
        // Create
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/prices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(precioData),
        })

        if (response.ok) {
          setMessage({ type: 'success', text: 'Precio creado correctamente' })
          loadPrecios()
          handleCloseModal()
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.message || 'Error al crear precio' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleEdit = (precio: Precio) => {
    setEditingPrecio(precio)
    setFormData({
      codigo_examen: precio.codigo_examen.toString(),
      precio: precio.precio.toString(),
      fecha_inicio: precio.fecha_inicio ? precio.fecha_inicio.split('T')[0] : '',
      fecha_fin: precio.fecha_fin ? precio.fecha_fin.split('T')[0] : '',
      activo: precio.activo,
    })
    setShowModal(true)
  }

  const handleToggleActive = async (codigo_precio: number, isActive: boolean) => {
    const action = isActive ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de que deseas ${action} este precio?`)) return

    try {
      if (isActive) {
        // Soft delete (desactivar)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/prices/${codigo_precio}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        )

        if (response.ok) {
          setPrecios((prev) =>
            prev.map((p) =>
              p.codigo_precio === codigo_precio ? { ...p, activo: false } : p
            )
          )
          setMessage({ type: 'success', text: 'Precio desactivado correctamente' })
        }
      } else {
        // Reactivar
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/prices/${codigo_precio}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ activo: true }),
          }
        )

        if (response.ok) {
          setPrecios((prev) =>
            prev.map((p) =>
              p.codigo_precio === codigo_precio ? { ...p, activo: true } : p
            )
          )
          setMessage({ type: 'success', text: 'Precio activado correctamente' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error al ${action} precio` })
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPrecio(null)
    setFormData({
      codigo_examen: '',
      precio: '',
      fecha_inicio: '',
      fecha_fin: '',
      activo: true,
    })
  }

  const filteredPrecios = precios.filter((precio) => {
    const examenNombre = precio.examen?.nombre?.toLowerCase() || ''
    const examenCodigo = precio.examen?.codigo_interno?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    return examenNombre.includes(search) || examenCodigo.includes(search)
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-EC')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  if (loading && precios.length === 0) {
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
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Precios</h1>
          <p className="text-lab-neutral-600 mt-2">
            Administra los precios de los exámenes. Puedes tener múltiples precios por examen con diferentes fechas de vigencia.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Precio
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-current opacity-70 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Buscar por examen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={filterActivo}
              onChange={(e) => {
                setFilterActivo(e.target.value)
                setCurrentPage(1)
              }}
              className="h-10 px-3 rounded-md border border-lab-neutral-300"
            >
              <option value="all">Todos los estados</option>
              <option value="true">Solo activos</option>
              <option value="false">Solo inactivos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Precios Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Precios {pagination && `(${pagination.total} total)`}
          </CardTitle>
          <CardDescription>
            Lista de precios configurados para los exámenes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">ID</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Examen</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Código</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Precio</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Vigencia Desde</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Vigencia Hasta</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrecios.map((precio) => (
                  <tr
                    key={precio.codigo_precio}
                    className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50"
                  >
                    <td className="p-4 text-sm text-lab-neutral-500">#{precio.codigo_precio}</td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">
                        {precio.examen?.nombre || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-mono text-lab-neutral-700">
                      {precio.examen?.codigo_interno || 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-lab-primary-700 text-lg">
                        {formatCurrency(Number(precio.precio))}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-600">
                      {formatDate(precio.fecha_inicio)}
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-600">
                      {formatDate(precio.fecha_fin)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          precio.activo
                            ? 'bg-lab-success-100 text-lab-success-800'
                            : 'bg-lab-neutral-100 text-lab-neutral-600'
                        }`}
                      >
                        {precio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(precio)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={
                          precio.activo
                            ? 'text-lab-danger-600 hover:text-lab-danger-700'
                            : 'text-lab-success-600 hover:text-lab-success-700'
                        }
                        onClick={() => handleToggleActive(precio.codigo_precio, precio.activo)}
                      >
                        {precio.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPrecios.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">
                No se encontraron precios
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-lab-neutral-200">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-lab-neutral-600">
                Página {currentPage} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-lab-neutral-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-lab-neutral-900">
                  {editingPrecio ? 'Editar Precio' : 'Nuevo Precio'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-lab-neutral-400 hover:text-lab-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_examen">Examen *</Label>
                <select
                  id="codigo_examen"
                  value={formData.codigo_examen}
                  onChange={(e) => setFormData({ ...formData, codigo_examen: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
                  required
                  disabled={!!editingPrecio}
                >
                  <option value="">Seleccionar examen...</option>
                  {examenes.map((examen) => (
                    <option key={examen.codigo_examen} value={examen.codigo_examen}>
                      {examen.codigo_interno} - {examen.nombre}
                    </option>
                  ))}
                </select>
                {editingPrecio && (
                  <p className="text-xs text-lab-neutral-500">
                    No se puede cambiar el examen. Cree un nuevo precio si necesita otro examen.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio">Precio (USD) *</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  placeholder="15.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Vigencia Desde</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                  <p className="text-xs text-lab-neutral-500">Opcional</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Vigencia Hasta</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                  <p className="text-xs text-lab-neutral-500">Opcional</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-lab-neutral-300"
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Precio activo
                </Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPrecio ? 'Actualizar' : 'Crear'} Precio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
