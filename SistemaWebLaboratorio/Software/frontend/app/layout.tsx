import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import DialogflowMessenger from '@/components/DialogflowMessenger'

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
        {children}
        <DialogflowMessenger />
      </body>
    </html>
  )
}
