'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { isAdminAreaRole } from '@/lib/roles'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 400)
      return () => clearTimeout(timer)
    }
  }, [shake])

  useEffect(() => {
    if (blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false)
            setError('')
            setFailedAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [blockTimeRemaining])

  const parseBlockMessage = useCallback((message: string) => {
    const blockPatterns = [
      /bloqueada.*?(\d+)\s*minuto/i,
      /bloqueado.*?(\d+)\s*minuto/i,
      /blocked.*?(\d+)\s*minute/i,
      /intente.*?(\d+)\s*minuto/i,
      /try.*?(\d+)\s*minute/i,
    ]

    for (const pattern of blockPatterns) {
      const match = message.match(pattern)
      if (match) {
        return parseInt(match[1], 10) * 60
      }
    }

    const secondsPattern = /(\d+)\s*segundo/i
    const secondsMatch = message.match(secondsPattern)
    if (secondsMatch) {
      return parseInt(secondsMatch[1], 10)
    }

    return 0
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isBlocked) return

    setError('')
    setLoading(true)

    try {
      const data = await authApi.login(identifier, password)
      setAuth(data.user, data.access_token, data.refresh_token)
      setSuccess(true)
      setFailedAttempts(0)

      await new Promise(resolve => setTimeout(resolve, 600))

      if (isAdminAreaRole(data.user.rol)) {
        router.push('/admin')
      } else {
        router.push('/portal')
      }
    } catch (err) {
      setShake(true)
      setFailedAttempts((prev) => prev + 1)

      if (err instanceof ApiError) {
        const errorMessage = err.message
        setError(errorMessage)

        const blockSeconds = parseBlockMessage(errorMessage)
        if (blockSeconds > 0) {
          setIsBlocked(true)
          setBlockTimeRemaining(blockSeconds)
        }
      } else {
        setError('Error al iniciar sesión. Por favor intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-white transition-opacity duration-500 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`bg-lab-primary-600 text-white rounded-xl p-2.5 shadow-md transition-colors duration-300 ${
                success ? 'bg-green-500' : ''
              }`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-lab-primary-700">Laboratorio Franz</span>
            </div>
            <h1 className="text-3xl font-bold text-lab-neutral-900 mt-6">Iniciar Sesión</h1>
            <p className="text-lab-neutral-500 mt-2">
              ¿No tienes una cuenta?{' '}
              <Link href="/auth/register" className="text-lab-primary-600 hover:text-lab-primary-700 font-medium hover:underline">
                Registrate aqui
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={`space-y-5 ${shake ? 'animate-shake' : ''}`}>
            {/* Blocked Account Warning */}
            {isBlocked && (
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <svg className="w-12 h-12 text-red-200" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="45" fill="none" stroke="rgb(239 68 68)" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray="283"
                        strokeDashoffset={283 - (blockTimeRemaining / 300) * 283}
                        transform="rotate(-90 50 50)" className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">Cuenta inactiva temporalmente</p>
                    <p className="text-sm text-red-600 mt-1">Demasiados intentos fallidos. Intente en:</p>
                    <p className="text-2xl font-bold text-red-700 mt-1 font-mono">{formatTimeRemaining(blockTimeRemaining)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !isBlocked && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
                {failedAttempts >= 3 && failedAttempts < 5 && (
                  <span className="ml-auto text-xs font-medium text-red-500">
                    {5 - failedAttempts} intentos restantes
                  </span>
                )}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Inicio de sesión exitoso. Redirigiendo...</span>
              </div>
            )}

            {/* Email/ID Field */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-lab-neutral-700 font-medium">
                Cedula o Correo Electronico
              </Label>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="1234567890 o correo@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={loading || success}
                  className={`h-12 pl-10 bg-lab-neutral-50 border-lab-neutral-200 focus:border-lab-primary-500 focus:ring-lab-primary-500 ${
                    error ? 'border-red-300' : ''
                  } ${success ? 'border-green-300 bg-green-50/30' : ''}`}
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lab-neutral-700 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  className={`h-12 pl-10 pr-10 bg-lab-neutral-50 border-lab-neutral-200 focus:border-lab-primary-500 focus:ring-lab-primary-500 ${
                    error ? 'border-red-300' : ''
                  } ${success ? 'border-green-300 bg-green-50/30' : ''}`}
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lab-neutral-400 hover:text-lab-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-lab-primary-600 hover:text-lab-primary-700 hover:underline font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full h-12 text-base font-semibold transition-all duration-200 ${
                success ? 'bg-green-500 hover:bg-green-600' : 'bg-lab-primary-600 hover:bg-lab-primary-700'
              } ${isBlocked ? 'bg-gray-400 cursor-not-allowed' : ''}`}
              disabled={loading || success || isBlocked}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verificando...</span>
                </div>
              ) : success ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Acceso concedido</span>
                </div>
              ) : isBlocked ? (
                <span>Cuenta inactiva</span>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-lab-neutral-200">
            <p className="text-center text-xs text-lab-neutral-400">
              Copyright 2025 Laboratorio Clinico Franz.
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <Link href="/terms" className="text-xs text-lab-neutral-500 hover:text-lab-primary-600 hover:underline">
                Terminos de Servicio
              </Link>
              <Link href="/privacy" className="text-xs text-lab-neutral-500 hover:text-lab-primary-600 hover:underline">
                Politica de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-lab-primary-600 via-lab-primary-700 to-lab-primary-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-lab-primary-400/20 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-lg animate-bounce delay-300"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Lab Illustration */}
          <div className="relative mb-8">
            <div className="w-64 h-64 relative">
              {/* Microscope/Lab Icon */}
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                {/* Base */}
                <ellipse cx="100" cy="180" rx="60" ry="15" fill="white" fillOpacity="0.2"/>

                {/* Flask */}
                <path d="M80 60 L80 100 L60 160 Q55 175 70 180 L130 180 Q145 175 140 160 L120 100 L120 60"
                      fill="white" fillOpacity="0.9" stroke="white" strokeWidth="2"/>

                {/* Flask neck */}
                <rect x="75" y="40" width="50" height="25" rx="5" fill="white"/>

                {/* Liquid */}
                <path d="M65 150 Q70 140 100 145 Q130 150 135 150 L130 170 Q125 178 100 178 Q75 178 70 170 Z"
                      fill="#60a5fa" fillOpacity="0.8"/>

                {/* Bubbles */}
                <circle cx="85" cy="155" r="5" fill="white" fillOpacity="0.6"/>
                <circle cx="100" cy="160" r="3" fill="white" fillOpacity="0.6"/>
                <circle cx="115" cy="152" r="4" fill="white" fillOpacity="0.6"/>

                {/* DNA Helix on side */}
                <g transform="translate(150, 80)">
                  <path d="M0 0 Q10 10 0 20 Q-10 30 0 40 Q10 50 0 60" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.6"/>
                  <path d="M15 0 Q5 10 15 20 Q25 30 15 40 Q5 50 15 60" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.6"/>
                  <line x1="0" y1="10" x2="15" y2="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
                  <line x1="0" y1="30" x2="15" y2="30" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
                  <line x1="0" y1="50" x2="15" y2="50" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
                </g>

                {/* Molecules */}
                <g transform="translate(30, 90)">
                  <circle cx="0" cy="0" r="8" fill="white" fillOpacity="0.3"/>
                  <circle cx="15" cy="10" r="6" fill="white" fillOpacity="0.3"/>
                  <line x1="6" y1="4" x2="11" y2="6" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
                </g>
              </svg>
            </div>
          </div>

          {/* Text */}
          <h2 className="text-3xl font-bold text-center mb-4">
            Bienvenido a tu Portal de Salud
          </h2>
          <p className="text-lg text-white/80 text-center max-w-md">
            Accede a tus resultados de laboratorio y consulta tu historial medico de forma segura.
          </p>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm text-white/70">Resultados</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-sm text-white/70">Asistente IA</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm text-white/70">Seguro</span>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 border border-white/10 rounded-full"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 border border-white/10 rounded-full"></div>
      </div>

      {/* Shake Animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
