'use client';

/**
 * Providers - Componente que agrupa todos los providers de la aplicacion
 *
 * Incluye:
 * - SessionProvider: Control de sesion temporizada (AC-12)
 */

import { SessionProvider } from '@/contexts/SessionContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}

export default Providers;
