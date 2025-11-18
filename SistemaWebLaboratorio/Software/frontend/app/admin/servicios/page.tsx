'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface Service {
  codigo_servicio: number
  nombre: string
  descripcion: string | null
  activo: boolean
  fecha_creacion: string
}

export default function ServicesManagement() {
  const { accessToken } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/services`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Servicios</h1>
          <p className="text-lab-neutral-600 mt-1">Administra los servicios disponibles para citas</p>
        </div>
        <Button className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Servicio
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.codigo_servicio}
            className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-lab-secondary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-lab-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  service.activo
                    ? 'bg-lab-success-100 text-lab-success-800'
                    : 'bg-lab-neutral-100 text-lab-neutral-800'
                }`}
              >
                {service.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-2">
              {service.nombre}
            </h3>

            <p className="text-sm text-lab-neutral-600 mb-4 line-clamp-2">
              {service.descripcion || 'Sin descripción'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-lab-neutral-200">
              <span className="text-xs text-lab-neutral-500">
                Creado: {new Date(service.fecha_creacion).toLocaleDateString('es-ES')}
              </span>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-lab-neutral-900">No hay servicios</h3>
          <p className="mt-1 text-sm text-lab-neutral-500">Comienza creando un nuevo servicio.</p>
        </div>
      )}
    </div>
  )
}
