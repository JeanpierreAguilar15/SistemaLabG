'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (accessToken) {
      loadItems()
    }
  }, [accessToken])

  const loadItems = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Inventory loaded:', result)
        // Backend returns paginated data: { data: [], pagination: {} }
        const items = result.data || result
        setItems(items)
      } else {
        console.error('Failed to load inventory:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
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
        <Button>
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
                      <td className="p-4 text-right space-x-2">
                        <Button size="sm" variant="outline">
                          Editar
                        </Button>
                        <Button size="sm" variant="outline">
                          Ajustar
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
