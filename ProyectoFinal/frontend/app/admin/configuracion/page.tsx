'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

interface ConfiguracionData {
  rateLimit: {
    enabled: boolean
    general: {
      ttl: number
      max: number
      descripcion: string
    }
    login: {
      ttl: number
      max: number
      descripcion: string
    }
  }
  reservas: {
    cancelacionMinHoras: number
    descripcion: string
  }
}

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  // Editable values
  const [rateLimitTtl, setRateLimitTtl] = useState(60)
  const [rateLimitMax, setRateLimitMax] = useState(100)
  const [loginRateLimitTtl, setLoginRateLimitTtl] = useState(300)
  const [loginRateLimitMax, setLoginRateLimitMax] = useState(5)
  const [cancelacionMinHoras, setCancelacionMinHoras] = useState(24)
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true)

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      const data = await api.getConfiguracion()
      setConfig(data)

      // Set form values
      setRateLimitTtl(data.rateLimit.general.ttl)
      setRateLimitMax(data.rateLimit.general.max)
      setLoginRateLimitTtl(data.rateLimit.login.ttl)
      setLoginRateLimitMax(data.rateLimit.login.max)
      setCancelacionMinHoras(data.reservas.cancelacionMinHoras)
      setRateLimitEnabled(data.rateLimit.enabled)
    } catch (error) {
      showToast('Error al cargar la configuracion', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.updateConfiguracion({
        rateLimitTtl,
        rateLimitMax,
        loginRateLimitTtl,
        loginRateLimitMax,
        cancelacionMinHoras,
        enabled: rateLimitEnabled,
      })
      showToast('Configuracion guardada exitosamente', 'success')
      cargarConfiguracion()
    } catch (error) {
      showToast('Error al guardar la configuracion', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando configuracion...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuracion del Sistema</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Rate Limiting */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Rate Limiting
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rateLimitEnabled}
                onChange={(e) => setRateLimitEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Habilitado</span>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* General Rate Limit */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">Limite General</h3>
              <p className="text-sm text-gray-500 mb-4">
                Aplica a todas las solicitudes de la API
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ventana de tiempo (segundos)</label>
                  <input
                    type="number"
                    value={rateLimitTtl}
                    onChange={(e) => setRateLimitTtl(parseInt(e.target.value) || 60)}
                    min={10}
                    max={3600}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max solicitudes</label>
                  <input
                    type="number"
                    value={rateLimitMax}
                    onChange={(e) => setRateLimitMax(parseInt(e.target.value) || 100)}
                    min={10}
                    max={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Resultado: {rateLimitMax} solicitudes por {rateLimitTtl} segundos
              </p>
            </div>

            {/* Login Rate Limit */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">Limite de Login</h3>
              <p className="text-sm text-gray-500 mb-4">
                Protege contra ataques de fuerza bruta
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ventana de tiempo (segundos)</label>
                  <input
                    type="number"
                    value={loginRateLimitTtl}
                    onChange={(e) => setLoginRateLimitTtl(parseInt(e.target.value) || 300)}
                    min={60}
                    max={3600}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max intentos</label>
                  <input
                    type="number"
                    value={loginRateLimitMax}
                    onChange={(e) => setLoginRateLimitMax(parseInt(e.target.value) || 5)}
                    min={3}
                    max={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Resultado: {loginRateLimitMax} intentos por {loginRateLimitTtl / 60} minutos
              </p>
            </div>
          </div>
        </div>

        {/* Politica de Cancelacion */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Politica de Cancelacion
          </h2>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-4">
              Define cuantas horas antes de la reserva se puede cancelar sin penalizacion
            </p>
            <div className="max-w-xs">
              <label className="block text-sm text-gray-600 mb-1">Horas minimas de anticipacion</label>
              <input
                type="number"
                value={cancelacionMinHoras}
                onChange={(e) => setCancelacionMinHoras(parseInt(e.target.value) || 24)}
                min={1}
                max={72}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Los usuarios podran cancelar hasta {cancelacionMinHoras} horas antes de su reserva
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Nota importante</p>
              <p>
                Algunos cambios de configuracion pueden requerir reiniciar el servidor para aplicarse completamente.
                Los cambios de rate limiting en endpoints especificos (login, registro) estan codificados y no son modificables desde aqui.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
