'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { isAdminAreaRole, isPatientRole } from '@/lib/roles'

const navigation = [
  {
    name: 'Dashboard',
    href: '/portal',
    description: 'Resumen de resultados',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Resultados',
    href: '/portal/resultados',
    description: 'Consulta y descarga',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z',
  },
  {
    name: 'Mi Perfil',
    href: '/portal/perfil',
    description: 'Datos y seguridad',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
]

export default function PortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authHydrated, setAuthHydrated] = useState(false)

  const activeSection = useMemo(
    () => navigation.find((item) => isRouteActive(pathname, item.href))?.name || 'Portal',
    [pathname],
  )

  useEffect(() => {
    setAuthHydrated(useAuthStore.persist.hasHydrated())
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setAuthHydrated(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!authHydrated) return

    if (!isAuthenticated || !user) {
      router.replace('/auth/login')
      return
    }

    if (isAdminAreaRole(user.rol)) {
      router.replace('/admin')
      return
    }

    if (!isPatientRole(user.rol)) {
      clearAuth()
      router.replace('/auth/login')
    }
  }, [authHydrated, clearAuth, isAuthenticated, router, user])

  const handleLogout = () => {
    clearAuth()
    router.replace('/auth/login')
  }

  const isAuthorizedPatient = authHydrated && isAuthenticated && user && isPatientRole(user.rol)

  if (!isAuthorizedPatient) {
    return <PortalLoading />
  }

  return (
    <div className="min-h-screen bg-lab-neutral-50">
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <PortalSidebar
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {sidebarOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 flex">
            <button
              aria-label="Cerrar menu"
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex w-full max-w-xs flex-1 flex-col">
              <PortalSidebar
                pathname={pathname}
                user={user}
                onNavigate={() => setSidebarOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      )}

      <div className="md:pl-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-lab-neutral-200 bg-white/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-lab-neutral-600 hover:bg-lab-neutral-100 hover:text-lab-neutral-900"
              aria-label="Abrir menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-sm font-semibold text-lab-neutral-900">{activeSection}</div>
            <div className="w-10 h-10 rounded-full bg-lab-primary-50 text-lab-primary-700 flex items-center justify-center text-sm font-semibold">
              {getInitials(user.nombres, user.apellidos)}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

function PortalSidebar({
  pathname,
  user,
  onNavigate,
  onLogout,
}: {
  pathname: string
  user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>
  onNavigate?: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-lab-primary-900 pt-5 pb-4 text-white">
      <div className="flex items-center flex-shrink-0 px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-2 text-lab-primary-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5C21.846 17.846 20.953 20 19.172 20H4.828c-1.781 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold">Laboratorio Franz</p>
          </div>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-lab-primary-700 text-white flex items-center justify-center font-semibold">
            {getInitials(user.nombres, user.apellidos)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.nombres} {user.apellidos}</p>
            <p className="truncate text-xs text-lab-primary-200">{user.email}</p>
            <p className="text-xs text-lab-primary-200">Paciente</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = isRouteActive(pathname, item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-lab-primary-800 text-white'
                  : 'text-lab-primary-100 hover:bg-lab-primary-800 hover:text-white'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-lab-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 mt-6">
        <Button
          variant="outline"
          className="w-full justify-start border-lab-primary-700 bg-lab-primary-800 text-white hover:bg-lab-primary-700"
          onClick={onLogout}
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

function PortalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lab-neutral-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-lab-primary-600" />
        <p className="text-sm text-lab-neutral-600">Validando acceso al portal...</p>
      </div>
    </div>
  )
}

function isRouteActive(pathname: string, href: string) {
  if (href === '/portal') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
