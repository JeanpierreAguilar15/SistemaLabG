'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

interface Resultado {
  codigo_resultado: number
  codigo_muestra: number
  codigo_examen: number
  valor_numerico: number | null
  valor_texto: string | null
  unidad_medida: string | null
  nivel: string | null
  observaciones_tecnicas: string | null
  estado: string
  fecha_resultado: string
  url_pdf: string | null
  muestra: {
    id_muestra: string
    codigo_paciente: number
    paciente: {
      nombres: string
      apellidos: string
      email: string
      cedula: string
    }
  }
  examen: {
    codigo_examen: number
    nombre: string
    codigo_interno: string
  }
  valor_referencia_min: number | null
  valor_referencia_max: number | null
  valores_referencia_texto: string | null
}

interface Muestra {
  codigo_muestra: number
  id_muestra: string
  codigo_paciente: number
  paciente: {
    nombres: string
    apellidos: string
    cedula: string
  }
}

interface Examen {
  codigo_examen: number
  nombre: string
  codigo_interno: string
}

interface Message {
  type: 'success' | 'error'
  text: string
}

export default function ResultadosAdminPage() {
  const { accessToken } = useAuthStore()
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [muestras, setMuestras] = useState<Muestra[]>([])
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedResultado, setSelectedResultado] = useState<Resultado | null>(null)
  const [editingResultado, setEditingResultado] = useState<Resultado | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadResultadoId, setUploadResultadoId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    codigo_muestra: '',
    codigo_examen: '',
    valor_numerico: '',
    valor_texto: '',
    unidad_medida: '',
    valor_referencia_min: '',
    valor_referencia_max: '',
    valores_referencia_texto: '',
    observaciones_tecnicas: '',
    nivel: 'NORMAL',
  })

  useEffect(() => {
    loadResultados()
    loadMuestras()
    loadExamenes()
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadResultados = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/admin/all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        const resultados = result.data || result
        setResultados(resultados)
      }
    } catch (error) {
      console.error('Error loading resultados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMuestras = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/muestras`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setMuestras(data.data || data)
      }
    } catch (error) {
      console.error('Error loading muestras:', error)
    }
  }

  const loadExamenes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/exams`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setExamenes(data.data || data)
      }
    } catch (error) {
      console.error('Error loading examenes:', error)
    }
  }

  const handleOpenForm = (resultado?: Resultado) => {
    if (resultado) {
      setEditingResultado(resultado)
      setFormData({
        codigo_muestra: resultado.codigo_muestra.toString(),
        codigo_examen: resultado.codigo_examen.toString(),
        valor_numerico: resultado.valor_numerico?.toString() || '',
        valor_texto: resultado.valor_texto || '',
        unidad_medida: resultado.unidad_medida || '',
        valor_referencia_min: resultado.valor_referencia_min?.toString() || '',
        valor_referencia_max: resultado.valor_referencia_max?.toString() || '',
        valores_referencia_texto: resultado.valores_referencia_texto || '',
        observaciones_tecnicas: resultado.observaciones_tecnicas || '',
        nivel: resultado.nivel || 'NORMAL',
      })
    } else {
      setEditingResultado(null)
      setFormData({
        codigo_muestra: '',
        codigo_examen: '',
        valor_numerico: '',
        valor_texto: '',
        unidad_medida: '',
        valor_referencia_min: '',
        valor_referencia_max: '',
        valores_referencia_texto: '',
        observaciones_tecnicas: '',
        nivel: 'NORMAL',
      })
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingResultado(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload: any = {
        codigo_muestra: parseInt(formData.codigo_muestra),
        codigo_examen: parseInt(formData.codigo_examen),
        nivel: formData.nivel,
      }

      if (formData.valor_numerico) payload.valor_numerico = parseFloat(formData.valor_numerico)
      if (formData.valor_texto) payload.valor_texto = formData.valor_texto
      if (formData.unidad_medida) payload.unidad_medida = formData.unidad_medida
      if (formData.valor_referencia_min) payload.valor_referencia_min = parseFloat(formData.valor_referencia_min)
      if (formData.valor_referencia_max) payload.valor_referencia_max = parseFloat(formData.valor_referencia_max)
      if (formData.valores_referencia_texto) payload.valores_referencia_texto = formData.valores_referencia_texto
      if (formData.observaciones_tecnicas) payload.observaciones_tecnicas = formData.observaciones_tecnicas

      const url = editingResultado
        ? `${process.env.NEXT_PUBLIC_API_URL}/resultados/admin/${editingResultado.codigo_resultado}`
        : `${process.env.NEXT_PUBLIC_API_URL}/resultados`

      const response = await fetch(url, {
        method: editingResultado ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingResultado ? '✅ Resultado actualizado correctamente' : '✅ Resultado creado correctamente',
        })
        handleCloseForm()
        loadResultados()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al guardar resultado' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleValidar = async (codigo_resultado: number) => {
    if (!confirm('¿Está seguro de validar este resultado? Esto generará el PDF automáticamente.')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/${codigo_resultado}/validar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Resultado validado y PDF generado correctamente' })
        loadResultados()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al validar resultado' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleDownloadPDF = async (codigo_resultado: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/${codigo_resultado}/descargar`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resultado-${codigo_resultado}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setMessage({ type: 'error', text: 'Error al descargar PDF' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleOpenUploadModal = (codigo_resultado: number) => {
    setUploadResultadoId(codigo_resultado)
    setSelectedFile(null)
    setShowUploadModal(true)
  }

  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
    setUploadResultadoId(null)
    setSelectedFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        setMessage({ type: 'error', text: '❌ Solo se permiten archivos PDF' })
        e.target.value = ''
        return
      }

      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: '❌ El archivo no debe superar los 10MB' })
        e.target.value = ''
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUploadPDF = async () => {
    if (!selectedFile || !uploadResultadoId) {
      setMessage({ type: 'error', text: '❌ Debe seleccionar un archivo PDF' })
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/resultados/${uploadResultadoId}/upload-pdf`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      )

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ PDF subido y resultado validado correctamente' })
        handleCloseUploadModal()
        loadResultados()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al subir PDF' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    }
  }

  const handleViewDetails = (resultado: Resultado) => {
    setSelectedResultado(resultado)
    setShowDetailModal(true)
  }

  const filteredResultados = resultados.filter((resultado) => {
    const matchSearch =
      searchTerm === '' ||
      resultado.muestra?.paciente?.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resultado.muestra?.paciente?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resultado.examen?.nombre.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  const getNivelBadge = (nivel: string | null) => {
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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'VALIDADO':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'EN_PROCESO':
        return 'bg-lab-warning-100 text-lab-warning-800'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-600'
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
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Resultados</h1>
          <p className="text-lab-neutral-600 mt-2">
            Administra los resultados de exámenes de laboratorio
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Resultado
        </Button>
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-lab-neutral-200">
              <h2 className="text-2xl font-bold text-lab-neutral-900">
                {editingResultado ? 'Editar Resultado' : 'Nuevo Resultado'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="codigo_muestra" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Muestra *
                  </label>
                  <select
                    id="codigo_muestra"
                    name="codigo_muestra"
                    value={formData.codigo_muestra}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingResultado}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500 disabled:bg-lab-neutral-100"
                  >
                    <option value="">Seleccionar muestra...</option>
                    {muestras.map((muestra) => (
                      <option key={muestra.codigo_muestra} value={muestra.codigo_muestra}>
                        {muestra.id_muestra} - {muestra.paciente.nombres} {muestra.paciente.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="codigo_examen" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Examen *
                  </label>
                  <select
                    id="codigo_examen"
                    name="codigo_examen"
                    value={formData.codigo_examen}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingResultado}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500 disabled:bg-lab-neutral-100"
                  >
                    <option value="">Seleccionar examen...</option>
                    {examenes.map((examen) => (
                      <option key={examen.codigo_examen} value={examen.codigo_examen}>
                        {examen.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="valor_numerico" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Valor Numérico
                  </label>
                  <input
                    type="number"
                    id="valor_numerico"
                    name="valor_numerico"
                    value={formData.valor_numerico}
                    onChange={handleInputChange}
                    step="0.01"
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="unidad_medida" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    id="unidad_medida"
                    name="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={handleInputChange}
                    placeholder="mg/dL, U/L, etc."
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="valor_texto" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Valor de Texto
                  </label>
                  <input
                    type="text"
                    id="valor_texto"
                    name="valor_texto"
                    value={formData.valor_texto}
                    onChange={handleInputChange}
                    placeholder="Positivo, Negativo, Reactivo, etc."
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="valor_referencia_min" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Valor Referencia Mínimo
                  </label>
                  <input
                    type="number"
                    id="valor_referencia_min"
                    name="valor_referencia_min"
                    value={formData.valor_referencia_min}
                    onChange={handleInputChange}
                    step="0.01"
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="valor_referencia_max" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Valor Referencia Máximo
                  </label>
                  <input
                    type="number"
                    id="valor_referencia_max"
                    name="valor_referencia_max"
                    value={formData.valor_referencia_max}
                    onChange={handleInputChange}
                    step="0.01"
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="valores_referencia_texto" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Valores de Referencia (Texto)
                  </label>
                  <input
                    type="text"
                    id="valores_referencia_texto"
                    name="valores_referencia_texto"
                    value={formData.valores_referencia_texto}
                    onChange={handleInputChange}
                    placeholder="Normal: Negativo, Adultos: 70-100 mg/dL"
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="nivel" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Nivel *
                  </label>
                  <select
                    id="nivel"
                    name="nivel"
                    value={formData.nivel}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="BAJO">Bajo</option>
                    <option value="ALTO">Alto</option>
                    <option value="CRITICO">Crítico</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="observaciones_tecnicas" className="block text-sm font-medium text-lab-neutral-700 mb-1">
                    Observaciones Técnicas
                  </label>
                  <textarea
                    id="observaciones_tecnicas"
                    name="observaciones_tecnicas"
                    value={formData.observaciones_tecnicas}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full rounded-md border border-lab-neutral-300 px-3 py-2 focus:border-lab-primary-500 focus:ring-lab-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-lab-neutral-200">
                <Button type="button" onClick={handleCloseForm} variant="outline">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-lab-primary-600 hover:bg-lab-primary-700">
                  {editingResultado ? 'Actualizar' : 'Crear'} Resultado
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedResultado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-lab-neutral-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-lab-neutral-900">Detalles del Resultado</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-lab-neutral-400 hover:text-lab-neutral-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Paciente Info */}
              <div>
                <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Información del Paciente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-lab-neutral-500">Nombre:</span>
                    <p className="font-medium">{selectedResultado.muestra?.paciente?.nombres} {selectedResultado.muestra?.paciente?.apellidos}</p>
                  </div>
                  <div>
                    <span className="text-lab-neutral-500">Cédula:</span>
                    <p className="font-medium font-mono">{selectedResultado.muestra?.paciente?.cedula}</p>
                  </div>
                  <div>
                    <span className="text-lab-neutral-500">Email:</span>
                    <p className="font-medium">{selectedResultado.muestra?.paciente?.email}</p>
                  </div>
                  <div>
                    <span className="text-lab-neutral-500">ID Muestra:</span>
                    <p className="font-medium font-mono">{selectedResultado.muestra?.id_muestra}</p>
                  </div>
                </div>
              </div>

              {/* Exam Info */}
              <div>
                <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Información del Examen</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-lab-neutral-500">Examen:</span>
                    <p className="font-medium">{selectedResultado.examen?.nombre}</p>
                  </div>
                  <div>
                    <span className="text-lab-neutral-500">Código Interno:</span>
                    <p className="font-medium font-mono">{selectedResultado.examen?.codigo_interno}</p>
                  </div>
                  <div>
                    <span className="text-lab-neutral-500">Fecha:</span>
                    <p className="font-medium">{formatDate(new Date(selectedResultado.fecha_resultado))}</p>
                  </div>
                  <div>
                    <span className="text-lab-neutral-500">Estado:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(selectedResultado.estado)}`}>
                      {selectedResultado.estado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Result Values */}
              <div>
                <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Valores del Resultado</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedResultado.valor_numerico && (
                    <div>
                      <span className="text-lab-neutral-500">Valor Numérico:</span>
                      <p className="text-2xl font-bold text-lab-primary-600">
                        {selectedResultado.valor_numerico} {selectedResultado.unidad_medida}
                      </p>
                    </div>
                  )}
                  {selectedResultado.valor_texto && (
                    <div>
                      <span className="text-lab-neutral-500">Valor:</span>
                      <p className="text-lg font-semibold">{selectedResultado.valor_texto}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-lab-neutral-500">Nivel:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(selectedResultado.nivel)}`}>
                      {selectedResultado.nivel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reference Values */}
              {(selectedResultado.valor_referencia_min || selectedResultado.valor_referencia_max || selectedResultado.valores_referencia_texto) && (
                <div>
                  <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Valores de Referencia</h3>
                  <div className="bg-lab-neutral-50 rounded-lg p-4 space-y-2 text-sm">
                    {selectedResultado.valor_referencia_min && selectedResultado.valor_referencia_max && (
                      <p>
                        <span className="text-lab-neutral-600">Rango: </span>
                        <span className="font-medium">
                          {selectedResultado.valor_referencia_min} - {selectedResultado.valor_referencia_max} {selectedResultado.unidad_medida}
                        </span>
                      </p>
                    )}
                    {selectedResultado.valores_referencia_texto && (
                      <p>
                        <span className="text-lab-neutral-600">Referencia: </span>
                        <span className="font-medium">{selectedResultado.valores_referencia_texto}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Observations */}
              {selectedResultado.observaciones_tecnicas && (
                <div>
                  <h3 className="text-lg font-semibold text-lab-neutral-900 mb-3">Observaciones Técnicas</h3>
                  <p className="text-sm text-lab-neutral-700 bg-lab-warning-50 border border-lab-warning-200 rounded-lg p-4">
                    {selectedResultado.observaciones_tecnicas}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-lab-neutral-200 flex justify-end">
              <Button onClick={() => setShowDetailModal(false)} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

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
                {filteredResultados.map((resultado) => (
                  <tr
                    key={resultado.codigo_resultado}
                    className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50"
                  >
                    <td className="p-4 text-sm text-lab-neutral-700">
                      {formatDate(new Date(resultado.fecha_resultado))}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">
                        {resultado.muestra?.paciente?.nombres} {resultado.muestra?.paciente?.apellidos}
                      </div>
                      <div className="text-sm text-lab-neutral-600">{resultado.muestra?.paciente?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">{resultado.examen?.nombre}</div>
                      <div className="text-sm text-lab-neutral-600">{resultado.examen?.codigo_interno}</div>
                    </td>
                    <td className="p-4 font-semibold text-lab-neutral-900">
                      {resultado.valor_numerico ? `${resultado.valor_numerico} ${resultado.unidad_medida || ''}` : resultado.valor_texto}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${getNivelBadge(resultado.nivel)}`}>
                        {resultado.nivel}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(resultado.estado)}`}>
                        {resultado.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(resultado)}>
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleOpenForm(resultado)}>
                        Editar
                      </Button>
                      {resultado.estado === 'EN_PROCESO' && !resultado.url_pdf && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidar(resultado.codigo_resultado)}
                            className="text-lab-success-600 hover:text-lab-success-700 hover:bg-lab-success-50"
                          >
                            Validar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenUploadModal(resultado.codigo_resultado)}
                            className="text-lab-primary-600 hover:text-lab-primary-700 hover:bg-lab-primary-50"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Subir PDF
                          </Button>
                        </>
                      )}
                      {(resultado.estado === 'VALIDADO' || resultado.estado === 'LISTO') && resultado.url_pdf && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(resultado.codigo_resultado)}
                          className="text-lab-primary-600 hover:text-lab-primary-700 hover:bg-lab-primary-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          PDF
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
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

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-lab-neutral-200">
              <h2 className="text-2xl font-bold text-lab-neutral-900">
                Subir PDF de Resultado
              </h2>
              <p className="text-sm text-lab-neutral-600 mt-2">
                Sube un archivo PDF procesado externamente. Esto validará automáticamente el resultado.
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="pdf-file" className="block text-sm font-medium text-lab-neutral-700 mb-2">
                    Seleccionar archivo PDF *
                  </label>
                  <input
                    type="file"
                    id="pdf-file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-lab-neutral-600
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-lab-primary-50 file:text-lab-primary-700
                      hover:file:bg-lab-primary-100
                      cursor-pointer"
                  />
                  <p className="text-xs text-lab-neutral-500 mt-1">
                    Tamaño máximo: 10MB. Solo archivos PDF
                  </p>
                </div>

                {selectedFile && (
                  <div className="bg-lab-success-50 border border-lab-success-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-lab-success-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-lab-success-800">{selectedFile.name}</p>
                        <p className="text-xs text-lab-success-600">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-lab-neutral-200">
                <Button type="button" onClick={handleCloseUploadModal} variant="outline">
                  Cancelar
                </Button>
                <Button
                  onClick={handleUploadPDF}
                  disabled={!selectedFile}
                  className="bg-lab-primary-600 hover:bg-lab-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Subir y Validar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
