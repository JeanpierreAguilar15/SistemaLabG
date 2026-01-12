'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: string
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const token = api.getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    api.getPerfil()
      .then(setUsuario)
      .catch(() => {
        api.logout()
        router.push('/auth/login')
      })
  }, [router])

  const handleLogout = () => {
    api.logout()
    router.push('/auth/login')
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/portal" className="text-xl font-bold text-primary-600">
              Centro Deportivo
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/portal" className="text-gray-600 hover:text-primary-600">
                Inicio
              </Link>
              <Link href="/canchas" className="text-gray-600 hover:text-primary-600">
                Canchas
              </Link>
              <Link href="/portal/reservas" className="text-gray-600 hover:text-primary-600">
                Mis Reservas
              </Link>
              <Link href="/portal/pagos" className="text-gray-600 hover:text-primary-600">
                Mis Pagos
              </Link>
            </nav>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {usuario.nombre.charAt(0)}
                  </span>
                </div>
                <span className="hidden md:inline">{usuario.nombre}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold">{usuario.nombre} {usuario.apellido}</p>
                    <p className="text-sm text-gray-500">{usuario.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-t">
        <div className="flex justify-around py-2">
          <Link href="/portal" className="text-center p-2 text-gray-600">
            <span className="block text-xl">🏠</span>
            <span className="text-xs">Inicio</span>
          </Link>
          <Link href="/canchas" className="text-center p-2 text-gray-600">
            <span className="block text-xl">🏟️</span>
            <span className="text-xs">Canchas</span>
          </Link>
          <Link href="/portal/reservas" className="text-center p-2 text-gray-600">
            <span className="block text-xl">📅</span>
            <span className="text-xs">Reservas</span>
          </Link>
          <Link href="/portal/pagos" className="text-center p-2 text-gray-600">
            <span className="block text-xl">💳</span>
            <span className="text-xs">Pagos</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
