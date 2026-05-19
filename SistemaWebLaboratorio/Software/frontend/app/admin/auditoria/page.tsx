'use client'

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface AuditUser {
  nombres: string
  apellidos: string
  email: string
}

interface LogActividad {
  codigo_log: number
  codigo_usuario: number | null
  accion: string
  accion_legible?: string
  entidad: string | null
  entidad_legible?: string
  codigo_entidad: number | null
  descripcion: string | null
  resumen?: string
  detalle?: unknown
  evento?: string | null
  criticidad?: string
  usuario_nombre?: string
  ip_address: string | null
  user_agent?: string | null
  fecha_accion: string
  usuario: AuditUser | null
}

interface LogError {
  codigo_log_error: number
  codigo_usuario: number | null
  nivel: string
  mensaje: string
  resumen?: string
  origen?: string
  criticidad?: string
  stack_trace: string | null
  endpoint: string | null
  metodo: string | null
  ip_address: string | null
  user_agent?: string | null
  fecha_error: string
  usuario: AuditUser | null
  usuario_nombre?: string
}

type Tab = 'actividad' | 'errores'

const itemsPerPage = 20

export default function AuditoriaPage() {
  const { accessToken } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('actividad')
  const [logs, setLogs] = useState<LogActividad[]>([])
  const [errorLogs, setErrorLogs] = useState<LogError[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [entidadFilter, setEntidadFilter] = useState('TODAS')
  const [limit, setLimit] = useState(100)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedLog, setExpandedLog] = useState<number | null>(null)
  const [expandedError, setExpandedError] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const loadLogs = useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: limit.toString() })
      const [activityResponse, errorResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit/activity-logs?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit/error-logs?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      if (activityResponse.ok) {
        const result = await activityResponse.json()
        setLogs(result.data || result)
      }

      if (errorResponse.ok) {
        const result = await errorResponse.json()
        setErrorLogs(result.data || result)
      }
    } catch {
      setMessage({ type: 'error', text: 'No se pudo cargar la auditoria del sistema' })
    } finally {
      setLoading(false)
    }
  }, [accessToken, limit])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [message])

  const entidades = useMemo(
    () => Array.from(new Set(logs.map((log) => log.entidad).filter(Boolean))),
    [logs],
  )

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const search = searchTerm.trim().toLowerCase()
      const matchSearch =
        !search ||
        log.accion.toLowerCase().includes(search) ||
        log.accion_legible?.toLowerCase().includes(search) ||
        log.entidad?.toLowerCase().includes(search) ||
        log.entidad_legible?.toLowerCase().includes(search) ||
        log.resumen?.toLowerCase().includes(search) ||
        log.usuario_nombre?.toLowerCase().includes(search) ||
        log.usuario?.email.toLowerCase().includes(search)

      const matchEntidad = entidadFilter === 'TODAS' || log.entidad === entidadFilter
      const logDate = new Date(log.fecha_accion)
      const matchFechaDesde = !fechaDesde || logDate >= new Date(fechaDesde)
      const matchFechaHasta = !fechaHasta || logDate <= new Date(`${fechaHasta}T23:59:59`)

      return matchSearch && matchEntidad && matchFechaDesde && matchFechaHasta
    })
  }, [entidadFilter, fechaDesde, fechaHasta, logs, searchTerm])

  const filteredErrorLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return errorLogs.filter((log) => {
      const matchSearch =
        !search ||
        log.nivel.toLowerCase().includes(search) ||
        log.mensaje.toLowerCase().includes(search) ||
        log.resumen?.toLowerCase().includes(search) ||
        log.origen?.toLowerCase().includes(search) ||
        log.usuario_nombre?.toLowerCase().includes(search)

      const logDate = new Date(log.fecha_error)
      const matchFechaDesde = !fechaDesde || logDate >= new Date(fechaDesde)
      const matchFechaHasta = !fechaHasta || logDate <= new Date(`${fechaHasta}T23:59:59`)

      return matchSearch && matchFechaDesde && matchFechaHasta
    })
  }, [errorLogs, fechaDesde, fechaHasta, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, entidadFilter, fechaDesde, fechaHasta, activeTab])

  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage))
  const actionStats = getActionStats(logs)

  const handleGeneratePdf = async () => {
    if (!accessToken) return

    setGeneratingPdf(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fecha_desde', fechaDesde)
      if (fechaHasta) params.append('fecha_hasta', fechaHasta)
      if (entidadFilter !== 'TODAS') params.append('entidad', entidadFilter)
      if (searchTerm) params.append('search', searchTerm)
      params.append('limit', limit.toString())

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit/activity-logs/pdf?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Error al generar el PDF de auditoria' })
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-auditoria-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setMessage({ type: 'success', text: 'Reporte de auditoria generado' })
    } catch {
      setMessage({ type: 'error', text: 'Error de conexion al servidor' })
    } finally {
      setGeneratingPdf(false)
    }
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
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm shadow-lg ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Auditoria del Sistema</h1>
          <p className="text-lab-neutral-600 mt-2">
            Trazabilidad de actividades administrativas, errores y contexto tecnico.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="h-10 rounded-md border border-lab-neutral-300 px-4 text-sm font-medium hover:bg-lab-neutral-50"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Eventos auditados" value={logs.length} tone="neutral" />
        <MetricCard label="Cambios criticos" value={actionStats.critical} tone="danger" />
        <MetricCard label="Errores registrados" value={errorLogs.length} tone="warning" />
        <MetricCard label="Actores unicos" value={new Set(logs.map((log) => log.codigo_usuario).filter(Boolean)).size} tone="info" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2 xl:col-span-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Usuario, accion, entidad, resumen..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Entidad</Label>
              <select
                value={entidadFilter}
                onChange={(event) => setEntidadFilter(event.target.value)}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="TODAS">Todas</option>
                {entidades.map((entidad) => (
                  <option key={entidad} value={entidad!}>
                    {getEntityLabel(logs, entidad!)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Registros</Label>
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleGeneratePdf}
              disabled={generatingPdf || activeTab !== 'actividad'}
              className="h-10 rounded-md bg-lab-danger-600 px-4 text-sm font-medium text-white hover:bg-lab-danger-700 disabled:opacity-50"
            >
              {generatingPdf ? 'Generando PDF...' : 'Generar PDF de actividad'}
            </button>
            <button
              onClick={() => {
                setSearchTerm('')
                setEntidadFilter('TODAS')
                setFechaDesde('')
                setFechaHasta('')
              }}
              className="h-10 rounded-md border border-lab-neutral-300 px-4 text-sm font-medium hover:bg-lab-neutral-50"
            >
              Limpiar filtros
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="border-b border-lab-neutral-200">
        <div className="flex gap-2">
          <TabButton active={activeTab === 'actividad'} onClick={() => setActiveTab('actividad')}>
            Actividad ({filteredLogs.length})
          </TabButton>
          <TabButton active={activeTab === 'errores'} onClick={() => setActiveTab('errores')}>
            Errores ({filteredErrorLogs.length})
          </TabButton>
        </div>
      </div>

      {activeTab === 'actividad' ? (
        <Card>
          <CardHeader>
            <CardTitle>Registro de Actividades</CardTitle>
            <CardDescription>Quien hizo que, sobre que registro, desde donde y con que detalle.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-lab-neutral-200">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Accion</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Resumen</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead></TableHead>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => (
                    <Fragment key={log.codigo_log}>
                      <tr className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                        <td className="p-4 text-sm text-lab-neutral-700">
                          <div>{formatDate(new Date(log.fecha_accion))}</div>
                          <div className="text-xs text-lab-neutral-500">
                            {new Date(log.fecha_accion).toLocaleTimeString('es-EC')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-lab-neutral-900 text-sm">{log.usuario_nombre || 'Sistema'}</div>
                          <div className="text-xs text-lab-neutral-600">{log.usuario?.email || 'Evento interno'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getAccionBadge(log)}`}>
                            {log.accion_legible || log.accion}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="font-medium text-lab-neutral-800">{log.entidad_legible || log.entidad || '-'}</div>
                          <div className="text-xs text-lab-neutral-500">ID: {log.codigo_entidad || '-'}</div>
                        </td>
                        <td className="p-4 text-sm text-lab-neutral-700 max-w-md">
                          <div className="line-clamp-2">{log.resumen || log.descripcion || 'Sin resumen'}</div>
                        </td>
                        <td className="p-4 text-sm text-lab-neutral-600">{log.ip_address || '-'}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.codigo_log ? null : log.codigo_log)}
                            className="rounded-md border border-lab-neutral-300 px-3 py-1 text-xs font-medium hover:bg-lab-neutral-50"
                          >
                            {expandedLog === log.codigo_log ? 'Ocultar' : 'Detalle'}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log.codigo_log && (
                        <tr className="border-b border-lab-neutral-100 bg-lab-neutral-50">
                          <td colSpan={7} className="p-4">
                            <AuditDetail log={log} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">No se encontraron registros de actividad</div>
            )}

            {filteredLogs.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Errores del Sistema</CardTitle>
            <CardDescription>Salida tecnica resumida para diagnostico y seguimiento.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredErrorLogs.map((log) => (
                <div key={log.codigo_log_error} className="rounded-xl border border-lab-neutral-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getErrorBadge(log.nivel)}`}>
                          {log.nivel}
                        </span>
                        <span className="text-sm font-medium text-lab-neutral-900">{log.origen || 'Sistema'}</span>
                      </div>
                      <p className="text-sm text-lab-neutral-700">{log.resumen || log.mensaje}</p>
                      <p className="text-xs text-lab-neutral-500">
                        {formatDate(new Date(log.fecha_error))} {new Date(log.fecha_error).toLocaleTimeString('es-EC')}
                        {' | '}
                        {log.usuario_nombre || 'Sistema'}
                        {' | IP: '}
                        {log.ip_address || '-'}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedError(expandedError === log.codigo_log_error ? null : log.codigo_log_error)}
                      className="rounded-md border border-lab-neutral-300 px-3 py-1 text-xs font-medium hover:bg-lab-neutral-50"
                    >
                      {expandedError === log.codigo_log_error ? 'Ocultar' : 'Ver stack'}
                    </button>
                  </div>
                  {expandedError === log.codigo_log_error && (
                    <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-lab-neutral-900 p-4 text-xs text-white">
                      {log.stack_trace || log.mensaje}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {filteredErrorLogs.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">No se encontraron errores registrados</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'danger' | 'warning' | 'info' }) {
  const colors = {
    neutral: 'text-lab-neutral-900',
    danger: 'text-lab-danger-600',
    warning: 'text-lab-warning-700',
    info: 'text-lab-info-600',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-lab-neutral-600">{label}</div>
        <div className={`text-2xl font-bold mt-2 ${colors[tone]}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-3 text-sm font-medium ${
        active
          ? 'border-lab-primary-600 text-lab-primary-700'
          : 'border-transparent text-lab-neutral-600 hover:text-lab-neutral-900'
      }`}
    >
      {children}
    </button>
  )
}

function TableHead({ children }: { children?: ReactNode }) {
  return <th className="text-left p-4 font-semibold text-lab-neutral-900">{children}</th>
}

function AuditDetail({ log }: { log: LogActividad }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
      <DetailBlock title="Detalle interpretado" value={formatDetail(log.detalle)} />
      <DetailBlock title="Contexto tecnico" value={`Evento: ${log.evento || '-'} | IP: ${log.ip_address || '-'} | Navegador: ${log.user_agent || '-'}`} />
      <DetailBlock title="Registro original" value={`Accion: ${log.accion} | Entidad: ${log.entidad || '-'} | ID: ${log.codigo_entidad || '-'}`} />
    </div>
  )
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-lab-neutral-200 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-lab-neutral-500">{title}</div>
      <div className="mt-2 break-words text-lab-neutral-800">{value}</div>
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const safeSetPage = (page: number) => onPageChange(Math.max(1, Math.min(page, totalPages)))

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-lab-neutral-200">
      <div className="text-sm text-lab-neutral-600">
        Pagina {currentPage} de {totalPages} | {totalItems} registros
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => safeSetPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-md border border-lab-neutral-300 px-3 py-1 text-sm disabled:opacity-50">
          Anterior
        </button>
        <button onClick={() => safeSetPage(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-md border border-lab-neutral-300 px-3 py-1 text-sm disabled:opacity-50">
          Siguiente
        </button>
      </div>
    </div>
  )
}

function getActionStats(logs: LogActividad[]) {
  return logs.reduce(
    (acc, log) => {
      const category = getActionCategory(log)
      if (category === 'deleted') acc.critical += 1
      return acc
    },
    { critical: 0 },
  )
}

function getActionCategory(log: LogActividad) {
  const value = `${log.accion} ${log.accion_legible || ''}`.toLowerCase()
  if (value.includes('elim') || value.includes('deleted')) return 'deleted'
  if (value.includes('cre') || value.includes('created')) return 'created'
  if (value.includes('actual') || value.includes('updated')) return 'updated'
  if (value.includes('fall') || value.includes('error')) return 'error'
  return 'other'
}

function getAccionBadge(log: LogActividad) {
  const category = getActionCategory(log)
  if (category === 'created') return 'bg-lab-success-100 text-lab-success-800'
  if (category === 'updated') return 'bg-lab-info-100 text-lab-info-800'
  if (category === 'deleted' || category === 'error') return 'bg-lab-danger-100 text-lab-danger-800'
  return 'bg-lab-neutral-100 text-lab-neutral-800'
}

function getErrorBadge(nivel: string) {
  const value = nivel.toUpperCase()
  if (value === 'CRITICAL' || value === 'ERROR') return 'bg-lab-danger-100 text-lab-danger-800'
  if (value === 'WARNING') return 'bg-lab-warning-100 text-lab-warning-800'
  return 'bg-lab-info-100 text-lab-info-800'
}

function getEntityLabel(logs: LogActividad[], entidad: string) {
  return logs.find((log) => log.entidad === entidad)?.entidad_legible || entidad
}

function formatDetail(detail: unknown): string {
  if (!detail) return 'Sin detalle adicional'
  if (typeof detail === 'string') return detail
  if (typeof detail !== 'object') return String(detail)

  const entries = Object.entries(detail as Record<string, unknown>).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  )

  if (entries.length === 0) return 'Sin detalle adicional'

  return entries
    .slice(0, 12)
    .map(([key, value]) => `${humanizeKey(key)}: ${formatValue(value)}`)
    .join(' | ')
}

function humanizeKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value: unknown): string {
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
