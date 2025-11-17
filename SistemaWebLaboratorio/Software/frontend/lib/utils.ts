import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function validateCedulaEcuador(cedula: string): boolean {
  if (cedula.length !== 10) return false

  const digits = cedula.split('').map(Number)
  const province = parseInt(cedula.substring(0, 2))

  if (province < 1 || province > 24) return false

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    let value = digits[i] * coefficients[i]
    if (value >= 10) value -= 9
    sum += value
  }

  const checkDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10)

  return checkDigit === digits[9]
}

export function getInitials(nombres: string, apellidos: string): string {
  const firstInitial = nombres.charAt(0).toUpperCase()
  const lastInitial = apellidos.charAt(0).toUpperCase()
  return `${firstInitial}${lastInitial}`
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export type PasswordStrength = 'weak' | 'moderate' | 'strong' | 'very-strong'

export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number
  feedback: string[]
  color: string
  label: string
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      feedback: ['Ingresa una contraseña'],
      color: 'text-lab-neutral-400',
      label: 'Sin contraseña'
    }
  }

  let score = 0
  const feedback: string[] = []

  // Longitud
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (password.length < 8) feedback.push('Usa al menos 8 caracteres')

  // Minúsculas
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Agrega letras minúsculas')
  }

  // Mayúsculas
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Agrega letras mayúsculas')
  }

  // Números
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Agrega números')
  }

  // Caracteres especiales
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 2
  } else {
    feedback.push('Agrega caracteres especiales (!@#$%)')
  }

  // Evaluar fortaleza
  let strength: PasswordStrength
  let color: string
  let label: string

  if (score <= 2) {
    strength = 'weak'
    color = 'text-lab-danger-600'
    label = 'Débil'
  } else if (score <= 4) {
    strength = 'moderate'
    color = 'text-lab-warning-600'
    label = 'Moderada'
  } else if (score <= 6) {
    strength = 'strong'
    color = 'text-lab-success-600'
    label = 'Fuerte'
  } else {
    strength = 'very-strong'
    color = 'text-lab-success-700'
    label = 'Muy fuerte'
  }

  return { strength, score, feedback, color, label }
}
