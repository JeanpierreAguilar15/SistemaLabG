/**
 * Proveedor de sesión temporizada con advertencia visual
 * Implementa AC-12 (Session Termination)
 * Cierra automáticamente la sesión tras inactividad definida
 */

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSessionTimeout } from '@/lib/hooks/useSessionTimeout'
import { useAuthStore } from '@/lib/store'

interface SessionTimeoutProviderProps {
  children: React.ReactNode
  /**
   * Tiempo de inactividad en minutos antes de cerrar sesión
   * Por defecto: 15 minutos
   */
  timeoutMinutes?: number
  /**
   * Tiempo de advertencia en minutos antes del cierre
   * Por defecto: 2 minutos
   */
  warningMinutes?: number
  /**
   * Deshabilitar en páginas públicas
   */
  disabled?: boolean
}

export default function SessionTimeoutProvider({
  children,
  timeoutMinutes = 15,
  warningMinutes = 2,
  disabled = false,
}: SessionTimeoutProviderProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)

  const { isWarning, remainingTime, extendSession, closeSession } = useSessionTimeout({
    timeout: timeoutMinutes * 60 * 1000,
    warningTime: warningMinutes * 60 * 1000,
    disabled: disabled || !isAuthenticated,
    onWarning: () => setShowWarning(true),
    onTimeout: () => {
      setShowWarning(false)
      router.push('/auth/login')
    },
  })

  useEffect(() => {
    setShowWarning(isWarning)
  }, [isWarning])

  const handleExtend = () => {
    setShowWarning(false)
    extendSession()
  }

  const handleLogout = () => {
    setShowWarning(false)
    closeSession()
    router.push('/auth/login')
  }

  return (
    <>
      {children}

      {/* Modal de advertencia de sesión */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative z-50 bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-lab-warning-500">
            {/* Icono de advertencia */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-lab-warning-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-lab-warning-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-center text-lab-neutral-900 mb-2">
              Sesión por Expirar
            </h3>

            {/* Mensaje */}
            <p className="text-center text-lab-neutral-600 mb-4">
              Su sesión está por expirar debido a inactividad.
            </p>

            {/* Temporizador */}
            <div className="bg-lab-neutral-100 rounded-lg p-4 mb-6">
              <p className="text-center text-sm text-lab-neutral-600 mb-2">
                Tiempo restante:
              </p>
              <div className="text-center">
                <span className="text-4xl font-bold text-lab-danger-600">
                  {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                </span>
                <span className="text-sm text-lab-neutral-500 ml-2">minutos</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExtend}
                className="flex-1 bg-lab-success-600 hover:bg-lab-success-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Continuar Sesión
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-lab-neutral-300 hover:bg-lab-neutral-400 text-lab-neutral-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>

            {/* Información adicional */}
            <p className="text-xs text-center text-lab-neutral-500 mt-4">
              Por seguridad, cerramos automáticamente las sesiones inactivas.
              <br />
              Normativa: AC-12 (NIST SP 800-53 Rev 5)
            </p>
          </div>
        </div>
      )}
    </>
  )
}
