'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, ApiError } from '@/lib/api'

type Step = 'email' | 'code' | 'password'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [resendCooldown])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSuccess('Si el correo existe, recibiras un codigo de 6 digitos.')
      setStep('code')
      setResendCooldown(60)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Error al enviar el correo. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)
    if (pastedData.length === 6) {
      codeInputRefs.current[5]?.focus()
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')

    if (fullCode.length !== 6) {
      setError('Ingresa el codigo completo de 6 digitos')
      return
    }

    setError('')
    setLoading(true)

    try {
      await authApi.verifyRecoveryCode(email, fullCode)
      setSuccess('')
      setStep('password')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Codigo invalido o expirado')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }

    if (newPassword.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres')
      return
    }

    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setError('La contrasena debe incluir mayuscula, minuscula y numero')
      return
    }

    setError('')
    setLoading(true)

    try {
      const fullCode = code.join('')
      await authApi.resetPassword(email, fullCode, newPassword)
      setSuccess('Contrasena actualizada correctamente')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Error al actualizar la contrasena')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    setError('')
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSuccess('Codigo reenviado exitosamente')
      setResendCooldown(60)
      setCode(['', '', '', '', '', ''])
    } catch (err) {
      setError('Error al reenviar el codigo')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (!newPassword) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (newPassword.length >= 8) strength++
    if (/[A-Z]/.test(newPassword)) strength++
    if (/[a-z]/.test(newPassword)) strength++
    if (/[0-9]/.test(newPassword)) strength++
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++

    if (strength <= 2) return { strength: 33, label: 'Debil', color: 'bg-red-500' }
    if (strength <= 3) return { strength: 66, label: 'Media', color: 'bg-yellow-500' }
    return { strength: 100, label: 'Fuerte', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength()

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
              <div className="bg-lab-primary-600 text-white rounded-xl p-2.5 shadow-md">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-lab-primary-700">Laboratorio Franz</span>
            </div>
            <h1 className="text-3xl font-bold text-lab-neutral-900 mt-6">Recuperar Contrasena</h1>
            <p className="text-lab-neutral-500 mt-2">
              {step === 'email' && 'Ingresa tu correo electronico'}
              {step === 'code' && 'Ingresa el codigo de verificacion'}
              {step === 'password' && 'Crea tu nueva contrasena'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['email', 'code', 'password'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === s
                      ? 'bg-lab-primary-600 text-white'
                      : ['email', 'code', 'password'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-lab-neutral-200 text-lab-neutral-500'
                  }`}
                >
                  {['email', 'code', 'password'].indexOf(step) > i ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-all rounded-full ${
                      ['email', 'code', 'password'].indexOf(step) > i
                        ? 'bg-green-500'
                        : 'bg-lab-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && step !== 'password' && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lab-neutral-700 font-medium">Correo Electronico</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 pl-10 bg-lab-neutral-50 border-lab-neutral-200"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-lab-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold bg-lab-primary-600 hover:bg-lab-primary-700" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    'Enviar codigo'
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Code */}
            {step === 'code' && (
              <form onSubmit={handleCodeSubmit} className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-lab-neutral-700 font-medium">Codigo de 6 digitos</Label>
                  <p className="text-sm text-lab-neutral-500">Enviamos un codigo a {email}</p>
                  <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => { codeInputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold bg-lab-neutral-50 border-lab-neutral-200"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold bg-lab-primary-600 hover:bg-lab-primary-700" disabled={loading || code.join('').length !== 6}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    'Verificar codigo'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className={`text-sm ${
                      resendCooldown > 0
                        ? 'text-lab-neutral-400 cursor-not-allowed'
                        : 'text-lab-primary-600 hover:underline'
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Reenviar codigo en ${resendCooldown}s`
                      : 'No recibiste el codigo? Reenviar'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {success && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                    <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-700 font-medium">{success}</p>
                    <p className="text-green-600 text-sm mt-1">Redirigiendo al login...</p>
                  </div>
                )}

                {!success && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-lab-neutral-700 font-medium">Nueva Contrasena</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="********"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={loading}
                          className="h-12 pr-10 bg-lab-neutral-50 border-lab-neutral-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-lab-neutral-400 hover:text-lab-neutral-600"
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

                      {newPassword && (
                        <div className="space-y-1">
                          <div className="h-2 bg-lab-neutral-200 rounded-full overflow-hidden">
                            <div className={`h-full transition-all ${passwordStrength.color}`} style={{ width: `${passwordStrength.strength}%` }} />
                          </div>
                          <p className={`text-xs ${
                            passwordStrength.strength <= 33 ? 'text-red-500' :
                            passwordStrength.strength <= 66 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            Fortaleza: {passwordStrength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-lab-neutral-700 font-medium">Confirmar Contrasena</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        className={`h-12 bg-lab-neutral-50 border-lab-neutral-200 ${
                          confirmPassword && newPassword !== confirmPassword ? 'border-red-300' :
                          confirmPassword && newPassword === confirmPassword ? 'border-green-300' : ''
                        }`}
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500">Las contrasenas no coinciden</p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Las contrasenas coinciden
                        </p>
                      )}
                    </div>

                    <div className="bg-lab-neutral-50 p-3 rounded-lg text-xs text-lab-neutral-600">
                      <p className="font-medium mb-1">La contrasena debe tener:</p>
                      <ul className="space-y-1">
                        <li className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                          {newPassword.length >= 8 ? '>' : 'o'} Al menos 8 caracteres
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          {/[A-Z]/.test(newPassword) ? '>' : 'o'} Una letra mayuscula
                        </li>
                        <li className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          {/[a-z]/.test(newPassword) ? '>' : 'o'} Una letra minuscula
                        </li>
                        <li className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          {/[0-9]/.test(newPassword) ? '>' : 'o'} Un numero
                        </li>
                      </ul>
                    </div>

                    <Button type="submit" className="w-full h-12 text-base font-semibold bg-lab-primary-600 hover:bg-lab-primary-700" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Actualizando...</span>
                        </div>
                      ) : (
                        'Actualizar contrasena'
                      )}
                    </Button>
                  </>
                )}
              </form>
            )}

            {/* Back to Login */}
            <div className="text-center pt-4">
              <Link
                href="/auth/login"
                className="text-sm text-lab-primary-600 hover:text-lab-primary-700 hover:underline flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al inicio de sesion
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-lab-neutral-200">
            <p className="text-center text-xs text-lab-neutral-400">
              Copyright 2025 Laboratorio Clinico Franz.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-lab-primary-600 via-lab-primary-700 to-lab-primary-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-forgot" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-forgot)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-lab-primary-400/20 rounded-full blur-2xl animate-pulse delay-700"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Lock/Security Illustration */}
          <div className="relative mb-8">
            <div className="w-56 h-56 relative">
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                {/* Base shadow */}
                <ellipse cx="100" cy="180" rx="50" ry="12" fill="white" fillOpacity="0.2"/>
                {/* Lock body */}
                <rect x="60" y="90" width="80" height="70" rx="10" fill="white" fillOpacity="0.95"/>
                {/* Lock shackle */}
                <path d="M75 90 L75 65 Q75 40 100 40 Q125 40 125 65 L125 90" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round"/>
                {/* Keyhole */}
                <circle cx="100" cy="120" r="12" fill="#2563eb"/>
                <rect x="96" y="120" width="8" height="20" rx="2" fill="#2563eb"/>
                {/* Sparkles */}
                <g fill="white" fillOpacity="0.6">
                  <circle cx="45" cy="70" r="3"/>
                  <circle cx="155" cy="80" r="4"/>
                  <circle cx="50" cy="140" r="2"/>
                  <circle cx="160" cy="130" r="3"/>
                </g>
                {/* Key icon floating */}
                <g transform="translate(140, 50) rotate(45)">
                  <rect x="0" y="0" width="30" height="10" rx="5" fill="white" fillOpacity="0.8"/>
                  <rect x="25" y="-3" width="5" height="8" rx="1" fill="white" fillOpacity="0.8"/>
                  <rect x="32" y="-3" width="5" height="8" rx="1" fill="white" fillOpacity="0.8"/>
                </g>
              </svg>
            </div>
          </div>

          {/* Text */}
          <h2 className="text-3xl font-bold text-center mb-4">
            Recupera tu Acceso
          </h2>
          <p className="text-lg text-white/80 text-center max-w-md">
            No te preocupes, te ayudaremos a restablecer tu contrasena de forma segura.
          </p>

          {/* Steps info */}
          <div className="mt-8 space-y-4 w-full max-w-sm">
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Ingresa tu correo</p>
                <p className="text-xs text-white/60">Te enviaremos un codigo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Verifica tu identidad</p>
                <p className="text-xs text-white/60">Ingresa el codigo de 6 digitos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Crea nueva contrasena</p>
                <p className="text-xs text-white/60">Elige una contrasena segura</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 border border-white/10 rounded-full"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 border border-white/10 rounded-full"></div>
      </div>
    </div>
  )
}
