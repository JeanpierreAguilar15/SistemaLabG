'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateEmail, validatePhoneEcuador, validateTimeRange } from '@/lib/utils'
import { systemConfigService, SystemConfig } from '@/lib/services/system-config.service'

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

interface SecurityConfig {
  maxIntentosLogin: number
  tiempoBloqueoMinutos: number
  jwtAccessExpiration: string
  jwtRefreshExpiration: string
  bcryptSaltRounds: number
}

interface InventoryConfig {
  stockMinimoAlerta: number
  diasVencimientoAlerta: number
}

interface PaymentConfig {
  cotizacionDiasVigencia: number
  cotizacionMaxExamenes: number
  descuentoMaximo: number
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
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([])

  // Security Configuration
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    maxIntentosLogin: 5,
    tiempoBloqueoMinutos: 30,
    jwtAccessExpiration: '15m',
    jwtRefreshExpiration: '7d',
    bcryptSaltRounds: 10,
  })
  const [tempSecurityConfig, setTempSecurityConfig] = useState<SecurityConfig>(securityConfig)

  // Inventory Configuration
  const [inventoryConfig, setInventoryConfig] = useState<InventoryConfig>({
    stockMinimoAlerta: 10,
    diasVencimientoAlerta: 30,
  })
  const [tempInventoryConfig, setTempInventoryConfig] = useState<InventoryConfig>(inventoryConfig)

  // Payment Configuration
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    cotizacionDiasVigencia: 30,
    cotizacionMaxExamenes: 50,
    descuentoMaximo: 50,
  })
  const [tempPaymentConfig, setTempPaymentConfig] = useState<PaymentConfig>(paymentConfig)

  useEffect(() => {
    loadConfigurations()
    loadSystemStats()
  }, [])

  const loadConfigurations = async () => {
    try {
      const configs = await systemConfigService.getAll()
      setSystemConfigs(configs)

      // Map backend configs to local state if they exist
      const newConfig = { ...config }
      const newSecurityConfig = { ...securityConfig }
      const newInventoryConfig = { ...inventoryConfig }
      const newPaymentConfig = { ...paymentConfig }

      configs.forEach(c => {
        // General configs
        if (c.clave === 'LAB_NOMBRE' || c.clave === 'SISTEMA_NOMBRE') newConfig.nombre = c.valor
        if (c.clave === 'LAB_EMAIL' || c.clave === 'SISTEMA_EMAIL_CONTACTO') newConfig.email = c.valor
        if (c.clave === 'LAB_TELEFONO' || c.clave === 'SISTEMA_TELEFONO_CONTACTO') newConfig.telefono = c.valor
        if (c.clave === 'LAB_DIRECCION') newConfig.direccion = c.valor
        if (c.clave === 'AGENDA_HORA_INICIO') newConfig.horaInicio = c.valor
        if (c.clave === 'AGENDA_HORA_FIN') newConfig.horaFin = c.valor
        if (c.clave === 'AGENDA_DURACION_SLOT' || c.clave === 'AGENDA_TIEMPO_MINIMO_SLOT_MINUTOS') newConfig.duracionSlot = Number(c.valor)
        if (c.clave === 'AGENDA_CAPACIDAD_DEFECTO') newConfig.capacidadDefecto = Number(c.valor)

        // Security configs
        if (c.clave === 'AUTH_MAX_INTENTOS_LOGIN') newSecurityConfig.maxIntentosLogin = Number(c.valor)
        if (c.clave === 'AUTH_TIEMPO_BLOQUEO_MINUTOS') newSecurityConfig.tiempoBloqueoMinutos = Number(c.valor)
        if (c.clave === 'AUTH_JWT_ACCESS_EXPIRATION') newSecurityConfig.jwtAccessExpiration = c.valor
        if (c.clave === 'AUTH_JWT_REFRESH_EXPIRATION') newSecurityConfig.jwtRefreshExpiration = c.valor
        if (c.clave === 'AUTH_BCRYPT_SALT_ROUNDS') newSecurityConfig.bcryptSaltRounds = Number(c.valor)

        // Inventory configs
        if (c.clave === 'INVENTARIO_STOCK_MINIMO_ALERTA') newInventoryConfig.stockMinimoAlerta = Number(c.valor)
        if (c.clave === 'INVENTARIO_DIAS_VENCIMIENTO_ALERTA') newInventoryConfig.diasVencimientoAlerta = Number(c.valor)

        // Payment configs
        if (c.clave === 'COTIZACION_DIAS_VIGENCIA') newPaymentConfig.cotizacionDiasVigencia = Number(c.valor)
        if (c.clave === 'COTIZACION_MAX_EXAMENES') newPaymentConfig.cotizacionMaxExamenes = Number(c.valor)
        if (c.clave === 'PAGOS_DESCUENTO_MAXIMO') newPaymentConfig.descuentoMaximo = Number(c.valor)
      })

      setConfig(newConfig)
      setTempConfig(newConfig)
      setSecurityConfig(newSecurityConfig)
      setTempSecurityConfig(newSecurityConfig)
      setInventoryConfig(newInventoryConfig)
      setTempInventoryConfig(newInventoryConfig)
      setPaymentConfig(newPaymentConfig)
      setTempPaymentConfig(newPaymentConfig)
    } catch (error) {
      console.error('Error loading configurations:', error)
    }
  }

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

  const updateConfigValue = async (key: string, value: string, group: string, type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING', isPublic: boolean = false) => {
    const existing = systemConfigs.find(c => c.clave === key)
    if (existing) {
      await systemConfigService.update(existing.codigo_config, { valor: value })
    } else {
      await systemConfigService.create({
        clave: key,
        valor: value,
        grupo: group,
        tipo_dato: type,
        es_publico: isPublic
      })
    }
  }

  const handleSaveSection = async (section: string) => {
    setIsLoading(true)
    try {
      if (section === 'general') {
        if (tempConfig.nombre.trim().length < 3) throw new Error('El nombre debe tener al menos 3 caracteres')
        if (!validateEmail(tempConfig.email)) throw new Error('Email inválido')
        if (!validatePhoneEcuador(tempConfig.telefono)) throw new Error('Teléfono inválido')
        if (tempConfig.direccion.trim().length < 10) throw new Error('Dirección muy corta')

        await Promise.all([
          updateConfigValue('LAB_NOMBRE', tempConfig.nombre, 'GENERAL', 'STRING', true),
          updateConfigValue('LAB_EMAIL', tempConfig.email, 'GENERAL', 'STRING', true),
          updateConfigValue('LAB_TELEFONO', tempConfig.telefono, 'GENERAL', 'STRING', true),
          updateConfigValue('LAB_DIRECCION', tempConfig.direccion, 'GENERAL', 'STRING', true),
        ])
      }

      if (section === 'appointments') {
        if (!validateTimeRange(tempConfig.horaInicio, tempConfig.horaFin)) throw new Error('Rango de horas inválido')
        if (![15, 30, 45, 60].includes(tempConfig.duracionSlot)) throw new Error('Duración de slot inválida')
        if (tempConfig.capacidadDefecto < 1 || tempConfig.capacidadDefecto > 20) throw new Error('Capacidad inválida')

        await Promise.all([
          updateConfigValue('AGENDA_HORA_INICIO', tempConfig.horaInicio, 'AGENDA', 'STRING', true),
          updateConfigValue('AGENDA_HORA_FIN', tempConfig.horaFin, 'AGENDA', 'STRING', true),
          updateConfigValue('AGENDA_DURACION_SLOT', tempConfig.duracionSlot.toString(), 'AGENDA', 'NUMBER', true),
          updateConfigValue('AGENDA_CAPACIDAD_DEFECTO', tempConfig.capacidadDefecto.toString(), 'AGENDA', 'NUMBER', true),
        ])
      }

      if (section === 'security') {
        if (tempSecurityConfig.maxIntentosLogin < 1 || tempSecurityConfig.maxIntentosLogin > 10) throw new Error('Intentos de login debe estar entre 1 y 10')
        if (tempSecurityConfig.tiempoBloqueoMinutos < 5 || tempSecurityConfig.tiempoBloqueoMinutos > 1440) throw new Error('Tiempo de bloqueo debe estar entre 5 y 1440 minutos')
        if (tempSecurityConfig.bcryptSaltRounds < 8 || tempSecurityConfig.bcryptSaltRounds > 14) throw new Error('Salt rounds debe estar entre 8 y 14')

        await Promise.all([
          updateConfigValue('AUTH_MAX_INTENTOS_LOGIN', tempSecurityConfig.maxIntentosLogin.toString(), 'AUTENTICACION', 'NUMBER', false),
          updateConfigValue('AUTH_TIEMPO_BLOQUEO_MINUTOS', tempSecurityConfig.tiempoBloqueoMinutos.toString(), 'AUTENTICACION', 'NUMBER', false),
          updateConfigValue('AUTH_JWT_ACCESS_EXPIRATION', tempSecurityConfig.jwtAccessExpiration, 'AUTENTICACION', 'STRING', false),
          updateConfigValue('AUTH_JWT_REFRESH_EXPIRATION', tempSecurityConfig.jwtRefreshExpiration, 'AUTENTICACION', 'STRING', false),
          updateConfigValue('AUTH_BCRYPT_SALT_ROUNDS', tempSecurityConfig.bcryptSaltRounds.toString(), 'AUTENTICACION', 'NUMBER', false),
        ])
        setSecurityConfig(tempSecurityConfig)
      }

      if (section === 'inventory') {
        if (tempInventoryConfig.stockMinimoAlerta < 1) throw new Error('Stock mínimo debe ser mayor a 0')
        if (tempInventoryConfig.diasVencimientoAlerta < 1) throw new Error('Días de alerta debe ser mayor a 0')

        await Promise.all([
          updateConfigValue('INVENTARIO_STOCK_MINIMO_ALERTA', tempInventoryConfig.stockMinimoAlerta.toString(), 'INVENTARIO', 'NUMBER', false),
          updateConfigValue('INVENTARIO_DIAS_VENCIMIENTO_ALERTA', tempInventoryConfig.diasVencimientoAlerta.toString(), 'INVENTARIO', 'NUMBER', false),
        ])
        setInventoryConfig(tempInventoryConfig)
      }

      if (section === 'payment') {
        if (tempPaymentConfig.cotizacionDiasVigencia < 1) throw new Error('Días de vigencia debe ser mayor a 0')
        if (tempPaymentConfig.cotizacionMaxExamenes < 1) throw new Error('Máximo de exámenes debe ser mayor a 0')
        if (tempPaymentConfig.descuentoMaximo < 0 || tempPaymentConfig.descuentoMaximo > 100) throw new Error('Descuento máximo debe estar entre 0 y 100')

        await Promise.all([
          updateConfigValue('COTIZACION_DIAS_VIGENCIA', tempPaymentConfig.cotizacionDiasVigencia.toString(), 'PAGOS', 'NUMBER', true),
          updateConfigValue('COTIZACION_MAX_EXAMENES', tempPaymentConfig.cotizacionMaxExamenes.toString(), 'PAGOS', 'NUMBER', false),
          updateConfigValue('PAGOS_DESCUENTO_MAXIMO', tempPaymentConfig.descuentoMaximo.toString(), 'PAGOS', 'NUMBER', false),
        ])
        setPaymentConfig(tempPaymentConfig)
      }

      setConfig(tempConfig)
      setEditingSection(null)
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' })
      await loadConfigurations() // Reload to get updated IDs if created

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar la configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setTempConfig(config)
    setTempSecurityConfig(securityConfig)
    setTempInventoryConfig(inventoryConfig)
    setTempPaymentConfig(paymentConfig)
    setEditingSection(null)
  }

  const handleEdit = (section: string) => {
    setEditingSection(section)
    setTempConfig(config)
    setTempSecurityConfig(securityConfig)
    setTempInventoryConfig(inventoryConfig)
    setTempPaymentConfig(paymentConfig)
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
        <div className={`p-4 rounded-lg ${message.type === 'success'
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

      {/* Advanced Configuration Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-lab-neutral-900 mb-4">Configuración Avanzada</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-lab-danger-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-lab-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-lab-neutral-900">Seguridad y Autenticación</h2>
                  <p className="text-sm text-lab-neutral-600">Configuración de login y sesiones</p>
                </div>
              </div>
            </div>

            {editingSection === 'security' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxIntentos">Máximo intentos de login</Label>
                  <Input
                    id="maxIntentos"
                    type="number"
                    min={1}
                    max={10}
                    value={tempSecurityConfig.maxIntentosLogin}
                    onChange={(e) => setTempSecurityConfig({ ...tempSecurityConfig, maxIntentosLogin: Number(e.target.value) })}
                    className="mt-1"
                  />
                  <p className="text-xs text-lab-neutral-500 mt-1">Intentos antes de bloquear cuenta (1-10)</p>
                </div>
                <div>
                  <Label htmlFor="tiempoBloqueo">Tiempo de bloqueo (minutos)</Label>
                  <Input
                    id="tiempoBloqueo"
                    type="number"
                    min={5}
                    max={1440}
                    value={tempSecurityConfig.tiempoBloqueoMinutos}
                    onChange={(e) => setTempSecurityConfig({ ...tempSecurityConfig, tiempoBloqueoMinutos: Number(e.target.value) })}
                    className="mt-1"
                  />
                  <p className="text-xs text-lab-neutral-500 mt-1">Tiempo que la cuenta permanece bloqueada</p>
                </div>
                <div>
                  <Label htmlFor="jwtAccess">Expiración token de acceso</Label>
                  <select
                    id="jwtAccess"
                    value={tempSecurityConfig.jwtAccessExpiration}
                    onChange={(e) => setTempSecurityConfig({ ...tempSecurityConfig, jwtAccessExpiration: e.target.value })}
                    className="mt-1 w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                  >
                    <option value="5m">5 minutos</option>
                    <option value="15m">15 minutos</option>
                    <option value="30m">30 minutos</option>
                    <option value="1h">1 hora</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="jwtRefresh">Expiración token de refresco</Label>
                  <select
                    id="jwtRefresh"
                    value={tempSecurityConfig.jwtRefreshExpiration}
                    onChange={(e) => setTempSecurityConfig({ ...tempSecurityConfig, jwtRefreshExpiration: e.target.value })}
                    className="mt-1 w-full rounded-md border border-lab-neutral-300 px-3 py-2"
                  >
                    <option value="1d">1 día</option>
                    <option value="7d">7 días</option>
                    <option value="14d">14 días</option>
                    <option value="30d">30 días</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveSection('security')} disabled={isLoading} className="flex-1">
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
                  <p className="text-xs text-lab-neutral-500">Máximo intentos de login</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{securityConfig.maxIntentosLogin} intentos</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-lab-neutral-500">Tiempo de bloqueo</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{securityConfig.tiempoBloqueoMinutos} minutos</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-lab-neutral-500">Expiración token de acceso</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{securityConfig.jwtAccessExpiration}</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-lab-neutral-500">Expiración token de refresco</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{securityConfig.jwtRefreshExpiration}</p>
                </div>
                <Button onClick={() => handleEdit('security')} variant="outline" size="sm" className="w-full mt-2">
                  Editar Seguridad
                </Button>
              </div>
            )}
          </div>

          {/* Inventory Alert Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-lab-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-lab-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-lab-neutral-900">Alertas de Inventario</h2>
                  <p className="text-sm text-lab-neutral-600">Configuración de alertas de stock</p>
                </div>
              </div>
            </div>

            {editingSection === 'inventory' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stockMinimo">Stock mínimo para alerta</Label>
                  <Input
                    id="stockMinimo"
                    type="number"
                    min={1}
                    value={tempInventoryConfig.stockMinimoAlerta}
                    onChange={(e) => setTempInventoryConfig({ ...tempInventoryConfig, stockMinimoAlerta: Number(e.target.value) })}
                    className="mt-1"
                  />
                  <p className="text-xs text-lab-neutral-500 mt-1">Se genera alerta cuando el stock baja de este nivel</p>
                </div>
                <div>
                  <Label htmlFor="diasVencimiento">Días antes del vencimiento para alertar</Label>
                  <Input
                    id="diasVencimiento"
                    type="number"
                    min={1}
                    value={tempInventoryConfig.diasVencimientoAlerta}
                    onChange={(e) => setTempInventoryConfig({ ...tempInventoryConfig, diasVencimientoAlerta: Number(e.target.value) })}
                    className="mt-1"
                  />
                  <p className="text-xs text-lab-neutral-500 mt-1">Días de anticipación para alertas de vencimiento</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveSection('inventory')} disabled={isLoading} className="flex-1">
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
                  <p className="text-xs text-lab-neutral-500">Stock mínimo para alerta</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{inventoryConfig.stockMinimoAlerta} unidades</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-lab-neutral-500">Días antes del vencimiento</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{inventoryConfig.diasVencimientoAlerta} días</p>
                </div>
                <Button onClick={() => handleEdit('inventory')} variant="outline" size="sm" className="w-full mt-2">
                  Editar Alertas
                </Button>
              </div>
            )}
          </div>

          {/* Advanced Payment Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-lab-info-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-lab-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-lab-neutral-900">Cotizaciones y Pagos</h2>
                  <p className="text-sm text-lab-neutral-600">Límites y vigencias</p>
                </div>
              </div>
            </div>

            {editingSection === 'payment' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="diasVigencia">Días de vigencia de cotización</Label>
                  <Input
                    id="diasVigencia"
                    type="number"
                    min={1}
                    max={90}
                    value={tempPaymentConfig.cotizacionDiasVigencia}
                    onChange={(e) => setTempPaymentConfig({ ...tempPaymentConfig, cotizacionDiasVigencia: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxExamenes">Máximo de exámenes por cotización</Label>
                  <Input
                    id="maxExamenes"
                    type="number"
                    min={1}
                    max={100}
                    value={tempPaymentConfig.cotizacionMaxExamenes}
                    onChange={(e) => setTempPaymentConfig({ ...tempPaymentConfig, cotizacionMaxExamenes: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="descuentoMax">Descuento máximo permitido (%)</Label>
                  <Input
                    id="descuentoMax"
                    type="number"
                    min={0}
                    max={100}
                    value={tempPaymentConfig.descuentoMaximo}
                    onChange={(e) => setTempPaymentConfig({ ...tempPaymentConfig, descuentoMaximo: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveSection('payment')} disabled={isLoading} className="flex-1">
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
                  <p className="text-xs text-lab-neutral-500">Días de vigencia</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{paymentConfig.cotizacionDiasVigencia} días</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-lab-neutral-500">Máximo exámenes por cotización</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{paymentConfig.cotizacionMaxExamenes} exámenes</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-lab-neutral-500">Descuento máximo</p>
                  <p className="text-sm font-medium text-lab-neutral-900">{paymentConfig.descuentoMaximo}%</p>
                </div>
                <Button onClick={() => handleEdit('payment')} variant="outline" size="sm" className="w-full mt-2">
                  Editar Configuración
                </Button>
              </div>
            )}
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
