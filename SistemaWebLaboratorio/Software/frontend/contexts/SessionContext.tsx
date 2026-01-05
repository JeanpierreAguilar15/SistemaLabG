'use client';

/**
 * SessionContext - Control de Sesion Temporizada por Inactividad
 *
 * Implementa ISO/IEC 27002:2022 Control 8.1 (Dispositivos de usuario final)
 * y NIST SP 800-53 AC-12 (Session Termination)
 *
 * Caracteristicas:
 * - Cierre automatico de sesion tras inactividad
 * - Modal de advertencia antes de cerrar
 * - Tiempo configurable por administrador
 * - Sliding expiration (reinicio con actividad)
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

// Configuracion por defecto (en minutos)
// NOTA: Para pruebas usar 0.5 (30 seg), en produccion usar 15 minutos
const DEFAULT_SESSION_TIMEOUT = 0.5; // 30 segundos para pruebas (cambiar a 15 en produccion)
const WARNING_BEFORE_TIMEOUT = 0.25; // Mostrar advertencia 15 segundos antes

interface SessionContextType {
  sessionTimeout: number;
  setSessionTimeout: (minutes: number) => void;
  remainingTime: number;
  isWarningOpen: boolean;
  resetTimer: () => void;
  extendSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, clearAuth, user } = useAuthStore();

  // Obtener timeout de configuracion o usar default
  const getTimeoutDuration = useCallback(() => {
    if (typeof window === 'undefined') return DEFAULT_SESSION_TIMEOUT * 60 * 1000;
    const savedTimeout = localStorage.getItem('sessionTimeout');
    return savedTimeout ? parseFloat(savedTimeout) * 60 * 1000 : DEFAULT_SESSION_TIMEOUT * 60 * 1000;
  }, []);

  const [sessionTimeout, setSessionTimeoutState] = useState(DEFAULT_SESSION_TIMEOUT);
  const [remainingTime, setRemainingTime] = useState(getTimeoutDuration() / 1000);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Rutas publicas que no requieren monitoreo de sesion
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/'];

  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

  // Funcion para cerrar sesion
  const logout = useCallback(() => {
    console.log('[SessionManager] Sesion cerrada por inactividad');
    clearAuth();
    setIsWarningOpen(false);

    // Limpiar timers
    if (mainTimerRef.current) clearTimeout(mainTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Redirigir a login con mensaje
    router.push('/auth/login?expired=true');
  }, [clearAuth, router]);

  // Funcion para reiniciar el temporizador
  const resetTimer = useCallback(() => {
    if (!isAuthenticated || isPublicRoute) return;
    if (isWarningOpen) return; // No reiniciar si el modal esta abierto

    const timeout = getTimeoutDuration();
    const warningTime = WARNING_BEFORE_TIMEOUT * 60 * 1000;

    // Limpiar timers existentes
    if (mainTimerRef.current) clearTimeout(mainTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Actualizar tiempo restante
    setRemainingTime(timeout / 1000);
    lastActivityRef.current = Date.now();

    // Timer para mostrar advertencia
    warningTimerRef.current = setTimeout(() => {
      console.log('[SessionManager] Mostrando advertencia de sesion');
      setIsWarningOpen(true);

      // Iniciar countdown
      let countdown = warningTime / 1000;
      setRemainingTime(countdown);

      countdownRef.current = setInterval(() => {
        countdown -= 1;
        setRemainingTime(countdown);
        if (countdown <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 1000);
    }, timeout - warningTime);

    // Timer principal para cerrar sesion
    mainTimerRef.current = setTimeout(() => {
      logout();
    }, timeout);

    console.log(`[SessionManager] Timer reiniciado: ${timeout / 1000 / 60} minutos`);
  }, [isAuthenticated, isPublicRoute, isWarningOpen, getTimeoutDuration, logout]);

  // Funcion para extender la sesion (desde el modal de advertencia)
  const extendSession = useCallback(() => {
    console.log('[SessionManager] Sesion extendida por el usuario');
    setIsWarningOpen(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetTimer();
  }, [resetTimer]);

  // Configurar timeout
  const setSessionTimeout = useCallback((minutes: number) => {
    setSessionTimeoutState(minutes);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionTimeout', minutes.toString());
      console.log(`[SessionManager] Timeout configurado: ${minutes} minutos`);
    }
    resetTimer();
  }, [resetTimer]);

  // Manejar actividad del usuario con throttle
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    // Throttle: solo procesar cada 1 segundo maximo
    if (now - lastActivityRef.current > 1000) {
      lastActivityRef.current = now;
      resetTimer();
    }
  }, [resetTimer]);

  // Configurar event listeners
  useEffect(() => {
    if (!isAuthenticated || isPublicRoute) return;

    // Iniciar timer al montar
    resetTimer();

    // Eventos de actividad del usuario
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    console.log('[SessionManager] Monitor de inactividad activado');

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (mainTimerRef.current) clearTimeout(mainTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, isPublicRoute, handleUserActivity, resetTimer]);

  // Cargar configuracion inicial
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionTimeout');
      if (saved) {
        setSessionTimeoutState(parseFloat(saved));
      }
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{
        sessionTimeout,
        setSessionTimeout,
        remainingTime,
        isWarningOpen,
        resetTimer,
        extendSession,
      }}
    >
      {/* Overlay de blur cuando el modal está abierto */}
      {isWarningOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-md bg-black/50 transition-all duration-300"
          style={{ backdropFilter: 'blur(8px)' }}
        />
      )}

      {children}

      {/* Modal de advertencia de sesion */}
      <Dialog open={isWarningOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md z-50 border-2 border-amber-500 shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Sesion a punto de expirar
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tu sesion se cerrara automaticamente por inactividad para proteger tus datos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            <div className="flex items-center gap-2 text-4xl font-bold text-amber-600">
              <Clock className="h-8 w-8" />
              <span>{Math.max(0, Math.floor(remainingTime))}</span>
              <span className="text-lg font-normal">segundos</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Haz clic en "Seguir conectado" para continuar trabajando
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={logout}>
              Cerrar sesion
            </Button>
            <Button onClick={extendSession} className="bg-amber-600 hover:bg-amber-700">
              Seguir conectado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SessionContext.Provider>
  );
}

/**
 * Hook para verificar si hay token activo (para proteccion de rutas)
 */
export function useSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/'];
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, pathname, router]);

  return isAuthenticated;
}
