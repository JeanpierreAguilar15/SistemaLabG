"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../lib/session-store';
import { getHomePath } from '../lib/auth-helpers';

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const [ready, setReady] = useState<boolean>(() => (useSessionStore as any).persist?.hasHydrated?.() ?? false);
  useEffect(() => {
    const unsub = (useSessionStore as any).persist?.onFinishHydration?.(() => setReady(true));
    if (!ready && (useSessionStore as any).persist?.hasHydrated?.()) setReady(true);
    return () => { try{ unsub?.(); }catch{} };
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    const dest = getHomePath(roles, accessToken);
    if (typeof window !== 'undefined') {
      location.replace(dest);
    }
  }, [ready, accessToken, roles]);
  return <div className="p-6">Redirigiendo...</div>;
}
