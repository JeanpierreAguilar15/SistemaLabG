'use client';

/**
 * Providers - Componente que agrupa todos los providers de la aplicacion
 *
 * Incluye:
 * - SessionProvider: Control de sesion temporizada (AC-12)
 */

import { SessionProvider } from '@/contexts/SessionContext';
import PublicChatWidget from '@/components/PublicChatWidget';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <PublicChatWidget />
    </SessionProvider>
  );
}

export default Providers;
