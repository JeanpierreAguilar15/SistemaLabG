import './globals.css';
import { ReactNode } from 'react';
import { Toaster } from '../components/ui/toaster';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-surface-page text-text-main antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
