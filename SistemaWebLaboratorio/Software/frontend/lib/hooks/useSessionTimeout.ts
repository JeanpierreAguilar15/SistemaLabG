/**
 * Hook para gestión de sesión temporizada por inactividad
 * Implementa AC-12 (Session Termination)
 * Basado en NIST SP 800-53 Rev 5 - Control 8.1
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../store'

interface UseSessionTimeoutOptions {
  /**
   * Tiempo de inactividad en milisegundos antes de cerrar sesión
   * Por defecto: 15 minutos (900000 ms)
   */
  timeout?: number

  /**
   * Tiempo de advertencia antes del cierre en milisegundos
   * Por defecto: 2 minutos (120000 ms)
   */
  warningTime?: number

  /**
   * Callback cuando se muestra la advertencia
   */
  onWarning?: () => void

  /**
   * Callback cuando se cierra la sesión por inactividad
   */
  onTimeout?: () => void

  /**
   * Deshabilitar el timeout (útil para páginas públicas)
   */
  disabled?: boolean
}

/**
 * Hook personalizado para detectar inactividad y cerrar sesión automáticamente
 */
export function useSessionTimeout({
  timeout = 15 * 60 * 1000, // 15 minutos
  warningTime = 2 * 60 * 1000, // 2 minutos
  onWarning,
  onTimeout,
  disabled = false,
}: UseSessionTimeoutOptions = {}) {
  const { isAuthenticated, clearAuth } = useAuthStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isWarning, setIsWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(timeout)

  /**
   * Reinicia el temporizador de inactividad
   */
  const resetTimer = useCallback(() => {
    // Limpiar temporizadores existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    setIsWarning(false)
    setRemainingTime(timeout)

    if (disabled || !isAuthenticated) return

    // Configurar advertencia
    warningTimeoutRef.current = setTimeout(() => {
      setIsWarning(true)
      if (onWarning) onWarning()
    }, timeout - warningTime)

    // Configurar cierre de sesión
    timeoutRef.current = setTimeout(() => {
      setIsWarning(false)
      clearAuth()
      if (onTimeout) onTimeout()
    }, timeout)
  }, [timeout, warningTime, disabled, isAuthenticated, clearAuth, onWarning, onTimeout])

  /**
   * Extiende la sesión (resetea el timer)
   */
  const extendSession = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  /**
   * Cierra la sesión manualmente
   */
  const closeSession = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    setIsWarning(false)
    clearAuth()
    if (onTimeout) onTimeout()
  }, [clearAuth, onTimeout])

  // Eventos que indican actividad del usuario
  useEffect(() => {
    if (disabled || !isAuthenticated) return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Resetear timer en cualquier actividad
    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    // Iniciar timer al montar
    resetTimer()

    // Limpieza
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [disabled, isAuthenticated, resetTimer])

  // Actualizar tiempo restante cada segundo durante la advertencia
  useEffect(() => {
    if (!isWarning) return

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1000
        if (newTime <= 0) {
          clearInterval(interval)
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isWarning])

  return {
    isWarning,
    remainingTime: Math.floor(remainingTime / 1000), // En segundos
    extendSession,
    closeSession,
  }
}
