'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

interface Cancha {
  id: string
  nombre: string
  tipo: string
  descripcion: string
  precioPorHora: number
  activa: boolean
  imagen?: string
  horarios?: Horario[]
}

interface Horario {
  id?: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  disponible: boolean
}

const tipoIcons: Record<string, JSX.Element> = {
  FUTBOL: (
    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
    </svg>
  ),
  TENIS: (
    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2c-2 4-2 8 0 12s2 8 0 12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h20" />
    </svg>
  ),
  BASQUET: (
    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M2 12h20" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.93 4.93c4.14 4.14 10 4.14 14.14 0M4.93 19.07c4.14-4.14 10-4.14 14.14 0" />
    </svg>
  ),
}

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
]

const initialFormData = {
  nombre: '',
  tipo: '',
  descripcion: '',
  precioPorHora: 0,
  activa: true,
  imagen: ''
}

const initialHorarios: Horario[] = [
  { diaSemana: 1, horaInicio: '08:00', horaFin: '22:00', disponible: true },
  { diaSemana: 2, horaInicio: '08:00', horaFin: '22:00', disponible: true },
  { diaSemana: 3, horaInicio: '08:00', horaFin: '22:00', disponible: true },
  { diaSemana: 4, horaInicio: '08:00', horaFin: '22:00', disponible: true },
  { diaSemana: 5, horaInicio: '08:00', horaFin: '22:00', disponible: true },
  { diaSemana: 6, horaInicio: '09:00', horaFin: '20:00', disponible: true },
  { diaSemana: 0, horaInicio: '09:00', horaFin: '18:00', disponible: true },
]

export default function AdminCanchasPage() {
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [horariosModalOpen, setHorariosModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cancha | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [horarios, setHorarios] = useState<Horario[]>(initialHorarios)
  const [selectedCancha, setSelectedCancha] = useState<Cancha | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    cargarCanchas()
  }, [])

  const cargarCanchas = async () => {
    try {
      const data = await api.getCanchas(undefined, true)
      setCanchas(data)
    } catch (error) {
      showToast('Error al cargar las canchas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleNueva = () => {
    setEditando(null)
    setFormData(initialFormData)
    setImagePreview(null)
    setModalOpen(true)
  }

  const handleEditar = (cancha: Cancha) => {
    setEditando(cancha)
    setFormData({
      nombre: cancha.nombre,
      tipo: cancha.tipo,
      descripcion: cancha.descripcion,
      precioPorHora: cancha.precioPorHora,
      activa: cancha.activa,
      imagen: cancha.imagen || ''
    })
    setImagePreview(cancha.imagen ? api.getImageUrl(cancha.imagen) : null)
    setModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      showToast('Solo se permiten imagenes (jpg, png, gif, webp)', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no puede ser mayor a 5MB', 'error')
      return
    }

    setUploading(true)
    try {
      const result = await api.uploadFile(file)
      setFormData({ ...formData, imagen: result.filename })
      setImagePreview(api.getImageUrl(result.filename))
      showToast('Imagen subida correctamente', 'success')
    } catch (error: any) {
      showToast(error.message || 'Error al subir la imagen', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagen: '' })
    setImagePreview(null)
  }

  const handleHorarios = async (cancha: Cancha) => {
    setSelectedCancha(cancha)
    try {
      const horariosData = await api.getHorarios(cancha.id)
      if (horariosData && horariosData.length > 0) {
        setHorarios(horariosData)
      } else {
        setHorarios(initialHorarios)
      }
      setHorariosModalOpen(true)
    } catch (error) {
      showToast('Error al cargar los horarios', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      showToast('El nombre es requerido', 'warning')
      return
    }
    if (!formData.tipo) {
      showToast('El tipo es requerido', 'warning')
      return
    }
    if (formData.precioPorHora <= 0) {
      showToast('El precio debe ser mayor a 0', 'warning')
      return
    }

    setSaving(true)
    try {
      if (editando) {
        await api.updateCancha(editando.id, formData)
        showToast('Cancha actualizada correctamente', 'success')
      } else {
        await api.createCancha(formData as any)
        showToast('Cancha creada correctamente', 'success')
      }
      setModalOpen(false)
      cargarCanchas()
    } catch (error: any) {
      showToast(error.message || 'Error al guardar la cancha', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarHorarios = async () => {
    if (!selectedCancha) return

    setSaving(true)
    try {
      await api.updateHorarios(selectedCancha.id, horarios)
      showToast('Horarios actualizados correctamente', 'success')
      setHorariosModalOpen(false)
      cargarCanchas()
    } catch (error: any) {
      showToast(error.message || 'Error al guardar los horarios', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActiva = async (cancha: Cancha) => {
    try {
      await api.updateCancha(cancha.id, { activa: !cancha.activa })
      showToast(cancha.activa ? 'Cancha desactivada' : 'Cancha activada', 'success')
      cargarCanchas()
    } catch (error) {
      showToast('Error al cambiar el estado', 'error')
    }
  }

  const updateHorario = (index: number, field: keyof Horario, value: any) => {
    const newHorarios = [...horarios]
    newHorarios[index] = { ...newHorarios[index], [field]: value }
    setHorarios(newHorarios)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion de Canchas</h1>
        <button onClick={handleNueva} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cancha
        </button>
      </div>

      {/* Grid de Canchas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando canchas...</p>
        </div>
      ) : canchas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500">No hay canchas registradas</p>
          <button onClick={handleNueva} className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
            Crear primera cancha
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canchas.map((cancha) => (
            <div key={cancha.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all hover:shadow-md ${!cancha.activa ? 'opacity-60' : ''}`}>
              {cancha.imagen ? (
                <div className="h-40 bg-gray-100 relative">
                  <img
                    src={api.getImageUrl(cancha.imagen)}
                    alt={cancha.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full font-medium ${
                    cancha.tipo === 'FUTBOL' ? 'bg-green-500 text-white' :
                    cancha.tipo === 'TENIS' ? 'bg-yellow-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {cancha.tipo}
                  </div>
                </div>
              ) : (
                <div className={`h-32 flex items-center justify-center ${
                  cancha.tipo === 'FUTBOL' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                  cancha.tipo === 'TENIS' ? 'bg-gradient-to-br from-yellow-500 to-amber-600' : 'bg-gradient-to-br from-orange-500 to-orange-700'
                }`}>
                  {tipoIcons[cancha.tipo]}
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">{cancha.nombre}</h3>
                  <button
                    onClick={() => handleToggleActiva(cancha)}
                    className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                      cancha.activa
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {cancha.activa ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{cancha.descripcion}</p>
                <p className="text-blue-600 font-bold text-lg mb-4">${cancha.precioPorHora}/hora</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditar(cancha)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleHorarios(cancha)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Horarios
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edicion/Creacion */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editando ? 'Editar Cancha' : 'Nueva Cancha'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Cancha de Futbol 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="input-field"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="FUTBOL">Futbol</option>
                  <option value="TENIS">Tenis</option>
                  <option value="BASQUET">Basquet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Descripcion de la cancha..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio por Hora ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precioPorHora}
                  onChange={(e) => setFormData({ ...formData, precioPorHora: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen de la Cancha
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="mt-2 text-sm text-gray-500">Subiendo...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 text-sm text-gray-500">Click para subir imagen</span>
                        <span className="text-xs text-gray-400">JPG, PNG, GIF (max 5MB)</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {editando && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activa" className="ml-2 text-sm text-gray-700">
                    Cancha activa
                  </label>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Horarios */}
      {horariosModalOpen && selectedCancha && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Horarios - {selectedCancha.nombre}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Configura los horarios de disponibilidad para cada dia</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {diasSemana.map((dia) => {
                  const horario = horarios.find(h => h.diaSemana === dia.value) || {
                    diaSemana: dia.value,
                    horaInicio: '08:00',
                    horaFin: '22:00',
                    disponible: false
                  }
                  const index = horarios.findIndex(h => h.diaSemana === dia.value)

                  return (
                    <div key={dia.value} className={`p-4 rounded-lg border transition-colors ${horario.disponible ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={horario.disponible}
                            onChange={(e) => {
                              if (index === -1) {
                                setHorarios([...horarios, { ...horario, disponible: e.target.checked }])
                              } else {
                                updateHorario(index, 'disponible', e.target.checked)
                              }
                            }}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className={`font-medium ${horario.disponible ? 'text-gray-800' : 'text-gray-500'}`}>
                            {dia.label}
                          </span>
                        </div>
                        {horario.disponible && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={horario.horaInicio}
                              onChange={(e) => updateHorario(index, 'horaInicio', e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              type="time"
                              value={horario.horaFin}
                              onChange={(e) => updateHorario(index, 'horaFin', e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setHorariosModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarHorarios}
                className="btn-primary flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Horarios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
