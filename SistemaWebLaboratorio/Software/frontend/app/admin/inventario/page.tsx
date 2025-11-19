'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateStockRanges, validatePriceRelation, formatDateTime, formatDate } from '@/lib/utils'

// Interfaces for Items
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

// Interfaces for Movements
interface Movimiento {
  codigo_movimiento: number
  codigo_item: number
  codigo_lote: number | null
  tipo_movimiento: string
  cantidad: number
  motivo: string | null
  stock_anterior: number
  stock_nuevo: number
  fecha_movimiento: string
  realizado_por: number | null
  item: {
    codigo_interno: string
    nombre: string
    unidad_medida: string
  }
  usuario: {
    nombres: string
    apellidos: string
  } | null
  lote: {
    numero_lote: string
  } | null
}

// Interfaces for Alerts
interface Alerta {
  codigo_item: number
  codigo_interno: string
  nombre: string
  stock_actual: number
  stock_minimo: number
  stock_maximo: number | null
  unidad_medida: string
  tipo_alerta: string
  mensaje: string
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  codigo_lote?: number
  numero_lote?: string
  fecha_vencimiento?: string
  dias_hasta_vencimiento?: number
}

interface Estadisticas {
  total: number
  criticas: number
  altas: number
  medias: number
  bajas: number
  por_tipo: {
    stock_critico: number
    stock_bajo: number
    vencidos: number
    proximos_vencer: number
  }
}

interface Message {
  type: 'success' | 'error'
  text: string
}

const TIPO_MOVIMIENTO_OPTIONS = [
  { value: 'ENTRADA', label: 'Entrada', color: 'bg-lab-success-100 text-lab-success-800', icon: '↑' },
  { value: 'SALIDA', label: 'Salida', color: 'bg-lab-danger-100 text-lab-danger-800', icon: '↓' },
  { value: 'AJUSTE_POSITIVO', label: 'Ajuste +', color: 'bg-lab-primary-100 text-lab-primary-800', icon: '+' },
  { value: 'AJUSTE_NEGATIVO', label: 'Ajuste -', color: 'bg-lab-warning-100 text-lab-warning-800', icon: '-' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', color: 'bg-lab-neutral-100 text-lab-neutral-800', icon: '↔' },
]

const TIPO_ALERTA_CONFIG = {
  STOCK_CRITICO: { label: 'Sin Stock', color: 'bg-lab-danger-100 text-lab-danger-800' },
  STOCK_BAJO: { label: 'Stock Bajo', color: 'bg-lab-warning-100 text-lab-warning-800' },
  VENCIDO: { label: 'Vencido', color: 'bg-lab-danger-100 text-lab-danger-800' },
  PROXIMO_VENCER: { label: 'Por Vencer', color: 'bg-lab-warning-100 text-lab-warning-800' },
}

const PRIORIDAD_CONFIG = {
  CRITICA: { label: 'Crítica', color: 'bg-lab-danger-600 text-white' },
  ALTA: { label: 'Alta', color: 'bg-lab-warning-600 text-white' },
  MEDIA: { label: 'Media', color: 'bg-lab-primary-500 text-white' },
  BAJA: { label: 'Baja', color: 'bg-lab-neutral-400 text-white' },
}

type Tab = 'items' | 'movimientos' | 'alertas'

export default function InventarioPage() {
  const { accessToken } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [mounted, setMounted] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  // Items state
  const [items, setItems] = useState<ItemInventario[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemInventario | null>(null)
  const [itemFormData, setItemFormData] = useState({
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

  // Movements state
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [movimientosLoading, setMovimientosLoading] = useState(false)
  const [showMovForm, setShowMovForm] = useState(false)
  const [filterMovItem, setFilterMovItem] = useState('')
  const [filterMovTipo, setFilterMovTipo] = useState('')
  const [filterMovFechaDesde, setFilterMovFechaDesde] = useState('')
  const [filterMovFechaHasta, setFilterMovFechaHasta] = useState('')
  const [movFormData, setMovFormData] = useState({
    codigo_item: '',
    tipo_movimiento: '',
    cantidad: '',
    motivo: '',
  })

  // Alerts state
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [alertasLoading, setAlertasLoading] = useState(false)
  const [filterAlertTipo, setFilterAlertTipo] = useState('')
  const [filterAlertPrioridad, setFilterAlertPrioridad] = useState('')

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

  // Load items when switching to items tab or movements tab (needed for dropdown)
  useEffect(() => {
    if (activeTab === 'items' || activeTab === 'movimientos') {
      loadItems()
    }
  }, [activeTab])

  // Load movements when switching to movements tab
  useEffect(() => {
    if (activeTab === 'movimientos') {
      loadMovimientos()
    }
  }, [activeTab])

  // Load alerts when switching to alerts tab
  useEffect(() => {
    if (activeTab === 'alertas') {
      loadAlertas()
      loadEstadisticas()
    }
  }, [activeTab])

  // ==================== ITEMS FUNCTIONS ====================
  const loadItems = async () => {
    try {
      setItemsLoading(true)
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
      setItemsLoading(false)
    }
  }

  const handleOpenItemForm = (item?: ItemInventario) => {
    if (item) {
      setEditingItem(item)
      setItemFormData({
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
      setItemFormData({
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
    setShowItemForm(true)
  }

  const handleCloseItemForm = () => {
    setShowItemForm(false)
    setEditingItem(null)
    setItemFormData({
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

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setItemFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const stockActual = parseInt(itemFormData.stock_actual)
    const stockMinimo = parseInt(itemFormData.stock_minimo)
    const stockMaximo = itemFormData.stock_maximo ? parseInt(itemFormData.stock_maximo) : undefined
    const costoUnitario = itemFormData.costo_unitario ? parseFloat(itemFormData.costo_unitario) : undefined
    const precioVenta = itemFormData.precio_venta ? parseFloat(itemFormData.precio_venta) : undefined

    const stockValidation = validateStockRanges(stockActual, stockMinimo, stockMaximo)
    if (!stockValidation.valid) {
      setMessage({
        type: 'error',
        text: `Error de validación: ${stockValidation.errors.join(', ')}`
      })
      return
    }

    if (costoUnitario !== undefined && precioVenta !== undefined) {
      if (!validatePriceRelation(precioVenta, costoUnitario)) {
        setMessage({
          type: 'error',
          text: `El precio de venta ($${precioVenta.toFixed(2)}) debe ser mayor o igual al costo unitario ($${costoUnitario.toFixed(2)})`
        })
        return
      }
    }

    if (!itemFormData.codigo_interno.trim()) {
      setMessage({ type: 'error', text: 'El código interno es requerido' })
      return
    }

    try {
      const url = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items/${editingItem.codigo_item}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items`

      const payload: any = {
        codigo_interno: itemFormData.codigo_interno.trim(),
        nombre: itemFormData.nombre.trim(),
        descripcion: itemFormData.descripcion?.trim() || null,
        unidad_medida: itemFormData.unidad_medida,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        activo: itemFormData.activo,
      }

      if (stockMaximo !== undefined) {
        payload.stock_maximo = stockMaximo
      }

      if (costoUnitario !== undefined) {
        payload.costo_unitario = costoUnitario
      }

      if (precioVenta !== undefined) {
        payload.precio_venta = precioVenta
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
          text: editingItem ? 'Item actualizado correctamente' : 'Item creado correctamente',
        })
        handleCloseItemForm()
        loadItems()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al guardar item' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleDeleteItem = async (codigo_item: number) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este item?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/items/${codigo_item}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok || response.status === 204) {
        setMessage({ type: 'success', text: 'Item desactivado correctamente' })
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

    // Solo mostrar items activos
    return matchSearch && item.activo
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

  // ==================== MOVEMENTS FUNCTIONS ====================
  const loadMovimientos = async () => {
    try {
      setMovimientosLoading(true)

      const params = new URLSearchParams()
      if (filterMovItem) params.append('codigo_item', filterMovItem)
      if (filterMovTipo) params.append('tipo_movimiento', filterMovTipo)
      if (filterMovFechaDesde) params.append('fecha_desde', filterMovFechaDesde)
      if (filterMovFechaHasta) params.append('fecha_hasta', filterMovFechaHasta)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/movements?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const result = await response.json()
        const movimientos = result.data || result
        setMovimientos(movimientos)
      } else {
        setMessage({ type: 'error', text: 'Error al cargar movimientos' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    } finally {
      setMovimientosLoading(false)
    }
  }

  const handleMovSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!movFormData.codigo_item) {
      setMessage({ type: 'error', text: 'Debe seleccionar un item' })
      return
    }

    if (!movFormData.tipo_movimiento) {
      setMessage({ type: 'error', text: 'Debe seleccionar el tipo de movimiento' })
      return
    }

    const cantidad = parseInt(movFormData.cantidad)
    if (isNaN(cantidad) || cantidad <= 0) {
      setMessage({ type: 'error', text: 'La cantidad debe ser un número positivo' })
      return
    }

    try {
      const payload = {
        codigo_item: parseInt(movFormData.codigo_item),
        tipo_movimiento: movFormData.tipo_movimiento,
        cantidad,
        motivo: movFormData.motivo.trim() || null,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Movimiento registrado correctamente' })
        handleCloseMovForm()
        loadMovimientos()
        loadItems()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al registrar movimiento' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleCloseMovForm = () => {
    setShowMovForm(false)
    setMovFormData({
      codigo_item: '',
      tipo_movimiento: '',
      cantidad: '',
      motivo: '',
    })
  }

  const getTipoMovimientoStyle = (tipo: string) => {
    const option = TIPO_MOVIMIENTO_OPTIONS.find(opt => opt.value === tipo)
    return option || TIPO_MOVIMIENTO_OPTIONS[0]
  }

  const handleApplyMovFilters = () => {
    loadMovimientos()
  }

  const handleClearMovFilters = () => {
    setFilterMovItem('')
    setFilterMovTipo('')
    setFilterMovFechaDesde('')
    setFilterMovFechaHasta('')
    setTimeout(() => loadMovimientos(), 100)
  }

  // ==================== ALERTS FUNCTIONS ====================
  const loadAlertas = async () => {
    try {
      setAlertasLoading(true)

      const params = new URLSearchParams()
      if (filterAlertTipo) params.append('tipo', filterAlertTipo)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/alertas?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAlertas(data)
      } else {
        setMessage({ type: 'error', text: 'Error al cargar alertas' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    } finally {
      setAlertasLoading(false)
    }
  }

  const loadEstadisticas = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/alertas/estadisticas`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleApplyAlertFilters = () => {
    loadAlertas()
  }

  const handleClearAlertFilters = () => {
    setFilterAlertTipo('')
    setFilterAlertPrioridad('')
    setTimeout(() => loadAlertas(), 100)
  }

  const filteredAlertas = alertas.filter((alerta) => {
    if (filterAlertPrioridad && alerta.prioridad !== filterAlertPrioridad) return false
    return true
  })

  // ==================== RENDER ====================
  if (!mounted) {
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
            Administra el stock, movimientos y alertas del laboratorio
          </p>
        </div>
        {activeTab === 'items' && (
          <Button onClick={() => handleOpenItemForm()} className="bg-lab-primary-600 hover:bg-lab-primary-700">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Item
          </Button>
        )}
        {activeTab === 'movimientos' && (
          <Button onClick={() => setShowMovForm(true)} className="bg-lab-primary-600 hover:bg-lab-primary-700">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Movimiento
          </Button>
        )}
        {activeTab === 'alertas' && (
          <Button onClick={loadAlertas} className="bg-lab-primary-600 hover:bg-lab-primary-700">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-lab-neutral-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'items'
                ? 'border-lab-primary-600 text-lab-primary-600'
                : 'border-transparent text-lab-neutral-500 hover:text-lab-neutral-700 hover:border-lab-neutral-300'
            }`}
          >
            Items de Inventario
          </button>
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'movimientos'
                ? 'border-lab-primary-600 text-lab-primary-600'
                : 'border-transparent text-lab-neutral-500 hover:text-lab-neutral-700 hover:border-lab-neutral-300'
            }`}
          >
            Movimientos de Stock
          </button>
          <button
            onClick={() => setActiveTab('alertas')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'alertas'
                ? 'border-lab-primary-600 text-lab-primary-600'
                : 'border-transparent text-lab-neutral-500 hover:text-lab-neutral-700 hover:border-lab-neutral-300'
            }`}
          >
            Alertas de Stock
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' && (
        <>
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

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Items de Inventario ({filteredItems.length})</CardTitle>
              <CardDescription>Control de stock de reactivos e insumos</CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
                </div>
              ) : (
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
                                onClick={() => handleOpenItemForm(item)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteItem(item.codigo_item)}
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
              )}
            </CardContent>
          </Card>

          {/* Item Form Modal */}
          {showItemForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
                <div className="p-6 border-b border-lab-neutral-200">
                  <h2 className="text-2xl font-bold text-lab-neutral-900">
                    {editingItem ? 'Editar Item de Inventario' : 'Nuevo Item de Inventario'}
                  </h2>
                </div>

                <form onSubmit={handleItemSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="codigo_interno" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                        Código Interno *
                      </label>
                      <input
                        type="text"
                        id="codigo_interno"
                        name="codigo_interno"
                        value={itemFormData.codigo_interno}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.nombre}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.descripcion}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.unidad_medida}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.stock_actual}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.stock_minimo}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.stock_maximo}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.costo_unitario}
                        onChange={handleItemInputChange}
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
                        value={itemFormData.precio_venta}
                        onChange={handleItemInputChange}
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
                        checked={itemFormData.activo}
                        onChange={handleItemInputChange}
                        className="h-4 w-4 text-lab-primary-600 focus:ring-lab-primary-500 border-lab-neutral-300 rounded"
                      />
                      <label htmlFor="activo" className="ml-2 block text-sm text-lab-neutral-700">
                        Item activo
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-lab-neutral-200">
                    <Button type="button" onClick={handleCloseItemForm} variant="outline">
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
        </>
      )}

      {activeTab === 'movimientos' && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Item
                  </label>
                  <select
                    value={filterMovItem}
                    onChange={(e) => setFilterMovItem(e.target.value)}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                  >
                    <option value="">Todos los items</option>
                    {items.map((item) => (
                      <option key={item.codigo_item} value={item.codigo_item}>
                        {item.codigo_interno} - {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filterMovTipo}
                    onChange={(e) => setFilterMovTipo(e.target.value)}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                  >
                    <option value="">Todos los tipos</option>
                    {TIPO_MOVIMIENTO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Desde
                  </label>
                  <Input
                    type="date"
                    value={filterMovFechaDesde}
                    onChange={(e) => setFilterMovFechaDesde(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Hasta
                  </label>
                  <Input
                    type="date"
                    value={filterMovFechaHasta}
                    onChange={(e) => setFilterMovFechaHasta(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <Button onClick={handleApplyMovFilters} className="bg-lab-primary-600 hover:bg-lab-primary-700">
                  Aplicar Filtros
                </Button>
                <Button onClick={handleClearMovFilters} variant="outline">
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Movimientos Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos ({movimientos.length})</CardTitle>
              <CardDescription>Registro completo de operaciones de stock</CardDescription>
            </CardHeader>
            <CardContent>
              {movimientosLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-lab-neutral-200">
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Item</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Tipo</th>
                        <th className="text-center p-4 font-semibold text-lab-neutral-900">Cantidad</th>
                        <th className="text-center p-4 font-semibold text-lab-neutral-900">Stock Ant.</th>
                        <th className="text-center p-4 font-semibold text-lab-neutral-900">Stock Nuevo</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Motivo</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Realizado Por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((mov) => {
                        const tipoStyle = getTipoMovimientoStyle(mov.tipo_movimiento)
                        return (
                          <tr key={mov.codigo_movimiento} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                            <td className="p-4 text-sm text-lab-neutral-600">
                              {formatDateTime(mov.fecha_movimiento)}
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-lab-neutral-900">{mov.item.nombre}</div>
                              <div className="text-xs text-lab-neutral-600">{mov.item.codigo_interno}</div>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded ${tipoStyle.color} font-medium`}>
                                {tipoStyle.label}
                              </span>
                            </td>
                            <td className="p-4 text-center font-semibold text-lab-neutral-900">
                              {mov.cantidad} {mov.item.unidad_medida}
                            </td>
                            <td className="p-4 text-center text-lab-neutral-600">
                              {mov.stock_anterior}
                            </td>
                            <td className="p-4 text-center font-semibold text-lab-neutral-900">
                              {mov.stock_nuevo}
                            </td>
                            <td className="p-4 text-sm text-lab-neutral-600">
                              {mov.motivo || '-'}
                            </td>
                            <td className="p-4 text-sm text-lab-neutral-600">
                              {mov.usuario ? `${mov.usuario.nombres} ${mov.usuario.apellidos}` : 'Sistema'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {movimientos.length === 0 && (
                    <div className="text-center py-12 text-lab-neutral-500">
                      No se encontraron movimientos
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movement Form Modal */}
          {showMovForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="p-6 border-b border-lab-neutral-200">
                  <h2 className="text-2xl font-bold text-lab-neutral-900">
                    Registrar Movimiento de Stock
                  </h2>
                </div>

                <form onSubmit={handleMovSubmit} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="mov_codigo_item" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                        Item *
                      </label>
                      <select
                        id="mov_codigo_item"
                        value={movFormData.codigo_item}
                        onChange={(e) => setMovFormData({ ...movFormData, codigo_item: e.target.value })}
                        required
                        className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                      >
                        <option value="">Seleccionar item...</option>
                        {items.map((item) => (
                          <option key={item.codigo_item} value={item.codigo_item}>
                            {item.codigo_interno} - {item.nombre} (Stock: {item.stock_actual} {item.unidad_medida})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="mov_tipo_movimiento" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                        Tipo de Movimiento *
                      </label>
                      <select
                        id="mov_tipo_movimiento"
                        value={movFormData.tipo_movimiento}
                        onChange={(e) => setMovFormData({ ...movFormData, tipo_movimiento: e.target.value })}
                        required
                        className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                      >
                        <option value="">Seleccionar tipo...</option>
                        {TIPO_MOVIMIENTO_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="mov_cantidad" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        id="mov_cantidad"
                        value={movFormData.cantidad}
                        onChange={(e) => setMovFormData({ ...movFormData, cantidad: e.target.value })}
                        min="1"
                        required
                        className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label htmlFor="mov_motivo" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                        Motivo / Observaciones
                      </label>
                      <textarea
                        id="mov_motivo"
                        value={movFormData.motivo}
                        onChange={(e) => setMovFormData({ ...movFormData, motivo: e.target.value })}
                        rows={3}
                        placeholder="Ej: Compra factura #123, Uso en examen, Merma por vencimiento..."
                        className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-lab-neutral-200">
                    <Button type="button" onClick={handleCloseMovForm} variant="outline">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-lab-primary-600 hover:bg-lab-primary-700">
                      Registrar Movimiento
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'alertas' && (
        <>
          {/* Estadísticas */}
          {estadisticas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-neutral-600">Total Alertas</div>
                    <div className="text-3xl font-bold text-lab-neutral-900 mt-2">{estadisticas.total}</div>
                  </CardContent>
                </Card>
                <Card className="border-lab-danger-200 bg-lab-danger-50">
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-danger-700 font-medium">Críticas</div>
                    <div className="text-3xl font-bold text-lab-danger-800 mt-2">{estadisticas.criticas}</div>
                  </CardContent>
                </Card>
                <Card className="border-lab-warning-200 bg-lab-warning-50">
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-warning-700 font-medium">Altas</div>
                    <div className="text-3xl font-bold text-lab-warning-800 mt-2">{estadisticas.altas}</div>
                  </CardContent>
                </Card>
                <Card className="border-lab-primary-200 bg-lab-primary-50">
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-primary-700 font-medium">Medias</div>
                    <div className="text-3xl font-bold text-lab-primary-800 mt-2">{estadisticas.medias}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-neutral-600">Bajas</div>
                    <div className="text-3xl font-bold text-lab-neutral-700 mt-2">{estadisticas.bajas}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-neutral-600">Sin Stock</div>
                    <div className="text-2xl font-bold text-lab-danger-600 mt-2">
                      {estadisticas.por_tipo.stock_critico}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-neutral-600">Stock Bajo</div>
                    <div className="text-2xl font-bold text-lab-warning-600 mt-2">
                      {estadisticas.por_tipo.stock_bajo}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-neutral-600">Vencidos</div>
                    <div className="text-2xl font-bold text-lab-danger-600 mt-2">
                      {estadisticas.por_tipo.vencidos}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-lab-neutral-600">Por Vencer</div>
                    <div className="text-2xl font-bold text-lab-warning-600 mt-2">
                      {estadisticas.por_tipo.proximos_vencer}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Tipo de Alerta
                  </label>
                  <select
                    value={filterAlertTipo}
                    onChange={(e) => setFilterAlertTipo(e.target.value)}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="STOCK_CRITICO">Sin Stock</option>
                    <option value="STOCK_BAJO">Stock Bajo</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="PROXIMO_VENCER">Por Vencer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={filterAlertPrioridad}
                    onChange={(e) => setFilterAlertPrioridad(e.target.value)}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                  >
                    <option value="">Todas las prioridades</option>
                    <option value="CRITICA">Crítica</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex space-x-3">
                    <Button onClick={handleApplyAlertFilters} className="bg-lab-primary-600 hover:bg-lab-primary-700">
                      Aplicar
                    </Button>
                    <Button onClick={handleClearAlertFilters} variant="outline">
                      Limpiar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Activas ({filteredAlertas.length})</CardTitle>
              <CardDescription>Productos que requieren atención inmediata</CardDescription>
            </CardHeader>
            <CardContent>
              {alertasLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-lab-neutral-200">
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Prioridad</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Tipo</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Producto</th>
                        <th className="text-center p-4 font-semibold text-lab-neutral-900">Stock</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Mensaje</th>
                        <th className="text-left p-4 font-semibold text-lab-neutral-900">Lote</th>
                        <th className="text-center p-4 font-semibold text-lab-neutral-900">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlertas.map((alerta, index) => {
                        const prioridadStyle = PRIORIDAD_CONFIG[alerta.prioridad]
                        const tipoStyle = TIPO_ALERTA_CONFIG[alerta.tipo_alerta]

                        return (
                          <tr key={index} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                            <td className="p-4">
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${prioridadStyle.color}`}>
                                {prioridadStyle.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded ${tipoStyle.color}`}>
                                {tipoStyle.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-lab-neutral-900">{alerta.nombre}</div>
                              <div className="text-xs text-lab-neutral-600">{alerta.codigo_interno}</div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="font-semibold text-lab-neutral-900">
                                {alerta.stock_actual} {alerta.unidad_medida}
                              </div>
                              <div className="text-xs text-lab-neutral-600">
                                Min: {alerta.stock_minimo}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-lab-neutral-700">
                              {alerta.mensaje}
                            </td>
                            <td className="p-4 text-sm text-lab-neutral-600">
                              {alerta.numero_lote || '-'}
                            </td>
                            <td className="p-4 text-center text-sm">
                              {alerta.fecha_vencimiento ? (
                                <div>
                                  <div className="text-lab-neutral-900">
                                    {formatDate(alerta.fecha_vencimiento)}
                                  </div>
                                  {alerta.dias_hasta_vencimiento !== undefined && (
                                    <div className={`text-xs ${
                                      alerta.dias_hasta_vencimiento < 0
                                        ? 'text-lab-danger-600 font-semibold'
                                        : alerta.dias_hasta_vencimiento <= 7
                                        ? 'text-lab-warning-600 font-semibold'
                                        : 'text-lab-neutral-600'
                                    }`}>
                                      {alerta.dias_hasta_vencimiento < 0
                                        ? `Vencido hace ${Math.abs(alerta.dias_hasta_vencimiento)} días`
                                        : `${alerta.dias_hasta_vencimiento} días`
                                      }
                                    </div>
                                  )}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {filteredAlertas.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-xl font-semibold text-lab-success-600 mb-2">
                        No hay alertas activas
                      </div>
                      <div className="text-lab-neutral-600">
                        Todo el inventario está en niveles óptimos
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
