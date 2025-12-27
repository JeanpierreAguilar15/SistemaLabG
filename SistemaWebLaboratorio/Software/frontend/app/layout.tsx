import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SecurityProviders from '@/components/security/SecurityProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Laboratorio Clínico Franz',
  description: 'Sistema de gestión para laboratorio clínico',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SecurityProviders>
          {children}
        </SecurityProviders>
      </body>
    </html>
  )
}
