'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, ApiError } from '@/lib/api'
import { validateCedulaEcuador, checkPasswordStrength, type PasswordStrengthResult } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!validateCedulaEcuador(formData.cedula)) {
      newErrors.cedula = 'Cedula ecuatoriana invalida'
    }

    if (formData.nombres.length < 2) {
      newErrors.nombres = 'Los nombres deben tener al menos 2 caracteres'
    }

    if (formData.apellidos.length < 2) {
      newErrors.apellidos = 'Los apellidos deben tener al menos 2 caracteres'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Correo electronico invalido'
    }

    if (formData.telefono && !/^(09\d{8}|0[2-7]\d{7})$/.test(formData.telefono)) {
      newErrors.telefono = 'Telefono debe ser formato ecuatoriano (09XXXXXXXX o 02XXXXXXX)'
    }

    if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(formData.password)) {
      newErrors.password = 'La contraseña debe incluir mayúsculas, minúsculas y números'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      await authApi.register(registerData)
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login?registered=true')
      }, 1500)
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message)
      } else {
        setApiError('Error al registrarse. Por favor intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value))
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-8 bg-white overflow-y-auto transition-opacity duration-500 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="max-w-lg w-full mx-auto">
          {/* Logo */}
          <div className="mb-6">
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
            <h1 className="text-2xl font-bold text-lab-neutral-900 mt-4">Crear Cuenta</h1>
            <p className="text-lab-neutral-500 mt-1">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-lab-primary-600 hover:text-lab-primary-700 font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error */}
            {apiError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Cuenta creada exitosamente. Redirigiendo al login...</span>
              </div>
            )}

            {/* Row 1: Cedula & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cedula" className="text-lab-neutral-700 font-medium text-sm">Cedula *</Label>
                <Input
                  id="cedula"
                  type="text"
                  placeholder="1234567890"
                  maxLength={10}
                  value={formData.cedula}
                  onChange={(e) => handleChange('cedula', e.target.value)}
                  required
                  disabled={loading || success}
                  className={`h-11 bg-lab-neutral-50 border-lab-neutral-200 ${errors.cedula ? 'border-red-300' : ''}`}
                />
                {errors.cedula && <p className="text-xs text-red-600">{errors.cedula}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-lab-neutral-700 font-medium text-sm">Correo Electronico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  disabled={loading || success}
                  className={`h-11 bg-lab-neutral-50 border-lab-neutral-200 ${errors.email ? 'border-red-300' : ''}`}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>

            {/* Row 2: Nombres & Apellidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombres" className="text-lab-neutral-700 font-medium text-sm">Nombres *</Label>
                <Input
                  id="nombres"
                  type="text"
                  placeholder="Juan Carlos"
                  value={formData.nombres}
                  onChange={(e) => handleChange('nombres', e.target.value)}
                  required
                  disabled={loading || success}
                  className={`h-11 bg-lab-neutral-50 border-lab-neutral-200 ${errors.nombres ? 'border-red-300' : ''}`}
                />
                {errors.nombres && <p className="text-xs text-red-600">{errors.nombres}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apellidos" className="text-lab-neutral-700 font-medium text-sm">Apellidos *</Label>
                <Input
                  id="apellidos"
                  type="text"
                  placeholder="Perez Garcia"
                  value={formData.apellidos}
                  onChange={(e) => handleChange('apellidos', e.target.value)}
                  required
                  disabled={loading || success}
                  className={`h-11 bg-lab-neutral-50 border-lab-neutral-200 ${errors.apellidos ? 'border-red-300' : ''}`}
                />
                {errors.apellidos && <p className="text-xs text-red-600">{errors.apellidos}</p>}
              </div>
            </div>

            {/* Telefono */}
            <div className="space-y-1.5">
              <Label htmlFor="telefono" className="text-lab-neutral-700 font-medium text-sm">Telefono (opcional)</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="0987654321"
                maxLength={10}
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                disabled={loading || success}
                className={`h-11 bg-lab-neutral-50 border-lab-neutral-200 ${errors.telefono ? 'border-red-300' : ''}`}
              />
              {errors.telefono && <p className="text-xs text-red-600">{errors.telefono}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-lab-neutral-700 font-medium text-sm">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  disabled={loading || success}
                  className={`h-11 pr-10 bg-lab-neutral-50 border-lab-neutral-200 ${errors.password ? 'border-red-300' : ''}`}
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
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}

              {/* Password Strength */}
              {formData.password && passwordStrength && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-lab-neutral-600">Fortaleza:</span>
                    <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      let bgColor = 'bg-lab-neutral-200'
                      if (passwordStrength.score >= level * 2) {
                        if (passwordStrength.strength === 'weak') bgColor = 'bg-red-500'
                        else if (passwordStrength.strength === 'moderate') bgColor = 'bg-yellow-500'
                        else if (passwordStrength.strength === 'strong') bgColor = 'bg-green-500'
                        else if (passwordStrength.strength === 'very-strong') bgColor = 'bg-green-600'
                      }
                      return <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${bgColor}`} />
                    })}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-lab-neutral-500">
                      {passwordStrength.feedback.slice(0, 2).map((tip, idx) => (
                        <span key={idx} className="mr-2">• {tip}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!formData.password && (
                <p className="text-xs text-lab-neutral-500">Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-lab-neutral-700 font-medium text-sm">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                disabled={loading || success}
                className={`h-11 bg-lab-neutral-50 border-lab-neutral-200 ${errors.confirmPassword ? 'border-red-300' : ''} ${
                  formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-300' : ''
                }`}
              />
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full h-12 text-base font-semibold transition-all duration-200 ${
                success ? 'bg-green-500 hover:bg-green-600' : 'bg-lab-primary-600 hover:bg-lab-primary-700'
              }`}
              disabled={loading || success}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creando cuenta...</span>
                </div>
              ) : success ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cuenta creada</span>
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-lab-neutral-200">
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
              <pattern id="grid-reg" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-reg)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-lab-primary-400/20 rounded-full blur-2xl animate-pulse delay-700"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Lab Illustration */}
          <div className="relative mb-8">
            <div className="w-56 h-56 relative">
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                {/* Base */}
                <ellipse cx="100" cy="180" rx="60" ry="15" fill="white" fillOpacity="0.2"/>
                {/* Clipboard/Form */}
                <rect x="55" y="30" width="90" height="120" rx="8" fill="white" fillOpacity="0.95"/>
                <rect x="65" y="45" width="70" height="8" rx="2" fill="#60a5fa" fillOpacity="0.6"/>
                <rect x="65" y="60" width="50" height="6" rx="2" fill="#94a3b8" fillOpacity="0.4"/>
                <rect x="65" y="75" width="70" height="8" rx="2" fill="#60a5fa" fillOpacity="0.6"/>
                <rect x="65" y="90" width="40" height="6" rx="2" fill="#94a3b8" fillOpacity="0.4"/>
                <rect x="65" y="105" width="70" height="8" rx="2" fill="#60a5fa" fillOpacity="0.6"/>
                <rect x="65" y="120" width="55" height="6" rx="2" fill="#94a3b8" fillOpacity="0.4"/>
                {/* Checkmark */}
                <circle cx="145" cy="45" r="20" fill="#22c55e" fillOpacity="0.9"/>
                <path d="M137 45 L143 51 L155 39" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Stethoscope */}
                <g transform="translate(150, 100)">
                  <circle cx="15" cy="40" r="12" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="2" strokeOpacity="0.6"/>
                  <path d="M15 28 L15 10 Q15 0 5 0 L-5 0" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.6"/>
                  <path d="M15 28 L15 10 Q15 0 25 0 L35 0" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.6"/>
                </g>
              </svg>
            </div>
          </div>

          {/* Text */}
          <h2 className="text-3xl font-bold text-center mb-4">
            Unete a Nuestra Comunidad
          </h2>
          <p className="text-lg text-white/80 text-center max-w-md">
            Crea tu cuenta para acceder a todos los servicios del laboratorio de forma rapida y segura.
          </p>

          {/* Benefits */}
          <div className="mt-8 space-y-4 w-full max-w-sm">
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Resultados en linea</p>
                <p className="text-xs text-white/60">Accede a tus resultados 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Agenda citas facilmente</p>
                <p className="text-xs text-white/60">Reserva en cualquier momento</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Datos seguros</p>
                <p className="text-xs text-white/60">Tu informacion protegida</p>
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
