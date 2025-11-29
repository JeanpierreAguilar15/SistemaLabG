'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSent(true)
      } else {
        const data = await response.json()
        setError(data.message || 'Error al enviar el correo')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lab-primary-50 via-white to-lab-success-50 p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-lab-neutral-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto bg-lab-success-100 rounded-full p-4 w-fit mb-4">
                <svg className="w-8 h-8 text-lab-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle>Revisa tu correo</CardTitle>
              <CardDescription>
                Si existe una cuenta con el correo <strong>{email}</strong>,
                recibirás un enlace para restablecer tu contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-lab-neutral-600 text-center">
                El enlace expirará en 1 hora. Si no encuentras el correo, revisa tu carpeta de spam.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lab-primary-50 via-white to-lab-success-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-lab-primary-600 text-white rounded-2xl p-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Recuperar Contraseña</h1>
          <p className="text-lab-neutral-600">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        {/* Forgot Password Card */}
        <Card className="border-lab-neutral-200 shadow-xl">
          <CardHeader>
            <CardTitle>¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico y te enviaremos instrucciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-lab-danger-50 border border-lab-danger-200 text-lab-danger-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              <div className="text-center text-sm text-lab-neutral-600">
                <Link
                  href="/auth/login"
                  className="text-lab-primary-600 hover:text-lab-primary-700 font-medium hover:underline"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-lab-neutral-500">
          © 2025 Laboratorio Clínico Franz. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
