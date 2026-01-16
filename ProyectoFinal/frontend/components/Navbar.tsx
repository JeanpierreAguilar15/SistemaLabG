'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface User {
  nombre: string
  apellido: string
  email: string
  rol: string
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const token = api.getToken()
    if (token) {
      api.getPerfil()
        .then(setUser)
        .catch(() => {
          api.clearToken()
          setUser(null)
        })
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    api.logout()
    setUser(null)
    router.push('/')
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-900 ${
      isScrolled ? 'shadow-xl shadow-black/20' : ''
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              SportCenter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/" active={isActive('/')}>
              Inicio
            </NavLink>
            <NavLink href="/canchas" active={isActive('/canchas')}>
              Canchas
            </NavLink>
            {user && (
              <NavLink href="/portal/reservas" active={pathname.startsWith('/portal')}>
                Mis Reservas
              </NavLink>
            )}
            {user?.rol === 'ADMIN' && (
              <NavLink href="/admin" active={pathname.startsWith('/admin')}>
                Admin
              </NavLink>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                    {user.nombre.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {user.nombre}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
                >
                  Salir
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
                >
                  Iniciar Sesion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all duration-200"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            <div className="space-y-2">
              <MobileNavLink href="/" active={isActive('/')} onClick={() => setMobileMenuOpen(false)}>
                Inicio
              </MobileNavLink>
              <MobileNavLink href="/canchas" active={isActive('/canchas')} onClick={() => setMobileMenuOpen(false)}>
                Canchas
              </MobileNavLink>
              {user && (
                <MobileNavLink href="/portal/reservas" active={pathname.startsWith('/portal')} onClick={() => setMobileMenuOpen(false)}>
                  Mis Reservas
                </MobileNavLink>
              )}
              {user?.rol === 'ADMIN' && (
                <MobileNavLink href="/admin" active={pathname.startsWith('/admin')} onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </MobileNavLink>
              )}
              <hr className="border-slate-700" />
              {user ? (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-slate-800"
                >
                  Cerrar Sesion
                </button>
              ) : (
                <>
                  <MobileNavLink href="/auth/login" active={false} onClick={() => setMobileMenuOpen(false)}>
                    Iniciar Sesion
                  </MobileNavLink>
                  <MobileNavLink href="/auth/register" active={false} onClick={() => setMobileMenuOpen(false)}>
                    Registrarse
                  </MobileNavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-600/20 text-blue-400'
          : 'text-slate-300 hover:text-white hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-2 rounded-lg ${
        active
          ? 'bg-blue-600/20 text-blue-400'
          : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  )
}
