'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateEmail, validatePhoneEcuador, validateTimeRange } from '@/lib/utils'

interface LabConfig {
  nombre: string
  email: string
  telefono: string
  direccion: string
  horaInicio: string
  horaFin: string
  duracionSlot: number
  capacidadDefecto: number
}

interface SystemStats {
  totalUsuarios: number
  totalCitas: number
  totalExamenes: number
  totalResultados: number
}

export default function ConfigurationPage() {
  const { accessToken } = useAuthStore()
  const [config, setConfig] = useState<LabConfig>({
    nombre: 'Laboratorio Clínico Franz',
    email: 'contacto@labfranz.com',
    telefono: '+593 2 234 5678',
    direccion: 'Av. Principal 123, Quito, Ecuador',
    horaInicio: '08:00',
    horaFin: '18:00',
    duracionSlot: 30,
    capacidadDefecto: 5,
  })

  const [stats, setStats] = useState<SystemStats>({
    totalUsuarios: 0,
    totalCitas: 0,
    totalExamenes: 0,
    totalResultados: 0,
  })

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [tempConfig, setTempConfig] = useState<LabConfig>(config)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Load configuration from localStorage
    const savedConfig = localStorage.getItem('labConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        setTempConfig(parsed)
      } catch (e) {
        console.error('Error loading config:', e)
      }
    }

    // Load system stats (mock data for now - could be replaced with API calls)
    loadSystemStats()
  }, [])

  const loadSystemStats = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          totalUsuarios: data.users.total,
          totalCitas: data.appointments.total,
          totalExamenes: data.exams.total,
          totalResultados: data.results.pending + data.appointments.completed,
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSaveSection = (section: string) => {
    setIsLoading(true)
    try {
      // Validaciones según la sección

      if (section === 'general') {
        // Validar nombre (mínimo 3 caracteres)
        if (tempConfig.nombre.trim().length < 3) {
          setMessage({ type: 'error', text: '❌ El nombre del laboratorio debe tener al menos 3 caracteres.' })
          setIsLoading(false)
          return
        }

        // Validar email
        if (!validateEmail(tempConfig.email)) {
          setMessage({ type: 'error', text: '❌ El email ingresado no es válido.' })
          setIsLoading(false)
          return
        }

        // Validar teléfono
        if (!validatePhoneEcuador(tempConfig.telefono)) {
          setMessage({
            type: 'error',
            text: '❌ El teléfono debe ser un número ecuatoriano válido (Ej: 0999999999 o +593999999999)'
          })
          setIsLoading(false)
          return
        }

        // Validar dirección (mínimo 10 caracteres)
        if (tempConfig.direccion.trim().length < 10) {
          setMessage({ type: 'error', text: '❌ La dirección debe tener al menos 10 caracteres.' })
          setIsLoading(false)
          return
        }
      }

      if (section === 'appointments') {
        // Validar rango de horas (horaInicio < horaFin)
        if (!validateTimeRange(tempConfig.horaInicio, tempConfig.horaFin)) {
          setMessage({
            type: 'error',
            text: `❌ La hora de inicio (${tempConfig.horaInicio}) debe ser menor que la hora de fin (${tempConfig.horaFin}).`
          })
          setIsLoading(false)
          return
        }

        // Validar duración de slot (15, 30, 45, 60)
        const slotsValidos = [15, 30, 45, 60]
        if (!slotsValidos.includes(tempConfig.duracionSlot)) {
          setMessage({
            type: 'error',
            text: '❌ La duración del slot debe ser 15, 30, 45 o 60 minutos.'
          })
          setIsLoading(false)
          return
        }

        // Validar capacidad por defecto (1-20)
        if (tempConfig.capacidadDefecto < 1 || tempConfig.capacidadDefecto > 20) {
          setMessage({
            type: 'error',
            text: '❌ La capacidad por defecto debe estar entre 1 y 20 cupos.'
          })
          setIsLoading(false)
          return
        }
      }

      // Save to localStorage
      localStorage.setItem('labConfig', JSON.stringify(tempConfig))
      setConfig(tempConfig)
      setEditingSection(null)
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' })

      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setTempConfig(config)
    setEditingSection(null)
  }

  const handleEdit = (section: string) => {
    setEditingSection(section)
    setTempConfig(config)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Configuración del Sistema</h1>
        <p className="text-lab-neutral-600 mt-1">Ajustes y configuración general del laboratorio</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
            : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-lab-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-lab-neutral-900">Configuración General</h2>
                <p className="text-sm text-lab-neutral-600">Datos básicos del laboratorio</p>
              </div>
            </div>
          </div>

          {editingSection === 'general' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Laboratorio</Label>
                <Input
                  id="nombre"
                  value={tempConfig.nombre}
                  onChange={(e) => setTempConfig({ ...tempConfig, nombre: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email de Contacto</Label>
                <Input
                  id="email"
                  type="email"
                  value={tempConfig.email}
                  onChange={(e) => setTempConfig({ ...tempConfig, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={tempConfig.telefono}
                  onChange={(e) => setTempConfig({ ...tempConfig, telefono: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={tempConfig.direccion}
                  onChange={(e) => setTempConfig({ ...tempConfig, direccion: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSaveSection('general')} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="py-2">
                <p className="text-xs text-lab-neutral-500">Nombre del Laboratorio</p>
                <p className="text-sm font-medium text-lab-neutral-900">{config.nombre}</p>
              </div>
              <div className="py-2">
                <p className="text-xs text-lab-neutral-500">Email de Contacto</p>
                <p className="text-sm font-medium text-lab-neutral-900">{config.email}</p>
              </div>
              <div className="py-2">
                <p className="text-xs text-lab-neutral-500">Teléfono</p>
                <p className="text-sm font-medium text-lab-neutral-900">{config.telefono}</p>
              </div>
              <div className="py-2">
                <p className="text-xs text-lab-neutral-500">Dirección</p>
                <p className="text-sm font-medium text-lab-neutral-900">{config.direccion}</p>
              </div>
              <Button onClick={() => handleEdit('general')} variant="outline" size="sm" className="w-full mt-2">
                Editar Información
              </Button>
            </div>
          )}
        </div>

        {/* Appointment Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-lab-info-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-lab-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-lab-neutral-900">Gestión de Citas</h2>
                <p className="text-sm text-lab-neutral-600">Horarios y disponibilidad</p>
              </div>
            </div>
          </div>

          {editingSection === 'appointments' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horaInicio">Hora de Inicio</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={tempConfig.horaInicio}
                    onChange={(e) => setTempConfig({ ...tempConfig, horaInicio: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="horaFin">Hora de Fin</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={tempConfig.horaFin}
                    onChange={(e) => setTempConfig({ ...tempConfig, horaFin: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duracionSlot">Duración de Slot (minutos)</Label>
                <Input
                  id="duracionSlot"
                  type="number"
                  min="15"
                  step="15"
                  value={tempConfig.duracionSlot}
                  onChange={(e) => setTempConfig({ ...tempConfig, duracionSlot: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="capacidadDefecto">Capacidad por Defecto</Label>
                <Input
                  id="capacidadDefecto"
                  type="number"
                  min="1"
                  value={tempConfig.capacidadDefecto}
                  onChange={(e) => setTempConfig({ ...tempConfig, capacidadDefecto: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSaveSection('appointments')} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="py-2">
                <p className="text-xs text-lab-neutral-500">Horarios de Atención</p>
                <p className="text-sm font-medium text-lab-neutral-900">{config.horaInicio} - {config.horaFin}</p>
              </div>
              <div className="py-2">
                <p className="text-xs text-lab-neutral-500">Duración de Slots</p>
                <p className="text-sm font-medium text-lab-neutral-900">{config.duracionSlot} minutos</p>
              </div>
              <div className="py-2">
                <p className="text-xs text-lab-neutral-500">Capacidad por Defecto</p>
                <p className="text-sm font-medium text-lab-neutral-900">{config.capacidadDefecto} cupos</p>
              </div>
              <Button onClick={() => handleEdit('appointments')} variant="outline" size="sm" className="w-full mt-2">
                Configurar Horarios
              </Button>
            </div>
          )}
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-lab-secondary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-lab-neutral-900">Notificaciones</h2>
              <p className="text-sm text-lab-neutral-600">Email y mensajes automáticos</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-lab-neutral-50 rounded-lg">
              <span className="text-sm text-lab-neutral-700">Recordatorios de Citas</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lab-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lab-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lab-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lab-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-lab-neutral-50 rounded-lg">
              <span className="text-sm text-lab-neutral-700">Notificaciones de Resultados</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lab-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lab-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lab-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lab-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-lab-neutral-50 rounded-lg">
              <span className="text-sm text-lab-neutral-700">Confirmaciones de Pago</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lab-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lab-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lab-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lab-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-lab-success-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-lab-neutral-900">Configuración de Pagos</h2>
              <p className="text-sm text-lab-neutral-600">Métodos de pago aceptados</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-lab-neutral-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-lab-neutral-700">Efectivo</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lab-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lab-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lab-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lab-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-lab-neutral-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-lab-neutral-700">Tarjeta de Crédito/Débito</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lab-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lab-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lab-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lab-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-lab-neutral-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-lab-neutral-700">Transferencia Bancaria</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lab-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lab-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lab-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lab-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-lab-neutral-900 mb-4">Estadísticas del Sistema</h2>
        {loadingStats ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-lab-primary-50 rounded-lg">
              <p className="text-3xl font-bold text-lab-primary-600">{stats.totalUsuarios}</p>
              <p className="text-sm text-lab-neutral-600 mt-1">Usuarios Registrados</p>
            </div>
            <div className="text-center p-4 bg-lab-info-50 rounded-lg">
              <p className="text-3xl font-bold text-lab-info-600">{stats.totalCitas}</p>
              <p className="text-sm text-lab-neutral-600 mt-1">Citas Totales</p>
            </div>
            <div className="text-center p-4 bg-lab-success-50 rounded-lg">
              <p className="text-3xl font-bold text-lab-success-600">{stats.totalExamenes}</p>
              <p className="text-sm text-lab-neutral-600 mt-1">Exámenes en Catálogo</p>
            </div>
            <div className="text-center p-4 bg-lab-secondary-50 rounded-lg">
              <p className="text-3xl font-bold text-lab-secondary-600">{stats.totalResultados}</p>
              <p className="text-sm text-lab-neutral-600 mt-1">Resultados Procesados</p>
            </div>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-lab-neutral-900 mb-4">Información del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-lab-neutral-500">Versión</p>
            <p className="text-lg font-semibold text-lab-neutral-900">1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-lab-neutral-500">Última Actualización</p>
            <p className="text-lg font-semibold text-lab-neutral-900">2025-11-19</p>
          </div>
          <div>
            <p className="text-sm text-lab-neutral-500">Estado del Sistema</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="w-3 h-3 bg-lab-success-500 rounded-full"></span>
              <p className="text-lg font-semibold text-lab-success-600">Operativo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
