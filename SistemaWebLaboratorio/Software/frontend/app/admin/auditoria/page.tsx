'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface LogActividad {
  codigo_log: number
  codigo_usuario: number | null
  accion: string
  entidad: string | null
  codigo_entidad: number | null
  descripcion: string | null
  ip_address: string | null
  fecha_accion: string
  usuario: {
    nombres: string
    apellidos: string
    email: string
  } | null
}

export default function AuditoriaPage() {
  const { accessToken } = useAuthStore()
  const [logs, setLogs] = useState<LogActividad[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [entidadFilter, setEntidadFilter] = useState('TODAS')
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    loadLogs()
  }, [limit])

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams()
      params.append('limit', limit.toString())

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit/activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        // Backend returns paginated data: { data: [], pagination: {} }
        const logs = result.data || result
        setLogs(logs)
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      searchTerm === '' ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario?.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario?.apellidos.toLowerCase().includes(searchTerm.toLowerCase())

    const matchEntidad = entidadFilter === 'TODAS' || log.entidad === entidadFilter

    return matchSearch && matchEntidad
  })

  const entidades = Array.from(new Set(logs.map((log) => log.entidad).filter(Boolean)))

  const getAccionBadge = (accion: string) => {
    if (accion.includes('create') || accion.includes('created')) {
      return 'bg-lab-success-100 text-lab-success-800'
    }
    if (accion.includes('update') || accion.includes('updated')) {
      return 'bg-lab-info-100 text-lab-info-800'
    }
    if (accion.includes('delete') || accion.includes('deleted')) {
      return 'bg-lab-danger-100 text-lab-danger-800'
    }
    if (accion.includes('login')) {
      return 'bg-lab-primary-100 text-lab-primary-800'
    }
    return 'bg-lab-neutral-100 text-lab-neutral-800'
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
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Auditoría del Sistema</h1>
        <p className="text-lab-neutral-600 mt-2">
          Registro completo de todas las actividades realizadas en el sistema
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Acción, entidad, usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Entidad</Label>
              <select
                value={entidadFilter}
                onChange={(e) => setEntidadFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="TODAS">Todas</option>
                {entidades.map((entidad) => (
                  <option key={entidad} value={entidad!}>
                    {entidad}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Registros a Mostrar</Label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Total de Logs</div>
            <div className="text-2xl font-bold text-lab-neutral-900 mt-2">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Creaciones</div>
            <div className="text-2xl font-bold text-lab-success-600 mt-2">
              {logs.filter((log) => log.accion.includes('create') || log.accion.includes('created')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Actualizaciones</div>
            <div className="text-2xl font-bold text-lab-info-600 mt-2">
              {logs.filter((log) => log.accion.includes('update') || log.accion.includes('updated')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-lab-neutral-600">Eliminaciones</div>
            <div className="text-2xl font-bold text-lab-danger-600 mt-2">
              {logs.filter((log) => log.accion.includes('delete') || log.accion.includes('deleted')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividades ({filteredLogs.length})</CardTitle>
          <CardDescription>Trazabilidad completa del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Usuario</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Acción</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Entidad</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">ID</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.codigo_log} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                    <td className="p-4 text-sm text-lab-neutral-700">
                      <div>{formatDate(new Date(log.fecha_accion))}</div>
                      <div className="text-xs text-lab-neutral-500">
                        {new Date(log.fecha_accion).toLocaleTimeString('es-ES')}
                      </div>
                    </td>
                    <td className="p-4">
                      {log.usuario ? (
                        <div>
                          <div className="font-medium text-lab-neutral-900 text-sm">
                            {log.usuario.nombres} {log.usuario.apellidos}
                          </div>
                          <div className="text-xs text-lab-neutral-600">{log.usuario.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-lab-neutral-500">Sistema</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${getAccionBadge(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-700">{log.entidad || '-'}</td>
                    <td className="p-4 text-sm font-mono text-lab-neutral-600">{log.codigo_entidad || '-'}</td>
                    <td className="p-4 text-sm text-lab-neutral-600">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">No se encontraron registros</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
