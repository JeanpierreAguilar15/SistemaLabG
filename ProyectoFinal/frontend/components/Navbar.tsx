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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg'
        : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isScrolled
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg'
                : 'bg-white/20 group-hover:bg-white/30'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`text-xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-gray-800' : 'text-white'
            }`}>
              SportCenter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/" active={isActive('/')} scrolled={isScrolled}>
              Inicio
            </NavLink>
            <NavLink href="/canchas" active={isActive('/canchas')} scrolled={isScrolled}>
              Canchas
            </NavLink>
            {user && (
              <NavLink href="/portal/reservas" active={pathname.startsWith('/portal')} scrolled={isScrolled}>
                Mis Reservas
              </NavLink>
            )}
            {user?.rol === 'ADMIN' && (
              <NavLink href="/admin" active={pathname.startsWith('/admin')} scrolled={isScrolled}>
                Admin
              </NavLink>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors ${
                  isScrolled ? 'bg-gray-100' : 'bg-white/10'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isScrolled
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      : 'bg-white text-blue-600'
                  }`}>
                    {user.nombre.charAt(0)}
                  </div>
                  <span className={`text-sm font-medium ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                    {user.nombre}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isScrolled
                      ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Salir
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isScrolled
                      ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Iniciar Sesion
                </Link>
                <Link
                  href="/auth/register"
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    isScrolled
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-white text-blue-600 hover:bg-gray-100 hover:shadow-lg'
                  }`}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            }`}
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
          <div className={`md:hidden py-4 border-t ${isScrolled ? 'border-gray-200' : 'border-white/20'}`}>
            <div className="space-y-2">
              <MobileNavLink href="/" active={isActive('/')} scrolled={isScrolled} onClick={() => setMobileMenuOpen(false)}>
                Inicio
              </MobileNavLink>
              <MobileNavLink href="/canchas" active={isActive('/canchas')} scrolled={isScrolled} onClick={() => setMobileMenuOpen(false)}>
                Canchas
              </MobileNavLink>
              {user && (
                <MobileNavLink href="/portal/reservas" active={pathname.startsWith('/portal')} scrolled={isScrolled} onClick={() => setMobileMenuOpen(false)}>
                  Mis Reservas
                </MobileNavLink>
              )}
              {user?.rol === 'ADMIN' && (
                <MobileNavLink href="/admin" active={pathname.startsWith('/admin')} scrolled={isScrolled} onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </MobileNavLink>
              )}
              <hr className={isScrolled ? 'border-gray-200' : 'border-white/20'} />
              {user ? (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    isScrolled ? 'text-red-600 hover:bg-red-50' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Cerrar Sesion
                </button>
              ) : (
                <>
                  <MobileNavLink href="/auth/login" active={false} scrolled={isScrolled} onClick={() => setMobileMenuOpen(false)}>
                    Iniciar Sesion
                  </MobileNavLink>
                  <MobileNavLink href="/auth/register" active={false} scrolled={isScrolled} onClick={() => setMobileMenuOpen(false)}>
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

function NavLink({ href, active, scrolled, children }: { href: string; active: boolean; scrolled: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? scrolled
            ? 'bg-blue-50 text-blue-600'
            : 'bg-white/20 text-white'
          : scrolled
            ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, active, scrolled, onClick, children }: { href: string; active: boolean; scrolled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-2 rounded-lg ${
        active
          ? scrolled
            ? 'bg-blue-50 text-blue-600'
            : 'bg-white/20 text-white'
          : scrolled
            ? 'text-gray-700 hover:bg-gray-100'
            : 'text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  )
}
