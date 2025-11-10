import './globals.css';
import { ReactNode } from 'react';
import { Toaster } from '../components/ui/toaster';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen bg-surface-page text-text-main antialiased theme-accent-blue app-shell">
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
