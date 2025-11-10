"use client";
import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from './session-store';
import { isAdminish } from './auth-helpers';

type RouteProtectionOptions = {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectIfAdmin?: boolean;
};

export function useRouteProtection(options: RouteProtectionOptions = {}) {
  const { accessToken, roles } = useSessionStore();
  const hasRedirected = useRef(false);
  const [isReady, setIsReady] = useState<boolean>(() => (useSessionStore as any).persist?.hasHydrated?.() ?? false);

  useEffect(() => {
    const unsub = (useSessionStore as any).persist?.onFinishHydration?.(() => setIsReady(true));
    if (!isReady && (useSessionStore as any).persist?.hasHydrated?.()) setIsReady(true);
    return () => { try{ unsub?.(); }catch{} };
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (hasRedirected.current) return;

    const admin = isAdminish(roles);
    const authenticated = !!accessToken && Array.isArray(roles) && roles.length > 0;

    // Si requiere autenticación y no hay token
    if (options.requireAuth && !authenticated) {
      hasRedirected.current = true;
      window.location.replace('/login');
      return;
    }

    // Si requiere admin y no es admin
    if (options.requireAdmin && authenticated && !admin) {
      hasRedirected.current = true;
      window.location.replace('/dashboard');
      return;
    }

    // Si NO debe ser admin pero lo es (ruta de portal)
    if (options.redirectIfAdmin && authenticated && admin) {
      hasRedirected.current = true;
      window.location.replace('/admin');
      return;
    }
  }, [isReady, accessToken, roles, options.requireAuth, options.requireAdmin, options.redirectIfAdmin]);

  return {
    isReady,
    isAuthenticated: isReady ? ( !!accessToken && Array.isArray(roles) && roles.length > 0 ) : false,
    isAdmin: isReady ? isAdminish(roles) : false,
    roles,
  };
}
