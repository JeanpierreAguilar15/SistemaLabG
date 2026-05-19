'use client'

import { useCallback, useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

interface Examen {
  codigo_examen: number
  nombre: string
  codigo_interno: string
}

interface ResultadoAgrupado {
  codigo_resultado: number
  examen: Examen
  valor_numerico: number | null
  valor_texto: string | null
  unidad_medida: string | null
  nivel: string | null
  estado: string
  fecha_resultado: string
  url_pdf: string | null
}

interface Paciente {
  codigo_usuario: number
  nombres: string
  apellidos: string
  cedula: string
  email: string
}

interface MuestraAgrupada {
  codigo_muestra: number
  id_muestra: string
  fecha_toma: string
  tipo_muestra: string
  estado_muestra: string
  paciente: Paciente
  resultados: ResultadoAgrupado[]
  total_examenes: number
  examenes_listos: number
  examenes_pendientes: number
}

interface Message {
  type: 'success' | 'error'
  text: string
}

export default function ResultadosAdminPage() {
  const { accessToken } = useAuthStore()
  const [muestras, setMuestras] = useState<MuestraAgrupada[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedMuestras, setExpandedMuestras] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState<Message | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadResultadoId, setUploadResultadoId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [isEditingPdf, setIsEditingPdf] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadResultados = useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/admin/agrupados`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const result = await response.json()
        setMuestras(result)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cargar resultados' })
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      loadResultados()
    }
  }, [accessToken, loadResultados])

  const toggleExpand = (codigoMuestra: number) => {
    const newExpanded = new Set(expandedMuestras)
    if (newExpanded.has(codigoMuestra)) {
      newExpanded.delete(codigoMuestra)
    } else {
      newExpanded.add(codigoMuestra)
    }
    setExpandedMuestras(newExpanded)
  }

  const handleDownloadPDF = async (codigo_resultado: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/admin/${codigo_resultado}/descargar`, {
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
      setMessage({ type: 'error', text: 'Error de conexion al servidor' })
    }
  }

  const handleOpenUploadModal = (codigo_resultado: number, isEditing: boolean = false) => {
    setUploadResultadoId(codigo_resultado)
    setSelectedFile(null)
    setIsEditingPdf(isEditing)
    setShowUploadModal(true)
  }

  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
    setUploadResultadoId(null)
    setSelectedFile(null)
    setIsEditingPdf(false)
    setUploadingPdf(false)
  }

  const handlePreviewPDF = async (codigo_resultado: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/admin/${codigo_resultado}/descargar`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        setPdfPreviewUrl(url)
        setShowPdfPreview(true)
      } else {
        setMessage({ type: 'error', text: 'Error al cargar vista previa del PDF' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexion al servidor' })
    }
  }

  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl)
    }
    setPdfPreviewUrl(null)
    setShowPdfPreview(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setMessage({ type: 'error', text: 'Solo se permiten archivos PDF' })
        e.target.value = ''
        return
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'El archivo no debe superar los 10MB' })
        e.target.value = ''
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUploadPDF = async () => {
    if (!selectedFile || !uploadResultadoId) {
      setMessage({ type: 'error', text: 'Debe seleccionar un archivo PDF' })
      return
    }

    try {
      setUploadingPdf(true)
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
        const successMessage = isEditingPdf
          ? 'PDF reemplazado correctamente. No se descontó inventario nuevamente.'
          : 'PDF subido, resultado validado e inventario procesado correctamente'
        setMessage({ type: 'success', text: successMessage })
        handleCloseUploadModal()
        loadResultados()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al subir PDF' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexion al servidor' })
    } finally {
      setUploadingPdf(false)
    }
  }

  const filteredMuestras = muestras.filter((muestra) => {
    const matchSearch =
      searchTerm === '' ||
      muestra.paciente?.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      muestra.paciente?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      muestra.paciente?.cedula.includes(searchTerm) ||
      muestra.id_muestra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      muestra.resultados.some((r) => r.examen?.nombre.toLowerCase().includes(searchTerm.toLowerCase()))

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
      case 'LISTO':
        return 'bg-lab-primary-100 text-lab-primary-800'
      case 'ENTREGADO':
        return 'bg-lab-neutral-100 text-lab-neutral-800'
      case 'EN_PROCESO':
        return 'bg-lab-warning-100 text-lab-warning-800'
      default:
        return 'bg-lab-info-100 text-lab-info-600'
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
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-top-2 fade-in duration-300 ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-lab-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Gestion de Resultados</h1>
        <p className="text-lab-neutral-600 mt-2">
          Resultados organizados por paciente y muestra. Cada fila agrupa todos los examenes de una misma muestra.
        </p>
        <div className="mt-3 bg-lab-info-50 border border-lab-info-200 rounded-lg p-3">
          <p className="text-sm text-lab-info-800">
            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Haz clic en una fila para ver y gestionar los examenes individuales de cada paciente.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por paciente, cedula, ID muestra o examen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Grouped Results */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados por Paciente ({filteredMuestras.length} muestras)</CardTitle>
          <CardDescription>Lista de muestras con sus examenes agrupados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMuestras.map((muestra) => (
              <div
                key={muestra.codigo_muestra}
                className="border border-lab-neutral-200 rounded-lg overflow-hidden"
              >
                {/* Header row - clickable */}
                <div
                  onClick={() => toggleExpand(muestra.codigo_muestra)}
                  className="bg-lab-neutral-50 p-4 cursor-pointer hover:bg-lab-neutral-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Expand icon */}
                      <svg
                        className={`w-5 h-5 text-lab-neutral-500 transition-transform ${
                          expandedMuestras.has(muestra.codigo_muestra) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>

                      {/* Patient info */}
                      <div>
                        <div className="font-semibold text-lab-neutral-900">
                          {muestra.paciente?.nombres} {muestra.paciente?.apellidos}
                        </div>
                        <div className="text-sm text-lab-neutral-600 flex items-center gap-3">
                          <span className="font-mono">{muestra.paciente?.cedula}</span>
                          <span>|</span>
                          <span>Muestra: {muestra.id_muestra}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Date */}
                      <div className="text-right">
                        <div className="text-sm text-lab-neutral-500">Fecha toma</div>
                        <div className="font-medium">
                          {formatDate(new Date(muestra.fecha_toma))}
                        </div>
                      </div>

                      {/* Exam counts */}
                      <div className="text-right">
                        <div className="text-sm text-lab-neutral-500">Examenes</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lab-success-600 font-medium">
                            {muestra.examenes_listos} listos
                          </span>
                          {muestra.examenes_pendientes > 0 && (
                            <>
                              <span className="text-lab-neutral-400">/</span>
                              <span className="text-lab-warning-600 font-medium">
                                {muestra.examenes_pendientes} pendientes
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Expanded content - individual exams */}
                {expandedMuestras.has(muestra.codigo_muestra) && (
                  <div className="border-t border-lab-neutral-200 bg-white">
                    {/* Exams table */}
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-lab-neutral-200 bg-lab-neutral-50">
                          <th className="text-left p-3 text-sm font-semibold text-lab-neutral-700">Examen</th>
                          <th className="text-left p-3 text-sm font-semibold text-lab-neutral-700">Codigo</th>
                          <th className="text-left p-3 text-sm font-semibold text-lab-neutral-700">Nivel</th>
                          <th className="text-left p-3 text-sm font-semibold text-lab-neutral-700">Estado</th>
                          <th className="text-right p-3 text-sm font-semibold text-lab-neutral-700">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {muestra.resultados.map((resultado) => (
                          <tr
                            key={resultado.codigo_resultado}
                            className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50"
                          >
                            <td className="p-3">
                              <div className="font-medium text-lab-neutral-900">
                                {resultado.examen?.nombre}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-sm text-lab-neutral-600">
                                {resultado.examen?.codigo_interno}
                              </span>
                            </td>
                            <td className="p-3">
                              {resultado.nivel && (
                                <span className={`text-xs px-2 py-1 rounded ${getNivelBadge(resultado.nivel)}`}>
                                  {resultado.nivel}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(resultado.estado)}`}>
                                {resultado.estado}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-2">
                                {!resultado.url_pdf && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenUploadModal(resultado.codigo_resultado)
                                    }}
                                    className="text-lab-primary-600 hover:text-lab-primary-700 hover:bg-lab-primary-50"
                                    title="Subir PDF de resultado"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Subir
                                  </Button>
                                )}

                                {resultado.url_pdf && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlePreviewPDF(resultado.codigo_resultado)
                                      }}
                                      className="text-lab-info-600 hover:text-lab-info-700 hover:bg-lab-info-50"
                                      title="Vista previa del PDF"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownloadPDF(resultado.codigo_resultado)
                                      }}
                                      className="text-lab-success-600 hover:text-lab-success-700 hover:bg-lab-success-50"
                                      title="Descargar PDF"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                      </svg>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenUploadModal(resultado.codigo_resultado, true)
                                      }}
                                      className="text-lab-warning-600 hover:text-lab-warning-700 hover:bg-lab-warning-50"
                                      title="Reemplazar PDF"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {filteredMuestras.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">
                No se encontraron resultados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-lab-neutral-200">
              <h2 className="text-2xl font-bold text-lab-neutral-900">
                {isEditingPdf ? 'Reemplazar PDF de Resultado' : 'Subir PDF de Resultado'}
              </h2>
              <p className="text-sm text-lab-neutral-600 mt-2">
                {isEditingPdf
                  ? 'Selecciona un nuevo archivo PDF para reemplazar la referencia actual. No se descuenta inventario nuevamente.'
                  : 'Sube un PDF procesado externamente. Esto validara el resultado y descontara los insumos configurados si aun no estaba listo.'}
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
                    Tamano maximo: 10MB. Solo archivos PDF
                  </p>
                  {!isEditingPdf && (
                    <p className="text-xs text-lab-warning-700 mt-2 rounded-md bg-lab-warning-50 border border-lab-warning-200 p-2">
                      Al confirmar, el sistema marca el resultado como listo, genera codigo de verificacion y ejecuta el descuento automatico de inventario.
                    </p>
                  )}
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
                  disabled={!selectedFile || uploadingPdf}
                  className="bg-lab-primary-600 hover:bg-lab-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploadingPdf ? 'Procesando...' : isEditingPdf ? 'Reemplazar PDF' : 'Subir y Validar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPdfPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="p-4 border-b border-lab-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-lab-neutral-900">Vista Previa del Resultado</h2>
              <button
                onClick={handleClosePdfPreview}
                className="text-lab-neutral-400 hover:text-lab-neutral-600 transition-colors"
                title="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="Vista previa del PDF"
              />
            </div>
            <div className="p-4 border-t border-lab-neutral-200 flex justify-end">
              <Button onClick={handleClosePdfPreview} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
