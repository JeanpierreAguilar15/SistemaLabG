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
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-800/95 backdrop-blur-sm ${
      isScrolled ? 'shadow-lg shadow-black/10' : ''
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
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                    {user.nombre.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {user.nombre}
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                      <div className="p-4 border-b bg-slate-50">
                        <p className="font-semibold text-slate-800">{user.nombre} {user.apellido}</p>
                        <p className="text-sm text-slate-500 truncate" title={user.email}>{user.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/portal/reservas"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Mis Reservas
                        </Link>
                        {user.rol === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Panel Admin
                          </Link>
                        )}
                      </div>
                      <div className="p-2 border-t">
                        <button
                          onClick={() => { handleLogout(); setUserMenuOpen(false) }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Cerrar Sesion
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
