'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: string
}

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/reservas', label: 'Reservas', icon: '📅' },
  { href: '/admin/canchas', label: 'Canchas', icon: '🏟️' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = api.getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    api.getPerfil()
      .then((user) => {
        if (user.rol !== 'ADMIN') {
          router.push('/portal')
          return
        }
        setUsuario(user)
      })
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
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
          <span className="text-xl font-bold text-white">Admin Panel</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white ${
                pathname === item.href ? 'bg-gray-700 text-white border-l-4 border-primary-500' : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <div className="flex items-center text-gray-300 mb-4">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
              {usuario.nombre.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-white">{usuario.nombre}</p>
              <p className="text-xs text-gray-400">{usuario.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-400 hover:text-red-300 text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-600 hover:text-gray-800 mr-4"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Centro Deportivo</h1>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
