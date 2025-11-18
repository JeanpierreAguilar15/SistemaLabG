'use client'

import { Button } from '@/components/ui/button'

export default function ConfigurationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Configuración del Sistema</h1>
        <p className="text-lab-neutral-600 mt-1">Ajustes y configuración general del laboratorio</p>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center space-x-4 mb-4">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Nombre del Laboratorio</span>
              <Button variant="ghost" size="sm">Editar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Logo e Imágenes</span>
              <Button variant="ghost" size="sm">Editar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Información de Contacto</span>
              <Button variant="ghost" size="sm">Editar</Button>
            </div>
          </div>
        </div>

        {/* Appointment Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6">
          <div className="flex items-center space-x-4 mb-4">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Horarios de Atención</span>
              <Button variant="ghost" size="sm">Configurar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Duración de Slots</span>
              <Button variant="ghost" size="sm">Configurar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Días Festivos</span>
              <Button variant="ghost" size="sm">Gestionar</Button>
            </div>
          </div>
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
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Plantillas de Email</span>
              <Button variant="ghost" size="sm">Editar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Notificaciones SMS</span>
              <Button variant="ghost" size="sm">Configurar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Recordatorios Automáticos</span>
              <Button variant="ghost" size="sm">Configurar</Button>
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
              <p className="text-sm text-lab-neutral-600">Pasarelas y métodos de pago</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Métodos de Pago</span>
              <Button variant="ghost" size="sm">Configurar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Pasarelas de Pago</span>
              <Button variant="ghost" size="sm">Gestionar</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-lab-neutral-700">Políticas de Reembolso</span>
              <Button variant="ghost" size="sm">Editar</Button>
            </div>
          </div>
        </div>
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
            <p className="text-lg font-semibold text-lab-neutral-900">2025-01-18</p>
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
