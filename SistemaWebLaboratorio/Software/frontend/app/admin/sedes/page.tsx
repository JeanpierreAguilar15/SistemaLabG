'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface Location {
  codigo_sede: number
  nombre: string
  direccion: string
  telefono: string | null
  email: string | null
  activo: boolean
}

export default function LocationsManagement() {
  const { accessToken } = useAuthStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/locations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
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
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Sedes</h1>
          <p className="text-lab-neutral-600 mt-1">Administra las ubicaciones del laboratorio</p>
        </div>
        <Button className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Sede
        </Button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((location) => (
          <div
            key={location.codigo_sede}
            className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-lab-info-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-lab-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-lab-neutral-900">{location.nombre}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        location.activo
                          ? 'bg-lab-success-100 text-lab-success-800'
                          : 'bg-lab-neutral-100 text-lab-neutral-800'
                      }`}
                    >
                      {location.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-lab-neutral-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-lab-neutral-600">{location.direccion}</p>
              </div>

              {location.telefono && (
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p className="text-sm text-lab-neutral-600">{location.telefono}</p>
                </div>
              )}

              {location.email && (
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-lab-neutral-600">{location.email}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-4 mt-4 border-t border-lab-neutral-200">
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-lab-neutral-900">No hay sedes registradas</h3>
          <p className="mt-1 text-sm text-lab-neutral-500">Comienza creando una nueva sede.</p>
        </div>
      )}
    </div>
  )
}
