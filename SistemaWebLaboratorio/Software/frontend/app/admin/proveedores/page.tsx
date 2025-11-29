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

interface Message {
  type: 'success' | 'error'
  text: string
}

// Validador de RUC ecuatoriano
function validateRucEcuador(ruc: string): boolean {
  if (!ruc || ruc.length !== 13) return false

  const codigoProvincia = parseInt(ruc.substring(0, 2))
  if (codigoProvincia < 1 || codigoProvincia > 24) return false

  const tercerDigito = parseInt(ruc.charAt(2))
  if (tercerDigito < 0 || tercerDigito > 9) return false

  // Los últimos 3 dígitos deben ser 001 para sociedades o 000 para personas naturales
  const ultimos3 = ruc.substring(10, 13)
  if (ultimos3 !== '001' && ultimos3 !== '000') return false

  return true
}

export default function SuppliersManagement() {
  const { accessToken } = useAuthStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [rucError, setRucError] = useState<string>('')
  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    telefono: '',
    email: '',
    direccion: '',
    activo: true,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && accessToken) {
      loadSuppliers()
    }
  }, [accessToken, mounted])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/suppliers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      } else {
        setMessage({ type: 'error', text: 'Error al cargar proveedores' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        ruc: supplier.ruc,
        razon_social: supplier.razon_social,
        nombre_comercial: supplier.nombre_comercial || '',
        telefono: supplier.telefono || '',
        email: supplier.email || '',
        direccion: supplier.direccion || '',
        activo: supplier.activo,
      })
    } else {
      setEditingSupplier(null)
      setFormData({
        ruc: '',
        razon_social: '',
        nombre_comercial: '',
        telefono: '',
        email: '',
        direccion: '',
        activo: true,
      })
    }
    setRucError('')
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSupplier(null)
    setRucError('')
    setFormData({
      ruc: '',
      razon_social: '',
      nombre_comercial: '',
      telefono: '',
      email: '',
      direccion: '',
      activo: true,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))

    // Validar RUC en tiempo real
    if (name === 'ruc') {
      if (value.length === 13) {
        if (!validateRucEcuador(value)) {
          setRucError('RUC ecuatoriano inválido')
        } else {
          setRucError('')
        }
      } else if (value.length > 0) {
        setRucError('El RUC debe tener 13 dígitos')
      } else {
        setRucError('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar RUC antes de enviar
    if (!validateRucEcuador(formData.ruc)) {
      setRucError('RUC ecuatoriano inválido')
      return
    }

    try {
      const url = editingSupplier
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/suppliers/${editingSupplier.codigo_proveedor}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/suppliers`

      const payload: any = {
        ruc: formData.ruc,
        razon_social: formData.razon_social,
        activo: formData.activo,
      }

      if (formData.nombre_comercial) payload.nombre_comercial = formData.nombre_comercial
      if (formData.telefono) payload.telefono = formData.telefono
      if (formData.email) payload.email = formData.email
      if (formData.direccion) payload.direccion = formData.direccion

      const response = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingSupplier ? '✅ Proveedor actualizado correctamente' : '✅ Proveedor creado correctamente',
        })
        handleCloseForm()
        loadSuppliers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al guardar proveedor' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleDelete = async (codigo_proveedor: number) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este proveedor?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/suppliers/${codigo_proveedor}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok || response.status === 204) {
        setMessage({ type: 'success', text: '✅ Proveedor desactivado correctamente' })
        loadSuppliers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al desactivar proveedor' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
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
      {/* Messages */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Proveedores</h1>
          <p className="text-lab-neutral-600 mt-1">Administra los proveedores del laboratorio</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Proveedor
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-lab-neutral-200">
              <h2 className="text-2xl font-bold text-lab-neutral-900">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ruc" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                      RUC * (13 dígitos)
                    </label>
                    <input
                      type="text"
                      id="ruc"
                      name="ruc"
                      value={formData.ruc}
                      onChange={handleInputChange}
                      required
                      maxLength={13}
                      pattern="^\d{13}$"
                      className={`block w-full rounded-md border px-3 py-2 focus:ring-lab-primary-500 ${
                        rucError
                          ? 'border-lab-danger-500 focus:border-lab-danger-500'
                          : 'border-lab-neutral-300 focus:border-lab-primary-500'
                      }`}
                    />
                    {rucError && <p className="mt-1 text-sm text-lab-danger-600">{rucError}</p>}
                    <p className="mt-1 text-xs text-lab-neutral-500">
                      Formato: 13 dígitos (ej: 1790123456001)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="razon_social" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      id="razon_social"
                      name="razon_social"
                      value={formData.razon_social}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="nombre_comercial" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    id="nombre_comercial"
                    name="nombre_comercial"
                    value={formData.nombre_comercial}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    rows={2}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-lab-primary-600 focus:ring-lab-primary-500 border-lab-neutral-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-lab-neutral-700">
                    Proveedor activo
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-lab-neutral-200">
                <Button type="button" onClick={handleCloseForm} variant="outline">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-lab-primary-600 hover:bg-lab-primary-700"
                  disabled={!!rucError}
                >
                  {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200">
        <div className="px-6 py-4 border-b border-lab-neutral-200">
          <h2 className="text-lg font-semibold text-lab-neutral-900">
            Proveedores Registrados ({suppliers.length})
          </h2>
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
                    <div className="text-sm font-medium text-lab-neutral-900 font-mono">{supplier.ruc}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-lab-neutral-900">{supplier.razon_social}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(supplier)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(supplier.codigo_proveedor)}
                      className="text-lab-danger-600 hover:text-lab-danger-700 hover:bg-lab-danger-50"
                    >
                      Desactivar
                    </Button>
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
    </div>
  )
}
