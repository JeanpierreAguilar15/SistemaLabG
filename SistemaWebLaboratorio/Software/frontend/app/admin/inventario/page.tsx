'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CategoriaItem {
  codigo_categoria_item: number
  nombre: string
}

interface ItemInventario {
  codigo_item: number
  nombre: string
  descripcion: string | null
  codigo_categoria_item: number
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  unidad_medida: string
  activo: boolean
  categoria: {
    nombre: string
  }
}

export default function InventarioPage() {
  const { accessToken } = useAuthStore()
  const [items, setItems] = useState<ItemInventario[]>([])
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemInventario | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && accessToken) {
      loadItems()
      loadCategorias()
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

  const loadItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        const items = result.data || result
        setItems(items)
      }
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/categories`, {
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

  const createItem = async (formData: ItemFormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Item creado exitosamente' })
        loadItems()
        setShowCreateModal(false)
      } else {
        setMessage({ type: 'error', text: 'Error al crear item' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al crear item' })
    }
  }

  const updateItem = async (codigo_item: number, formData: ItemFormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items/${codigo_item}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Item actualizado exitosamente' })
        loadItems()
        setShowEditModal(false)
        setSelectedItem(null)
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar item' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar item' })
    }
  }

  const adjustStock = async (codigo_item: number, tipo: 'ENTRADA' | 'SALIDA', cantidad: number, motivo: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items/${codigo_item}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tipo, cantidad, motivo }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Stock ajustado exitosamente' })
        loadItems()
        setShowAdjustModal(false)
        setSelectedItem(null)
      } else {
        setMessage({ type: 'error', text: 'Error al ajustar stock' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al ajustar stock' })
    }
  }

  const confirmDelete = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items/${selectedItem.codigo_item}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (response.ok) {
        setMessage({ type: 'success', text: 'Item eliminado exitosamente' })
        loadItems()
        setShowDeleteModal(false)
        setSelectedItem(null)
      } else {
        setMessage({ type: 'error', text: 'Error al eliminar item' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar item' })
    }
  }

  const filteredItems = items.filter((item) => {
    const matchSearch =
      searchTerm === '' ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    if (item.stock_actual >= item.stock_maximo) {
      return { label: 'Exceso', color: 'bg-lab-info-100 text-lab-info-800' }
    }
    return { label: 'Óptimo', color: 'bg-lab-success-100 text-lab-success-800' }
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Inventario</h1>
          <p className="text-lab-neutral-600 mt-2">
            Administra el stock de reactivos e insumos del laboratorio
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Item
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
                  (item) => item.stock_actual > item.stock_minimo && item.stock_actual < item.stock_maximo
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
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

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
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Nombre</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Categoría</th>
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
                      <td className="p-4">
                        <div className="font-medium text-lab-neutral-900">{item.nombre}</div>
                        {item.descripcion && (
                          <div className="text-sm text-lab-neutral-600 truncate max-w-xs">{item.descripcion}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-lab-neutral-700">{item.categoria.nombre}</td>
                      <td className="p-4 font-semibold text-lab-neutral-900">{item.stock_actual}</td>
                      <td className="p-4 text-sm text-lab-neutral-600">
                        {item.stock_minimo} / {item.stock_maximo}
                      </td>
                      <td className="p-4 text-sm text-lab-neutral-600">{item.unidad_medida}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowEditModal(true)
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowAdjustModal(true)
                            }}
                          >
                            Ajustar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-lab-danger-600 hover:bg-lab-danger-50"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowDeleteModal(true)
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
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

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <ItemFormModal
          item={showEditModal ? selectedItem : null}
          categorias={categorias}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedItem(null)
          }}
          onSave={(formData) => {
            if (showEditModal && selectedItem) {
              updateItem(selectedItem.codigo_item, formData)
            } else {
              createItem(formData)
            }
          }}
        />
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <AdjustStockModal
          item={selectedItem}
          onClose={() => {
            setShowAdjustModal(false)
            setSelectedItem(null)
          }}
          onConfirm={adjustStock}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-lab-neutral-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-lab-neutral-600 mb-6">
              ¿Estás seguro de que deseas eliminar el item <span className="font-semibold">{selectedItem.nombre}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedItem(null)
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

interface ItemFormData {
  nombre: string
  descripcion: string
  codigo_categoria_item: number
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  unidad_medida: string
  activo: boolean
}

function ItemFormModal({
  item,
  categorias,
  onClose,
  onSave,
}: {
  item: ItemInventario | null
  categorias: CategoriaItem[]
  onClose: () => void
  onSave: (formData: ItemFormData) => void
}) {
  const [nombre, setNombre] = useState(item?.nombre || '')
  const [descripcion, setDescripcion] = useState(item?.descripcion || '')
  const [categoria, setCategoria] = useState(item?.codigo_categoria_item || 0)
  const [stockActual, setStockActual] = useState(item?.stock_actual || 0)
  const [stockMinimo, setStockMinimo] = useState(item?.stock_minimo || 0)
  const [stockMaximo, setStockMaximo] = useState(item?.stock_maximo || 100)
  const [unidadMedida, setUnidadMedida] = useState(item?.unidad_medida || 'unidad')
  const [activo, setActivo] = useState(item?.activo ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      nombre,
      descripcion,
      codigo_categoria_item: categoria,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      stock_maximo: stockMaximo,
      unidad_medida: unidadMedida,
      activo,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8">
        <div className="p-6 border-b border-lab-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-lab-neutral-900">{item ? 'Editar' : 'Nuevo'} Item</h2>
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
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del item"
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
                placeholder="Descripción del item..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(parseInt(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
                required
              >
                <option value={0}>Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.codigo_categoria_item} value={cat.codigo_categoria_item}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidad">Unidad de Medida *</Label>
              <Input
                id="unidad"
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                placeholder="ej: unidad, ml, g"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockActual">Stock Actual *</Label>
              <Input
                id="stockActual"
                type="number"
                min="0"
                value={stockActual}
                onChange={(e) => setStockActual(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
              <Input
                id="stockMinimo"
                type="number"
                min="0"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="stockMaximo">Stock Máximo *</Label>
              <Input
                id="stockMaximo"
                type="number"
                min="0"
                value={stockMaximo}
                onChange={(e) => setStockMaximo(parseInt(e.target.value) || 100)}
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
                <Label htmlFor="activo">Item activo</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{item ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdjustStockModal({
  item,
  onClose,
  onConfirm,
}: {
  item: ItemInventario
  onClose: () => void
  onConfirm: (codigo_item: number, tipo: 'ENTRADA' | 'SALIDA', cantidad: number, motivo: string) => void
}) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cantidad > 0 && motivo.trim()) {
      onConfirm(item.codigo_item, tipo, cantidad, motivo)
    }
  }

  const nuevoStock = tipo === 'ENTRADA' ? item.stock_actual + cantidad : item.stock_actual - cantidad

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-lab-neutral-200">
          <h2 className="text-xl font-bold text-lab-neutral-900">Ajustar Stock</h2>
          <p className="text-sm text-lab-neutral-600 mt-1">{item.nombre}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-lab-neutral-50 p-4 rounded-lg">
            <p className="text-sm text-lab-neutral-600">Stock Actual</p>
            <p className="text-2xl font-bold text-lab-neutral-900">{item.stock_actual} {item.unidad_medida}</p>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Movimiento *</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="ENTRADA"
                  checked={tipo === 'ENTRADA'}
                  onChange={(e) => setTipo(e.target.value as 'ENTRADA')}
                  className="w-4 h-4 text-lab-primary-600"
                />
                <span className="text-sm">Entrada (Agregar)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="SALIDA"
                  checked={tipo === 'SALIDA'}
                  onChange={(e) => setTipo(e.target.value as 'SALIDA')}
                  className="w-4 h-4 text-lab-primary-600"
                />
                <span className="text-sm">Salida (Restar)</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              max={tipo === 'SALIDA' ? item.stock_actual : undefined}
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-lab-neutral-300"
              placeholder="Explique el motivo del ajuste..."
              required
            />
          </div>

          <div className="bg-lab-info-50 p-4 rounded-lg">
            <p className="text-sm text-lab-info-800">
              Nuevo stock: <span className="font-bold">{nuevoStock} {item.unidad_medida}</span>
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-lab-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{tipo === 'ENTRADA' ? 'Agregar' : 'Restar'} Stock</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
