'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ItemInventario {
  codigo_item: number
  codigo_interno: string
  nombre: string
  descripcion: string | null
  codigo_categoria: number | null
  stock_actual: number
  stock_minimo: number
  stock_maximo: number | null
  costo_unitario: string | null
  precio_venta: string | null
  unidad_medida: string
  activo: boolean
  categoria?: {
    nombre: string
  } | null
}

interface Message {
  type: 'success' | 'error'
  text: string
}

export default function InventarioPage() {
  const { accessToken } = useAuthStore()
  const [items, setItems] = useState<ItemInventario[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemInventario | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [formData, setFormData] = useState({
    codigo_interno: '',
    nombre: '',
    descripcion: '',
    unidad_medida: '',
    stock_actual: '0',
    stock_minimo: '0',
    stock_maximo: '',
    costo_unitario: '',
    precio_venta: '',
    activo: true,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && accessToken) {
      loadItems()
    }
  }, [accessToken, mounted])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const items = result.data || result
        setItems(items)
      } else {
        setMessage({ type: 'error', text: 'Error al cargar items de inventario' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (item?: ItemInventario) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        codigo_interno: item.codigo_interno,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        unidad_medida: item.unidad_medida,
        stock_actual: item.stock_actual.toString(),
        stock_minimo: item.stock_minimo.toString(),
        stock_maximo: item.stock_maximo?.toString() || '',
        costo_unitario: item.costo_unitario || '',
        precio_venta: item.precio_venta || '',
        activo: item.activo,
      })
    } else {
      setEditingItem(null)
      setFormData({
        codigo_interno: '',
        nombre: '',
        descripcion: '',
        unidad_medida: '',
        stock_actual: '0',
        stock_minimo: '0',
        stock_maximo: '',
        costo_unitario: '',
        precio_venta: '',
        activo: true,
      })
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingItem(null)
    setFormData({
      codigo_interno: '',
      nombre: '',
      descripcion: '',
      unidad_medida: '',
      stock_actual: '0',
      stock_minimo: '0',
      stock_maximo: '',
      costo_unitario: '',
      precio_venta: '',
      activo: true,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items/${editingItem.codigo_item}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items`

      const payload: any = {
        codigo_interno: formData.codigo_interno,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        unidad_medida: formData.unidad_medida,
        stock_actual: parseInt(formData.stock_actual),
        stock_minimo: parseInt(formData.stock_minimo),
        activo: formData.activo,
      }

      if (formData.stock_maximo) {
        payload.stock_maximo = parseInt(formData.stock_maximo)
      }

      if (formData.costo_unitario) {
        payload.costo_unitario = parseFloat(formData.costo_unitario)
      }

      if (formData.precio_venta) {
        payload.precio_venta = parseFloat(formData.precio_venta)
      }

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingItem ? '✅ Item actualizado correctamente' : '✅ Item creado correctamente',
        })
        handleCloseForm()
        loadItems()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al guardar item' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleDelete = async (codigo_item: number) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este item?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items/${codigo_item}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok || response.status === 204) {
        setMessage({ type: 'success', text: '✅ Item desactivado correctamente' })
        loadItems()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al desactivar item' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const filteredItems = items.filter((item) => {
    const matchSearch =
      searchTerm === '' ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  const getStockStatus = (item: ItemInventario) => {
    if (item.stock_actual === 0) {
      return { label: 'Sin Stock', color: 'bg-lab-danger-100 text-lab-danger-800' }
    }
    if (item.stock_actual <= item.stock_minimo) {
      return { label: 'Bajo', color: 'bg-lab-warning-100 text-lab-warning-800' }
    }
    if (item.stock_maximo && item.stock_actual >= item.stock_maximo) {
      return { label: 'Exceso', color: 'bg-lab-info-100 text-lab-info-800' }
    }
    return { label: 'Óptimo', color: 'bg-lab-success-100 text-lab-success-800' }
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Inventario</h1>
          <p className="text-lab-neutral-600 mt-2">
            Administra el stock de reactivos e insumos del laboratorio
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total Items</div>
            <div className="text-2xl font-bold text-lab-neutral-900 mt-2">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Stock Bajo</div>
            <div className="text-2xl font-bold text-lab-warning-600 mt-2">
              {items.filter((item) => item.stock_actual <= item.stock_minimo && item.stock_actual > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Sin Stock</div>
            <div className="text-2xl font-bold text-lab-danger-600 mt-2">
              {items.filter((item) => item.stock_actual === 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Stock Óptimo</div>
            <div className="text-2xl font-bold text-lab-success-600 mt-2">
              {
                items.filter(
                  (item) => item.stock_actual > item.stock_minimo &&
                  (!item.stock_maximo || item.stock_actual < item.stock_maximo)
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por nombre, código interno o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-lab-neutral-200">
              <h2 className="text-2xl font-bold text-lab-neutral-900">
                {editingItem ? 'Editar Item de Inventario' : 'Nuevo Item de Inventario'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="codigo_interno" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    id="codigo_interno"
                    name="codigo_interno"
                    value={formData.codigo_interno}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Nombre del Item *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="descripcion" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={2}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="unidad_medida" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Unidad de Medida *
                  </label>
                  <select
                    id="unidad_medida"
                    name="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Unidad">Unidad</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="L">Litros (L)</option>
                    <option value="mg">Miligramos (mg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="stock_actual" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    id="stock_actual"
                    name="stock_actual"
                    value={formData.stock_actual}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="stock_minimo" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    id="stock_minimo"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="stock_maximo" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    id="stock_maximo"
                    name="stock_maximo"
                    value={formData.stock_maximo}
                    onChange={handleInputChange}
                    min="0"
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="costo_unitario" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Costo Unitario (USD)
                  </label>
                  <input
                    type="number"
                    id="costo_unitario"
                    name="costo_unitario"
                    value={formData.costo_unitario}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="precio_venta" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Precio de Venta (USD)
                  </label>
                  <input
                    type="number"
                    id="precio_venta"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
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
                    Item activo
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-lab-neutral-200">
                <Button type="button" onClick={handleCloseForm} variant="outline">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-lab-primary-600 hover:bg-lab-primary-700">
                  {editingItem ? 'Actualizar' : 'Crear'} Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items de Inventario ({filteredItems.length})</CardTitle>
          <CardDescription>Control de stock de reactivos e insumos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Código</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Nombre</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Stock Actual</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Mín/Máx</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Unidad</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item)
                  return (
                    <tr key={item.codigo_item} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                      <td className="p-4 text-sm font-mono text-lab-neutral-700">{item.codigo_interno}</td>
                      <td className="p-4">
                        <div className="font-medium text-lab-neutral-900">{item.nombre}</div>
                        {item.descripcion && (
                          <div className="text-sm text-lab-neutral-600 truncate max-w-xs">{item.descripcion}</div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-lab-neutral-900">{item.stock_actual}</td>
                      <td className="p-4 text-sm text-lab-neutral-600">
                        {item.stock_minimo} / {item.stock_maximo || '-'}
                      </td>
                      <td className="p-4 text-sm text-lab-neutral-600">{item.unidad_medida}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenForm(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.codigo_item)}
                          className="text-lab-danger-600 hover:text-lab-danger-700 hover:bg-lab-danger-50"
                        >
                          Desactivar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">
                No se encontraron items de inventario
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
