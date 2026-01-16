'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Navbar from '@/components/Navbar'

interface Reserva {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
  cancha: {
    nombre: string
    tipo: string
    precioPorHora: number
  }
}

interface CardData {
  numero: string
  titular: string
  expiracion: string
  cvv: string
  tipoTarjeta: 'visa' | 'mastercard' | 'amex' | ''
}

const metodosPago = [
  { id: 'TARJETA', nombre: 'Pago en Linea', desc: 'Visa, Mastercard, American Express' },
  { id: 'EFECTIVO', nombre: 'Pago Presencial', desc: 'Paga al llegar al local' },
]

// Detect card type from number
function detectCardType(number: string): 'visa' | 'mastercard' | 'amex' | '' {
  const cleaned = number.replace(/\s/g, '')
  if (/^4/.test(cleaned)) return 'visa'
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard'
  if (/^3[47]/.test(cleaned)) return 'amex'
  return ''
}

// Format card number with spaces
function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  const groups = cleaned.match(/.{1,4}/g)
  return groups ? groups.join(' ').substr(0, 19) : ''
}

// Format expiration date
function formatExpiration(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length >= 2) {
    return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2)
  }
  return cleaned
}

export default function PagarReservaPage() {
  const params = useParams()
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const reservaId = params.id as string

  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [metodo, setMetodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState<any>(null)

  const [cardData, setCardData] = useState<CardData>({
    numero: '',
    titular: '',
    expiracion: '',
    cvv: '',
    tipoTarjeta: ''
  })
  const [cardErrors, setCardErrors] = useState<Partial<CardData>>({})

  useEffect(() => {
    api.getReserva(reservaId)
      .then(setReserva)
      .catch(() => {
        showError('No se pudo cargar la reserva')
        router.push('/portal/reservas')
      })
      .finally(() => setLoading(false))
  }, [reservaId, router])

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value)
    const tipo = detectCardType(formatted)
    setCardData(prev => ({ ...prev, numero: formatted, tipoTarjeta: tipo }))
    setCardErrors(prev => ({ ...prev, numero: '' }))
  }

  const handleExpirationChange = (value: string) => {
    const formatted = formatExpiration(value.replace('/', ''))
    setCardData(prev => ({ ...prev, expiracion: formatted }))
    setCardErrors(prev => ({ ...prev, expiracion: '' }))
  }

  const validateCard = (): boolean => {
    const errors: Partial<CardData> = {}

    // Validate card number (16 digits for Visa/MC, 15 for Amex)
    const cleanNumber = cardData.numero.replace(/\s/g, '')
    if (cleanNumber.length < 15) {
      errors.numero = 'Numero de tarjeta invalido'
    }

    // Validate holder name
    if (cardData.titular.trim().length < 3) {
      errors.titular = 'Ingresa el nombre del titular'
    }

    // Validate expiration (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(cardData.expiracion)) {
      errors.expiracion = 'Formato invalido (MM/YY)'
    } else {
      const [month, year] = cardData.expiracion.split('/').map(Number)
      const currentYear = new Date().getFullYear() % 100
      const currentMonth = new Date().getMonth() + 1
      if (month < 1 || month > 12) {
        errors.expiracion = 'Mes invalido'
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiracion = 'Tarjeta expirada'
      }
    }

    // Validate CVV (3 digits, 4 for Amex)
    const cvvLength = cardData.tipoTarjeta === 'amex' ? 4 : 3
    if (cardData.cvv.length !== cvvLength) {
      errors.cvv = `CVV debe tener ${cvvLength} digitos`
    }

    setCardErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePagar = async () => {
    if (!metodo) {
      showWarning('Selecciona un metodo de pago')
      setError('Selecciona un metodo de pago')
      return
    }

    // Validate card data if paying with card
    if (metodo === 'TARJETA' && !validateCard()) {
      showError('Por favor corrige los errores en los datos de la tarjeta')
      return
    }

    setProcesando(true)
    setError('')
    showInfo('Procesando tu pago...')

    // Simulate processing delay for realism
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const resultado = await api.procesarPago({
        reservaId,
        metodo,
      })
      setExito(resultado)
      showSuccess('Pago completado exitosamente! Tu reserva ha sido confirmada.')
    } catch (err: any) {
      const errorMsg = err.message || 'Error al procesar el pago'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setProcesando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-slate-600">Cargando reserva...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reserva) return null

  // Si el pago fue exitoso, mostrar comprobante
  if (exito) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="container mx-auto px-4 py-12 pt-24">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Pago Exitoso!</h1>
              <p className="text-slate-500 mb-8">Tu reserva ha sido confirmada</p>

              <div className="bg-slate-50 rounded-xl p-6 text-left mb-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Comprobante de Pago
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Referencia</span>
                    <span className="font-semibold text-blue-600">{exito.comprobante.referencia}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Cancha</span>
                    <span className="font-medium text-slate-800">{exito.comprobante.cancha}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Fecha</span>
                    <span className="font-medium text-slate-800">{new Date(exito.comprobante.fechaReserva).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Horario</span>
                    <span className="font-medium text-slate-800">{exito.comprobante.horario}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-slate-500">Monto pagado</span>
                    <span className="font-bold text-xl text-green-600">${exito.comprobante.monto}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-blue-700">
                  Se ha enviado un correo de confirmacion con los detalles de tu reserva.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/portal/reservas" className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                  Ver mis reservas
                </Link>
                <Link href="/canchas" className="block w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                  Hacer otra reserva
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      if (isNaN(date.getTime())) {
        return fecha
      }
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    } catch {
      return fecha
    }
  }

  const CardIcon = ({ type }: { type: string }) => {
    if (type === 'visa') {
      return (
        <svg className="w-10 h-6" viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#1A1F71"/>
          <path d="M19.5 21H17L18.8 11H21.3L19.5 21ZM15.2 11L12.8 18.1L12.5 16.7L12.5 16.7L11.6 12C11.6 12 11.5 11 10.2 11H6.1L6 11.2C6 11.2 7.5 11.5 9.2 12.5L11.4 21H14L18 11H15.2ZM35 21H37.5L35.3 11H33.3C32.2 11 31.9 11.9 31.9 11.9L28 21H30.6L31.1 19.5H34.3L34.6 21H35ZM31.9 17.5L33.3 13.6L34.1 17.5H31.9ZM28 14.3L28.4 12C28.4 12 27.1 11.5 25.7 11.5C24.2 11.5 20.8 12.2 20.8 15.2C20.8 18 24.8 18 24.8 19.5C24.8 21 21.2 20.6 20 19.8L19.6 22.2C19.6 22.2 20.9 22.8 22.9 22.8C24.9 22.8 28 21.6 28 18.9C28 16.1 24 15.8 24 14.5C24 13.2 26.8 13.4 28 14.3Z" fill="white"/>
        </svg>
      )
    }
    if (type === 'mastercard') {
      return (
        <svg className="w-10 h-6" viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#000"/>
          <circle cx="18" cy="16" r="8" fill="#EB001B"/>
          <circle cx="30" cy="16" r="8" fill="#F79E1B"/>
          <path d="M24 10.5C25.9 12 27.1 14.3 27.1 16.9C27.1 19.5 25.9 21.8 24 23.3C22.1 21.8 20.9 19.5 20.9 16.9C20.9 14.3 22.1 12 24 10.5Z" fill="#FF5F00"/>
        </svg>
      )
    }
    if (type === 'amex') {
      return (
        <svg className="w-10 h-6" viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#006FCF"/>
          <path d="M8 16L10 12H12L14 16L16 12H18L15 18H13L11 14L9 18H7L8 16ZM20 12H26V14H22V15H26V17H22V18H26V20H20V12ZM28 12H33L35 15L37 12H39V20H37V15L35 18H35L33 15V20H31L28 16V20H26L28 12Z" fill="white"/>
        </svg>
      )
    }
    return (
      <svg className="w-10 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="max-w-4xl mx-auto">
          <Link href="/portal/reservas" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver a mis reservas</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-800 mb-8">Completar Pago</h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Formulario de Pago */}
            <div className="lg:col-span-2 space-y-6">
              {/* Metodo de Pago */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Metodo de Pago</h2>

                <div className="grid grid-cols-2 gap-3">
                  {metodosPago.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetodo(m.id)}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        metodo === m.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {m.id === 'TARJETA' ? (
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{m.nombre}</p>
                          <p className="text-xs text-slate-500">{m.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulario de Tarjeta */}
              {metodo === 'TARJETA' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Datos de la Tarjeta</h2>

                  {/* Card Preview */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 mb-6 text-white">
                    <div className="flex justify-between items-start mb-8">
                      <svg className="w-10 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.3"/>
                        <rect x="4" y="8" width="6" height="4" rx="1" fill="currentColor"/>
                      </svg>
                      <CardIcon type={cardData.tipoTarjeta} />
                    </div>
                    <p className="text-xl tracking-widest mb-4 font-mono">
                      {cardData.numero || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-slate-400 text-xs">TITULAR</p>
                        <p className="uppercase">{cardData.titular || 'NOMBRE APELLIDO'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">EXPIRA</p>
                        <p>{cardData.expiracion || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Card Number */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Numero de Tarjeta
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardData.numero}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            cardErrors.numero ? 'border-red-300' : 'border-slate-300'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CardIcon type={cardData.tipoTarjeta} />
                        </div>
                      </div>
                      {cardErrors.numero && (
                        <p className="text-red-500 text-sm mt-1">{cardErrors.numero}</p>
                      )}
                    </div>

                    {/* Holder Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nombre del Titular
                      </label>
                      <input
                        type="text"
                        value={cardData.titular}
                        onChange={(e) => {
                          setCardData(prev => ({ ...prev, titular: e.target.value.toUpperCase() }))
                          setCardErrors(prev => ({ ...prev, titular: '' }))
                        }}
                        placeholder="NOMBRE APELLIDO"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          cardErrors.titular ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {cardErrors.titular && (
                        <p className="text-red-500 text-sm mt-1">{cardErrors.titular}</p>
                      )}
                    </div>

                    {/* Expiration & CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Fecha de Expiracion
                        </label>
                        <input
                          type="text"
                          value={cardData.expiracion}
                          onChange={(e) => handleExpirationChange(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            cardErrors.expiracion ? 'border-red-300' : 'border-slate-300'
                          }`}
                        />
                        {cardErrors.expiracion && (
                          <p className="text-red-500 text-sm mt-1">{cardErrors.expiracion}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setCardData(prev => ({ ...prev, cvv: value }))
                            setCardErrors(prev => ({ ...prev, cvv: '' }))
                          }}
                          placeholder="123"
                          maxLength={cardData.tipoTarjeta === 'amex' ? 4 : 3}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            cardErrors.cvv ? 'border-red-300' : 'border-slate-300'
                          }`}
                        />
                        {cardErrors.cvv && (
                          <p className="text-red-500 text-sm mt-1">{cardErrors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accepted Cards */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Tarjetas aceptadas:</p>
                    <div className="flex gap-3">
                      <svg className="w-10 h-6 opacity-60" viewBox="0 0 48 32" fill="none">
                        <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                        <path d="M19.5 21H17L18.8 11H21.3L19.5 21Z" fill="white"/>
                      </svg>
                      <svg className="w-10 h-6 opacity-60" viewBox="0 0 48 32" fill="none">
                        <rect width="48" height="32" rx="4" fill="#000"/>
                        <circle cx="18" cy="16" r="6" fill="#EB001B"/>
                        <circle cx="30" cy="16" r="6" fill="#F79E1B"/>
                      </svg>
                      <svg className="w-10 h-6 opacity-60" viewBox="0 0 48 32" fill="none">
                        <rect width="48" height="32" rx="4" fill="#006FCF"/>
                        <path d="M14 18H10L12 12H16L14 18Z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Pago Presencial */}
              {metodo === 'EFECTIVO' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Pago Presencial</h2>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex gap-3">
                      <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-amber-800">Instrucciones</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Al seleccionar esta opcion, tu reserva quedara en estado pendiente. Deberas pagar el monto total al llegar a nuestras instalaciones antes de usar la cancha.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Llega 15 minutos antes de tu reserva</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Acepta efectivo o tarjeta en recepcion</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Presenta tu codigo de reserva</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Resumen de Reserva */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Resumen</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Cancha</span>
                    <span className="font-medium text-slate-800">{reserva.cancha.nombre}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Tipo</span>
                    <span className="font-medium text-slate-800">{reserva.cancha.tipo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Fecha</span>
                    <span className="font-medium text-slate-800">{formatFecha(reserva.fecha)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Horario</span>
                    <span className="font-medium text-slate-800">{reserva.horaInicio} - {reserva.horaFin}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-slate-800">Total a pagar</span>
                    <span className="text-2xl font-bold text-blue-600">${reserva.cancha.precioPorHora}</span>
                  </div>

                  <button
                    onClick={handlePagar}
                    disabled={procesando || !metodo}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {procesando ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>{metodo === 'EFECTIVO' ? 'Confirmar Reserva' : `Pagar $${reserva.cancha.precioPorHora}`}</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center mt-3">
                    {metodo === 'TARJETA'
                      ? 'Pago seguro con encriptacion SSL'
                      : metodo === 'EFECTIVO'
                      ? 'Recuerda llegar 15 min antes'
                      : 'Selecciona un metodo de pago'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
