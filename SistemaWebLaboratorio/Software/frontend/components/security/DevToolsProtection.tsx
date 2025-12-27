/**
 * Protección contra inspección de código y herramientas de desarrollo
 * Implementa SA-15(10) (Development Process - Anti-Reverse Engineering)
 * Basado en NIST SP 800-53 Rev 5 - Control 8.28
 *
 * IMPORTANTE: Esta protección dificulta pero NO impide completamente
 * la ingeniería inversa. Es una capa adicional de seguridad por oscuridad.
 */

'use client'

import { useEffect } from 'react'

interface DevToolsProtectionProps {
  /**
   * Habilitar protección (solo en producción por defecto)
   */
  enabled?: boolean
  /**
   * Mostrar alertas al usuario cuando intente usar DevTools
   */
  showAlerts?: boolean
}

export default function DevToolsProtection({
  enabled = process.env.NODE_ENV === 'production',
  showAlerts = true,
}: DevToolsProtectionProps) {
  useEffect(() => {
    if (!enabled) return

    // 1. Deshabilitar clic derecho (contextmenu)
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      if (showAlerts) {
        console.warn('⚠️ Clic derecho deshabilitado por seguridad')
      }
      return false
    }

    // 2. Deshabilitar clic izquierdo en elementos no interactivos
    const disableLeftClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Permitir clic en elementos interactivos (botones, enlaces, inputs, etc.)
      const interactiveElements = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']

      // Permitir si el elemento o su padre es interactivo
      if (
        interactiveElements.includes(target.tagName) ||
        target.closest('button, a, input, textarea, select, label, [role="button"]')
      ) {
        return true // Permitir el click
      }

      // Bloquear clic izquierdo en otros elementos (texto, imágenes, divs, etc.)
      if (e.button === 0) { // 0 = clic izquierdo
        e.preventDefault()
        if (showAlerts && Math.random() < 0.1) { // Alertar solo 10% de las veces para no saturar
          console.warn('⚠️ Selección deshabilitada por seguridad')
        }
        return false
      }
    }

    // 3. Deshabilitar selección de texto
    const disableSelection = (e: Event) => {
      e.preventDefault()
      return false
    }

    // 3. Deshabilitar teclas de desarrollo
    const disableDevKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ Las herramientas de desarrollo están deshabilitadas por seguridad.')
        }
        return false
      }

      // Ctrl+Shift+I (Inspector)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ El inspector está deshabilitado por seguridad.')
        }
        return false
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ La consola está deshabilitada por seguridad.')
        }
        return false
      }

      // Ctrl+Shift+C (Inspector de elementos)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ El inspector está deshabilitado por seguridad.')
        }
        return false
      }

      // Ctrl+U (Ver código fuente)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ Ver código fuente está deshabilitado por seguridad.')
        }
        return false
      }

      // Cmd+Option+I (Mac Inspector)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ El inspector está deshabilitado por seguridad.')
        }
        return false
      }

      // Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ La consola está deshabilitada por seguridad.')
        }
        return false
      }

      // Cmd+Option+C (Mac Inspector de elementos)
      if (e.metaKey && e.altKey && e.key === 'c') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ El inspector está deshabilitado por seguridad.')
        }
        return false
      }

      // Cmd+U (Mac ver código fuente)
      if (e.metaKey && e.key === 'u') {
        e.preventDefault()
        if (showAlerts) {
          alert('⚠️ Ver código fuente está deshabilitado por seguridad.')
        }
        return false
      }

      return true
    }

    // 4. Detector de DevTools abierto (heurística basada en timing)
    let devToolsOpen = false
    const detectDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen && showAlerts) {
          devToolsOpen = true
          console.warn(
            '⚠️ ADVERTENCIA DE SEGURIDAD: Se han detectado herramientas de desarrollo abiertas.\n' +
            'Por políticas de seguridad, esta acción ha sido registrada.\n' +
            'Control SA-15(10) - NIST SP 800-53 Rev 5'
          )
        }
      } else {
        devToolsOpen = false
      }
    }

    // 5. Ofuscar mensajes de consola en producción
    if (process.env.NODE_ENV === 'production') {
      // Sobrescribir métodos de consola (excepto error para debugging crítico)
      const noop = () => {}
      console.log = noop
      console.info = noop
      console.warn = noop
      console.debug = noop
      // Mantener console.error para errores críticos
    }

    // Registrar event listeners
    document.addEventListener('contextmenu', disableContextMenu)
    document.addEventListener('mousedown', disableLeftClick) // Bloquear clic izquierdo
    document.addEventListener('selectstart', disableSelection)
    document.addEventListener('keydown', disableDevKeys)

    // Detector de DevTools (cada 1 segundo)
    const devToolsInterval = setInterval(detectDevTools, 1000)

    // Protección adicional: deshabilitar copy
    const disableCopy = (e: ClipboardEvent) => {
      // Permitir copy en inputs y textareas
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true
      }
      e.preventDefault()
      if (showAlerts) {
        console.warn('⚠️ Copiar contenido está limitado por seguridad')
      }
      return false
    }

    document.addEventListener('copy', disableCopy)

    // Limpieza
    return () => {
      document.removeEventListener('contextmenu', disableContextMenu)
      document.removeEventListener('mousedown', disableLeftClick)
      document.removeEventListener('selectstart', disableSelection)
      document.removeEventListener('keydown', disableDevKeys)
      document.removeEventListener('copy', disableCopy)
      clearInterval(devToolsInterval)
    }
  }, [enabled, showAlerts])

  // Renderizar advertencia visible solo en development
  if (process.env.NODE_ENV === 'development' && enabled) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-500 text-yellow-900 px-4 py-2 rounded-lg shadow-lg text-xs z-50">
        <strong>⚠️ DevTools Protection ENABLED</strong>
        <p className="mt-1">Protección anti-inspección activa (SA-15(10))</p>
      </div>
    )
  }

  return null
}
