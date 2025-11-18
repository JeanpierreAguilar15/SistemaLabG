'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

interface Muestra {
  codigo_muestra: number
  codigo_paciente: number
  codigo_examen: number
  fecha_registro: string
  estado: string
}

interface Resultado {
  codigo_resultado: number
  codigo_muestra: number
  codigo_examen: number
  fecha_resultado: string
  valor_obtenido: string
  valor_numerico: number | null
  nivel: string
  observaciones: string | null
  estado: string
  codigo_medico_validador?: number | null
  muestra?: {
    paciente: {
      nombres: string
      apellidos: string
      email: string
    }
  }
  paciente?: {
    nombres: string
    apellidos: string
    email: string
  }
  examen: {
    nombre: string
    codigo_interno: string
    valor_referencia_min?: number | null
    valor_referencia_max?: number | null
    unidad_medida?: string | null
  }
}

export default function ResultadosAdminPage() {
  const { accessToken } = useAuthStore()
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedResultado, setSelectedResultado] = useState<Resultado | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && accessToken) {
      loadResultados()
    }
  }, [mounted, accessToken])

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadResultados = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/admin/all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        // Handle both array and paginated response
        const resultados = result.data || result
        setResultados(resultados)
      }
    } catch (error) {
      console.error('Error loading resultados:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateResultado = async (codigo_resultado: number, data: Partial<Resultado>) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/${codigo_resultado}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Resultado actualizado exitosamente' })
        loadResultados()
        setShowEditModal(false)
        setSelectedResultado(null)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al actualizar resultado' })
      }
    } catch (error) {
      console.error('Error updating resultado:', error)
      setMessage({ type: 'error', text: 'Error al actualizar resultado' })
    }
  }

  const deleteResultado = async () => {
    if (!selectedResultado) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/${selectedResultado.codigo_resultado}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Resultado eliminado exitosamente' })
        loadResultados()
        setShowDeleteModal(false)
        setSelectedResultado(null)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al eliminar resultado' })
      }
    } catch (error) {
      console.error('Error deleting resultado:', error)
      setMessage({ type: 'error', text: 'Error al eliminar resultado' })
    }
  }

  const filteredResultados = resultados.filter((resultado) => {
    const paciente = resultado.muestra?.paciente || resultado.paciente
    if (!paciente) return false

    const matchSearch =
      searchTerm === '' ||
      paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resultado.examen.nombre.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'NORMAL':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'BAJO':
        return 'bg-lab-info-100 text-lab-info-800'
      case 'ALTO':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'CRITICO':
        return 'bg-lab-danger-100 text-lab-danger-800'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-600'
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Resultados</h1>
          <p className="text-lab-neutral-600 mt-2">
            Administra los resultados de exámenes de laboratorio
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por paciente o examen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Resultados Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados ({filteredResultados.length})</CardTitle>
          <CardDescription>Lista de resultados de laboratorio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Paciente</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Examen</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Valor</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Nivel</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredResultados.map((resultado) => {
                  const paciente = resultado.muestra?.paciente || resultado.paciente
                  if (!paciente) return null

                  return (
                    <tr
                      key={resultado.codigo_resultado}
                      className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50"
                    >
                      <td className="p-4 text-sm text-lab-neutral-700">
                        {formatDate(new Date(resultado.fecha_resultado))}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-lab-neutral-900">
                          {paciente.nombres} {paciente.apellidos}
                        </div>
                        <div className="text-sm text-lab-neutral-600">{paciente.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-lab-neutral-900">{resultado.examen.nombre}</div>
                        <div className="text-sm text-lab-neutral-600">{resultado.examen.codigo_interno}</div>
                      </td>
                      <td className="p-4 font-semibold text-lab-neutral-900">{resultado.valor_obtenido}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded ${getNivelBadge(resultado.nivel)}`}>
                          {resultado.nivel}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-lab-neutral-700">{resultado.estado}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedResultado(resultado)
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
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedResultado(resultado)
                              setShowEditModal(true)
                            }}
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-lab-error-600 hover:text-lab-error-700"
                            onClick={() => {
                              setSelectedResultado(resultado)
                              setShowDeleteModal(true)
                            }}
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredResultados.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">
                No se encontraron resultados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedResultado && (
        <ResultadoDetailModal
          resultado={selectedResultado}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedResultado(null)
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedResultado && (
        <ResultadoEditModal
          resultado={selectedResultado}
          onClose={() => {
            setShowEditModal(false)
            setSelectedResultado(null)
          }}
          onSave={(data) => updateResultado(selectedResultado.codigo_resultado, data)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedResultado && (
        <DeleteConfirmationModal
          resultadoInfo={`${selectedResultado.examen.nombre} - ${(selectedResultado.muestra?.paciente || selectedResultado.paciente)?.nombres}`}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedResultado(null)
          }}
          onConfirm={deleteResultado}
        />
      )}
    </div>
  )
}

// Resultado Detail Modal Component
function ResultadoDetailModal({
  resultado,
  onClose,
}: {
  resultado: Resultado
  onClose: () => void
}) {
  const paciente = resultado.muestra?.paciente || resultado.paciente

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-lab-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-lab-neutral-900">Detalles del Resultado</h2>
          <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div>
            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Información del Paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Nombre</label>
                <p className="text-lab-neutral-900">
                  {paciente?.nombres} {paciente?.apellidos}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Email</label>
                <p className="text-lab-neutral-900">{paciente?.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Exam Info */}
          <div>
            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Información del Examen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Examen</label>
                <p className="text-lab-neutral-900 font-semibold">{resultado.examen.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Código</label>
                <p className="text-lab-neutral-900 font-mono">{resultado.examen.codigo_interno}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Fecha del Resultado</label>
                <p className="text-lab-neutral-900">{formatDate(new Date(resultado.fecha_resultado))}</p>
              </div>
            </div>
          </div>

          {/* Result Values */}
          <div>
            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Valores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Valor Obtenido</label>
                <p className="text-lab-neutral-900 font-bold text-lg">{resultado.valor_obtenido}</p>
              </div>
              {resultado.valor_numerico !== null && (
                <div>
                  <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Valor Numérico</label>
                  <p className="text-lab-neutral-900">{resultado.valor_numerico}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Nivel</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  resultado.nivel === 'NORMAL' ? 'bg-lab-success-100 text-lab-success-800' :
                  resultado.nivel === 'BAJO' ? 'bg-lab-info-100 text-lab-info-800' :
                  resultado.nivel === 'ALTO' ? 'bg-lab-warning-100 text-lab-warning-800' :
                  resultado.nivel === 'CRITICO' ? 'bg-lab-danger-100 text-lab-danger-800' :
                  'bg-lab-neutral-100 text-lab-neutral-600'
                }`}>
                  {resultado.nivel}
                </span>
              </div>
            </div>

            {/* Reference Values */}
            {(resultado.examen.valor_referencia_min !== null || resultado.examen.valor_referencia_max !== null) && (
              <div className="mt-4 p-3 bg-lab-neutral-50 rounded-lg">
                <p className="text-sm text-lab-neutral-600">
                  Valores de referencia: {resultado.examen.valor_referencia_min ?? '-'} - {resultado.examen.valor_referencia_max ?? '-'}
                  {resultado.examen.unidad_medida && ` ${resultado.examen.unidad_medida}`}
                </p>
              </div>
            )}
          </div>

          {/* Observations and Status */}
          <div>
            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Estado y Observaciones</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Estado</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  resultado.estado === 'VALIDADO' ? 'bg-lab-success-100 text-lab-success-800' :
                  resultado.estado === 'ENVIADO' ? 'bg-lab-info-100 text-lab-info-800' :
                  'bg-lab-warning-100 text-lab-warning-800'
                }`}>
                  {resultado.estado}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-lab-neutral-500 mb-1">Observaciones</label>
                <p className="text-lab-neutral-900">{resultado.observaciones || 'Sin observaciones'}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-lab-neutral-200">
            <Button onClick={onClose} className="bg-lab-primary-600 hover:bg-lab-primary-700">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Resultado Edit Modal Component
function ResultadoEditModal({
  resultado,
  onClose,
  onSave,
}: {
  resultado: Resultado
  onClose: () => void
  onSave: (data: Partial<Resultado>) => void
}) {
  const [estado, setEstado] = useState(resultado.estado)
  const [observaciones, setObservaciones] = useState(resultado.observaciones || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      estado,
      observaciones: observaciones || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="sticky top-0 bg-white border-b border-lab-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-lab-neutral-900">Editar Resultado</h2>
          <button onClick={onClose} className="text-lab-neutral-400 hover:text-lab-neutral-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-lab-neutral-50 p-4 rounded-lg">
            <p className="text-sm text-lab-neutral-600">
              <strong>Examen:</strong> {resultado.examen.nombre}
            </p>
            <p className="text-sm text-lab-neutral-600">
              <strong>Valor:</strong> {resultado.valor_obtenido}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
              Estado <span className="text-lab-error-600">*</span>
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
              required
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="VALIDADO">VALIDADO</option>
              <option value="ENVIADO">ENVIADO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-lab-neutral-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-lab-neutral-300 rounded-lg focus:ring-2 focus:ring-lab-primary-500 focus:border-lab-primary-500"
              placeholder="Observaciones del médico..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-lab-primary-600 hover:bg-lab-primary-700">
              Actualizar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  resultadoInfo,
  onClose,
  onConfirm,
}: {
  resultadoInfo: string
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
            ¿Eliminar Resultado?
          </h3>
          <p className="mt-2 text-sm text-center text-lab-neutral-600">
            ¿Estás seguro de que deseas eliminar el resultado de <strong>{resultadoInfo}</strong>? Esta acción no se puede deshacer.
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
