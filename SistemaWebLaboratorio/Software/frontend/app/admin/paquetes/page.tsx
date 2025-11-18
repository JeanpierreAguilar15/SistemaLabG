'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Examen {
  codigo_examen: number
  nombre: string
  precio: number
}

interface Package {
  codigo_paquete: number
  nombre: string
  descripcion: string | null
  precio_paquete: string
  descuento: string
  activo: boolean
  fecha_creacion: string
  examenes?: Array<{
    examen: Examen
  }>
  _count?: {
    examenes: number
  }
}

export default function PackagesManagement() {
  const { accessToken } = useAuthStore()
  const [packages, setPackages] = useState<Package[]>([])
  const [allExamenes, setAllExamenes] = useState<Examen[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && accessToken) {
      loadPackages()
      loadExamenes()
    }
  }, [accessToken, mounted])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/packages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (error) {
      console.error('Error loading packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExamenes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/exams`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        const examenes = result.data || result
        setAllExamenes(examenes)
      }
    } catch (error) {
      console.error('Error loading examenes:', error)
    }
  }

  const handleCreate = (formData: PackageFormData) => {
    createPackage(formData)
  }

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg)
    setShowEditModal(true)
  }

  const handleViewDetails = (pkg: Package) => {
    setSelectedPackage(pkg)
    setShowDetailModal(true)
  }

  const handleDelete = (pkg: Package) => {
    setSelectedPackage(pkg)
    setShowDeleteModal(true)
  }

  const createPackage = async (formData: PackageFormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Paquete creado exitosamente' })
        loadPackages()
        setShowCreateModal(false)
      } else {
        setMessage({ type: 'error', text: 'Error al crear paquete' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al crear paquete' })
    }
  }

  const updatePackage = async (codigo_paquete: number, formData: PackageFormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/packages/${codigo_paquete}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Paquete actualizado exitosamente' })
        loadPackages()
        setShowEditModal(false)
        setSelectedPackage(null)
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar paquete' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar paquete' })
    }
  }

  const confirmDelete = async () => {
    if (!selectedPackage) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/packages/${selectedPackage.codigo_paquete}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (response.ok) {
        setMessage({ type: 'success', text: 'Paquete eliminado exitosamente' })
        loadPackages()
        setShowDeleteModal(false)
        setSelectedPackage(null)
      } else {
        setMessage({ type: 'error', text: 'Error al eliminar paquete' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar paquete' })
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Paquetes</h1>
          <p className="text-lab-neutral-600 mt-1">Administra los paquetes de exámenes</p>
        </div>
        <Button className="bg-lab-primary-600 hover:bg-lab-primary-700" onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Paquete
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex justify-between items-center ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4 hover:opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.codigo_paquete}
            className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-lab-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  pkg.activo ? 'bg-lab-success-100 text-lab-success-800' : 'bg-lab-neutral-100 text-lab-neutral-800'
                }`}
              >
                {pkg.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-2">{pkg.nombre}</h3>

            <p className="text-sm text-lab-neutral-600 mb-4 line-clamp-2">
              {pkg.descripcion || 'Sin descripción'}
            </p>

            <div className="flex items-center justify-between py-3 border-t border-b border-lab-neutral-200 my-4">
              <div>
                <p className="text-xs text-lab-neutral-500">Precio</p>
                <p className="text-2xl font-bold text-lab-primary-600">${Number(pkg.precio_paquete).toFixed(2)}</p>
              </div>
              {Number(pkg.descuento) > 0 && (
                <div className="text-right">
                  <p className="text-xs text-lab-neutral-500">Descuento</p>
                  <p className="text-lg font-semibold text-lab-success-600">{Number(pkg.descuento).toFixed(0)}%</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-sm text-lab-neutral-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>{pkg._count?.examenes || 0} exámenes</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(pkg)}>
                Ver
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(pkg)}>
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-lab-danger-600 hover:bg-lab-danger-50"
                onClick={() => handleDelete(pkg)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-lab-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-lab-neutral-900">No hay paquetes</h3>
          <p className="mt-1 text-sm text-lab-neutral-500">Comienza creando un nuevo paquete de exámenes.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <PackageFormModal
          package={showEditModal ? selectedPackage : null}
          examenes={allExamenes}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedPackage(null)
          }}
          onSave={(formData) => {
            if (showEditModal && selectedPackage) {
              updatePackage(selectedPackage.codigo_paquete, formData)
            } else {
              createPackage(formData)
            }
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPackage && (
        <PackageDetailModal
          package={selectedPackage}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedPackage(null)
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-lab-neutral-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-lab-neutral-600 mb-6">
              ¿Estás seguro de que deseas eliminar el paquete{' '}
              <span className="font-semibold">{selectedPackage.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedPackage(null)
                }}
              >
                Cancelar
              </Button>
              <Button className="bg-lab-danger-600 hover:bg-lab-danger-700" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Types for form data
interface PackageFormData {
  nombre: string
  descripcion: string
  precio_paquete: number
  descuento: number
  activo: boolean
  examenes: number[]
}

// Package Form Modal Component
function PackageFormModal({
  package: pkg,
  examenes,
  onClose,
  onSave,
}: {
  package: Package | null
  examenes: Examen[]
  onClose: () => void
  onSave: (formData: PackageFormData) => void
}) {
  const [nombre, setNombre] = useState(pkg?.nombre || '')
  const [descripcion, setDescripcion] = useState(pkg?.descripcion || '')
  const [precio, setPrecio] = useState(Number(pkg?.precio_paquete || 0))
  const [descuento, setDescuento] = useState(Number(pkg?.descuento || 0))
  const [activo, setActivo] = useState(pkg?.activo ?? true)
  const [selectedExamenes, setSelectedExamenes] = useState<number[]>(
    pkg?.examenes?.map((e) => e.examen.codigo_examen) || []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      nombre,
      descripcion,
      precio_paquete: precio,
      descuento,
      activo,
      examenes: selectedExamenes,
    })
  }

  const toggleExamen = (codigo_examen: number) => {
    if (selectedExamenes.includes(codigo_examen)) {
      setSelectedExamenes(selectedExamenes.filter((id) => id !== codigo_examen))
    } else {
      setSelectedExamenes([...selectedExamenes, codigo_examen])
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full my-8">
        <div className="p-6 border-b border-lab-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-lab-neutral-900">{pkg ? 'Editar' : 'Crear'} Paquete</h2>
            <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre del Paquete *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Paquete Básico"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-lab-neutral-300"
                placeholder="Descripción del paquete..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio ($) *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descuento">Descuento (%) *</Label>
              <Input
                id="descuento"
                type="number"
                step="1"
                min="0"
                max="100"
                value={descuento}
                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 text-lab-primary-600 border-lab-neutral-300 rounded"
                />
                <Label htmlFor="activo">Paquete activo</Label>
              </div>
            </div>
          </div>

          {/* Examenes Selection */}
          <div className="space-y-2">
            <Label>Exámenes Incluidos *</Label>
            <div className="border border-lab-neutral-300 rounded-md p-4 max-h-60 overflow-y-auto">
              {examenes.map((examen) => (
                <div key={examen.codigo_examen} className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id={`examen-${examen.codigo_examen}`}
                    checked={selectedExamenes.includes(examen.codigo_examen)}
                    onChange={() => toggleExamen(examen.codigo_examen)}
                    className="w-4 h-4 text-lab-primary-600 border-lab-neutral-300 rounded"
                  />
                  <label htmlFor={`examen-${examen.codigo_examen}`} className="flex-1 text-sm cursor-pointer">
                    {examen.nombre} - ${Number(examen.precio).toFixed(2)}
                  </label>
                </div>
              ))}
              {examenes.length === 0 && (
                <p className="text-sm text-lab-neutral-500 text-center py-4">
                  No hay exámenes disponibles. Crea exámenes primero.
                </p>
              )}
            </div>
            <p className="text-xs text-lab-neutral-500">{selectedExamenes.length} exámenes seleccionados</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{pkg ? 'Actualizar' : 'Crear'} Paquete</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Package Detail Modal Component
function PackageDetailModal({ package: pkg, onClose }: { package: Package; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-lab-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-lab-neutral-900">Detalles del Paquete</h2>
            <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-lab-neutral-900">{pkg.nombre}</h3>
            <p className="text-lab-neutral-600 mt-1">{pkg.descripcion || 'Sin descripción'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-lab-neutral-50 p-4 rounded-lg">
              <p className="text-sm text-lab-neutral-600 mb-1">Precio</p>
              <p className="text-2xl font-bold text-lab-primary-600">${Number(pkg.precio_paquete).toFixed(2)}</p>
            </div>
            <div className="bg-lab-neutral-50 p-4 rounded-lg">
              <p className="text-sm text-lab-neutral-600 mb-1">Descuento</p>
              <p className="text-2xl font-bold text-lab-success-600">{Number(pkg.descuento).toFixed(0)}%</p>
            </div>
          </div>

          <div className="bg-lab-neutral-50 p-4 rounded-lg">
            <p className="text-sm text-lab-neutral-600 mb-1">Estado</p>
            <span
              className={`text-sm px-3 py-1 rounded ${
                pkg.activo ? 'bg-lab-success-100 text-lab-success-800' : 'bg-lab-neutral-100 text-lab-neutral-800'
              }`}
            >
              {pkg.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {pkg.examenes && pkg.examenes.length > 0 && (
            <div>
              <h4 className="font-semibold text-lab-neutral-900 mb-3">Exámenes Incluidos ({pkg.examenes.length})</h4>
              <div className="space-y-2">
                {pkg.examenes.map((item) => (
                  <div key={item.examen.codigo_examen} className="flex justify-between items-center p-3 bg-lab-neutral-50 rounded-lg">
                    <span className="font-medium text-lab-neutral-900">{item.examen.nombre}</span>
                    <span className="text-sm text-lab-neutral-600">${Number(item.examen.precio).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
