/**
 * Proveedor centralizado de medidas de seguridad del cliente
 * Agrupa todas las protecciones de seguridad según normativa ISO/IEC 27002:2022
 * y NIST SP 800-53 Rev 5
 */

'use client'

import { usePathname } from 'next/navigation'
import SessionTimeoutProvider from './SessionTimeoutProvider'
import DevToolsProtection from './DevToolsProtection'

interface SecurityProvidersProps {
  children: React.ReactNode
}

export default function SecurityProviders({ children }: SecurityProvidersProps) {
  const pathname = usePathname()

  // Rutas públicas donde NO se aplica el timeout de sesión
  const publicRoutes = ['/auth/login', '/auth/register', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  return (
    <>
      {/* SA-15(10): Protección anti-inspección y anti-DevTools */}
      <DevToolsProtection
        enabled={process.env.NODE_ENV === 'production'}
        showAlerts={true}
      />

      {/* AC-12: Sesión temporizada con advertencia */}
      <SessionTimeoutProvider
        timeoutMinutes={15} // 15 minutos de inactividad
        warningMinutes={2}  // Advertir 2 minutos antes
        disabled={isPublicRoute}
      >
        {children}
      </SessionTimeoutProvider>
    </>
  )
}
