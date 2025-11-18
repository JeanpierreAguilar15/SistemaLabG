'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface Supplier {
  codigo_proveedor: number
  ruc: string
  razon_social: string
  nombre_comercial: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  fecha_creacion: string
}

export default function SuppliersManagement() {
  const { accessToken } = useAuthStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Esperar a que el componente se monte en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    console.log('Proveedores - accessToken:', accessToken ? 'exists' : 'null', 'mounted:', mounted)
    if (mounted && accessToken) {
      loadSuppliers()
    }
  }, [accessToken, mounted])

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadSuppliers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const fullUrl = `${apiUrl}/admin/suppliers`

      console.log('=== PROVEEDORES DEBUG ===')
      console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL)
      console.log('Full URL:', fullUrl)
      console.log('Token exists:', !!accessToken)
      console.log('Token preview:', accessToken?.substring(0, 50))

      setLoading(true)
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Suppliers response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Suppliers loaded successfully:', data.length, 'items')
        setSuppliers(data)
      } else {
        const errorText = await response.text()
        console.error('Failed to load suppliers:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${apiUrl}/admin/suppliers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Proveedor creado exitosamente' })
        loadSuppliers()
        setShowCreateModal(false)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.message || 'Error al crear proveedor' })
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
      setMessage({ type: 'error', text: 'Error al crear proveedor' })
    }
  }

  const updateSupplier = async (codigo_proveedor: number, supplierData: Partial<Supplier>) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${apiUrl}/admin/suppliers/${codigo_proveedor}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Proveedor actualizado exitosamente' })
        loadSuppliers()
        setShowEditModal(false)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.message || 'Error al actualizar proveedor' })
      }
    } catch (error) {
      console.error('Error updating supplier:', error)
      setMessage({ type: 'error', text: 'Error al actualizar proveedor' })
    }
  }

  const deleteSupplier = async (codigo_proveedor: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${apiUrl}/admin/suppliers/${codigo_proveedor}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Proveedor eliminado exitosamente' })
        loadSuppliers()
        setShowDeleteModal(false)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.message || 'Error al eliminar proveedor' })
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      setMessage({ type: 'error', text: 'Error al eliminar proveedor' })
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Proveedores</h1>
          <p className="text-lab-neutral-600 mt-1">Administra los proveedores del laboratorio</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-lab-primary-600 hover:bg-lab-primary-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Proveedor
        </Button>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200">
        <div className="px-6 py-4 border-b border-lab-neutral-200">
          <h2 className="text-lg font-semibold text-lab-neutral-900">Proveedores Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-lab-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  RUC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Razón Social
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Nombre Comercial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-lab-neutral-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-lab-neutral-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.codigo_proveedor} className="hover:bg-lab-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-lab-neutral-900">{supplier.ruc}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-lab-neutral-900">{supplier.razon_social}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-lab-neutral-600">
                      {supplier.nombre_comercial || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-lab-neutral-600">
                      {supplier.telefono && <div>{supplier.telefono}</div>}
                      {supplier.email && <div className="text-xs">{supplier.email}</div>}
                      {!supplier.telefono && !supplier.email && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.activo
                          ? 'bg-lab-success-100 text-lab-success-800'
                          : 'bg-lab-neutral-100 text-lab-neutral-800'
                      }`}
                    >
                      {supplier.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setShowDetailModal(true)
                        }}
                        title="Ver detalles"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setShowEditModal(true)
                        }}
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setShowDeleteModal(true)
                        }}
                        className="text-lab-error-600 hover:text-lab-error-700"
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
        </div>

        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-lab-neutral-900">No hay proveedores</h3>
            <p className="mt-1 text-sm text-lab-neutral-500">Comienza registrando un nuevo proveedor.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <SupplierFormModal
          supplier={showEditModal ? selectedSupplier : null}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedSupplier(null)
          }}
          onSave={(data) => {
            if (showEditModal && selectedSupplier) {
              updateSupplier(selectedSupplier.codigo_proveedor, data)
            } else {
              createSupplier(data)
            }
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedSupplier(null)
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSupplier && (
        <DeleteConfirmationModal
          supplierName={selectedSupplier.razon_social}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedSupplier(null)
          }}
          onConfirm={() => deleteSupplier(selectedSupplier.codigo_proveedor)}
        />
      )}
    </div>
  )
}

// Supplier Form Modal Component
function SupplierFormModal({
  supplier,
  onClose,
  onSave,
}: {
  supplier: Supplier | null
  onClose: () => void
  onSave: (data: Partial<Supplier>) => void
}) {
  const [ruc, setRuc] = useState(supplier?.ruc || '')
  const [razonSocial, setRazonSocial] = useState(supplier?.razon_social || '')
  const [nombreComercial, setNombreComercial] = useState(supplier?.nombre_comercial || '')
  const [telefono, setTelefono] = useState(supplier?.telefono || '')
  const [email, setEmail] = useState(supplier?.email || '')
  const [direccion, setDireccion] = useState(supplier?.direccion || '')
  const [activo, setActivo] = useState(supplier?.activo ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ruc,
      razon_social: razonSocial,
      nombre_comercial: nombreComercial || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      activo,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-lab-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-lab-neutral-900">
            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                RUC <span className="text-lab-error-600">*</span>
              </label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                Razón Social <span className="text-lab-error-600">*</span>
              </label>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                Nombre Comercial
              </label>
              <input
                type="text"
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 text-lab-primary-600 border-lab-neutral-300 rounded focus:ring-lab-primary-500"
            />
            <label htmlFor="activo" className="ml-2 text-sm text-lab-neutral-700">
              Proveedor activo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-lab-primary-600 hover:bg-lab-primary-700">
              {supplier ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Supplier Detail Modal Component
function SupplierDetailModal({
  supplier,
  onClose,
}: {
  supplier: Supplier
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-lab-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-lab-neutral-900">Detalles del Proveedor</h2>
          <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">RUC</label>
              <p className="text-lab-neutral-900">{supplier.ruc}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Razón Social</label>
              <p className="text-lab-neutral-900">{supplier.razon_social}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Nombre Comercial</label>
              <p className="text-lab-neutral-900">{supplier.nombre_comercial || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Teléfono</label>
              <p className="text-lab-neutral-900">{supplier.telefono || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Email</label>
              <p className="text-lab-neutral-900">{supplier.email || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Dirección</label>
              <p className="text-lab-neutral-900">{supplier.direccion || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Estado</label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  supplier.activo
                    ? 'bg-lab-success-100 text-lab-success-800'
                    : 'bg-lab-neutral-100 text-lab-neutral-800'
                }`}
              >
                {supplier.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Fecha de Registro</label>
              <p className="text-lab-neutral-900">
                {new Date(supplier.fecha_creacion).toLocaleDateString('es-EC')}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
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
  supplierName,
  onClose,
  onConfirm,
}: {
  supplierName: string
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
            ¿Eliminar Proveedor?
          </h3>
          <p className="mt-2 text-sm text-center text-lab-neutral-600">
            ¿Estás seguro de que deseas eliminar el proveedor <strong>{supplierName}</strong>? Esta acción no se puede deshacer.
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
