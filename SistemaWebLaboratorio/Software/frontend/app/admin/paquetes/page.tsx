'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface Package {
  codigo_paquete: number
  nombre: string
  descripcion: string | null
  precio_paquete: string
  descuento: string
  activo: boolean
  fecha_creacion: string
  _count?: {
    examenes: number
  }
}

export default function PackagesManagement() {
  const { accessToken } = useAuthStore()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/packages`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (error) {
      console.error('Error loading packages:', error)
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
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Paquetes</h1>
          <p className="text-lab-neutral-600 mt-1">Administra los paquetes de exámenes</p>
        </div>
        <Button className="bg-lab-primary-600 hover:bg-lab-primary-700">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Paquete
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.codigo_paquete}
            className="bg-white rounded-xl shadow-sm border border-lab-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-lab-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  pkg.activo
                    ? 'bg-lab-success-100 text-lab-success-800'
                    : 'bg-lab-neutral-100 text-lab-neutral-800'
                }`}
              >
                {pkg.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-lab-neutral-900 mb-2">
              {pkg.nombre}
            </h3>

            <p className="text-sm text-lab-neutral-600 mb-4 line-clamp-2">
              {pkg.descripcion || 'Sin descripción'}
            </p>

            <div className="flex items-center justify-between py-3 border-t border-b border-lab-neutral-200 my-4">
              <div>
                <p className="text-xs text-lab-neutral-500">Precio</p>
                <p className="text-2xl font-bold text-lab-primary-600">
                  ${Number(pkg.precio_paquete).toFixed(2)}
                </p>
              </div>
              {Number(pkg.descuento) > 0 && (
                <div className="text-right">
                  <p className="text-xs text-lab-neutral-500">Descuento</p>
                  <p className="text-lg font-semibold text-lab-success-600">
                    {Number(pkg.descuento).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-lab-neutral-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{pkg._count?.examenes || 0} exámenes</span>
              </div>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-lab-neutral-900">No hay paquetes</h3>
          <p className="mt-1 text-sm text-lab-neutral-500">Comienza creando un nuevo paquete de exámenes.</p>
        </div>
      )}
    </div>
  )
}
