'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authApi.login(identifier, password)
      setAuth(data.user, data.access_token, data.refresh_token)
      router.push('/portal')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Error al iniciar sesión. Por favor intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lab-primary-50 via-white to-lab-success-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-lab-primary-600 text-white rounded-2xl p-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Laboratorio Franz</h1>
          <p className="text-lab-neutral-600">Bienvenido de vuelta</p>
        </div>

        {/* Login Card */}
        <Card className="border-lab-neutral-200 shadow-xl">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tu cédula o correo electrónico
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
                <Label htmlFor="identifier">Cédula o Correo Electrónico</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="1234567890 o correo@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-lab-primary-600 hover:text-lab-primary-700 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <div className="text-center text-sm text-lab-neutral-600">
                ¿No tienes una cuenta?{' '}
                <Link
                  href="/auth/register"
                  className="text-lab-primary-600 hover:text-lab-primary-700 font-medium hover:underline"
                >
                  Regístrate aquí
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
