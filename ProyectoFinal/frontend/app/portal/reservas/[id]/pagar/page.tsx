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

const metodosPago = [
  { id: 'TARJETA', nombre: 'Tarjeta de Credito/Debito', icon: '💳', desc: 'Visa, Mastercard, American Express' },
  { id: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria', icon: '🏦', desc: 'Pago directo desde tu banco' },
  { id: 'EFECTIVO', nombre: 'Pago en Efectivo', icon: '💵', desc: 'Paga al llegar al local' },
]

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

  useEffect(() => {
    api.getReserva(reservaId)
      .then(setReserva)
      .catch(() => {
        showError('No se pudo cargar la reserva')
        router.push('/portal/reservas')
      })
      .finally(() => setLoading(false))
  }, [reservaId, router])

  const handlePagar = async () => {
    if (!metodo) {
      showWarning('Selecciona un metodo de pago')
      setError('Selecciona un metodo de pago')
      return
    }

    setProcesando(true)
    setError('')
    showInfo('Procesando tu pago...')

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600">Cargando reserva...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reserva) return null

  // Si el pago fue exitoso, mostrar comprobante
  if (exito) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 pt-24">
          <div className="max-w-lg mx-auto">
            <div className="card text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pago Exitoso!</h1>
              <p className="text-gray-600 mb-8">Tu reserva ha sido confirmada</p>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 text-left mb-8 border border-blue-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Comprobante de Pago</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-blue-100">
                    <span className="text-gray-500">Referencia</span>
                    <span className="font-bold text-blue-600">{exito.comprobante.referencia}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blue-100">
                    <span className="text-gray-500">Cancha</span>
                    <span className="font-medium">{exito.comprobante.cancha}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blue-100">
                    <span className="text-gray-500">Fecha</span>
                    <span className="font-medium">{new Date(exito.comprobante.fechaReserva).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blue-100">
                    <span className="text-gray-500">Horario</span>
                    <span className="font-medium">{exito.comprobante.horario}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Monto pagado</span>
                    <span className="font-bold text-2xl text-green-600">${exito.comprobante.monto}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 mb-8 flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-green-700">
                  Se ha enviado un correo de confirmacion con los detalles de tu reserva.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/portal/reservas" className="btn-primary w-full block text-center">
                  Ver mis reservas
                </Link>
                <Link href="/canchas" className="btn-secondary w-full block text-center">
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
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="max-w-3xl mx-auto">
          <Link href="/portal/reservas" className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver a mis reservas</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Completar Pago</h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Resumen de Reserva */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Resumen de Reserva</span>
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Cancha</span>
                  <span className="font-semibold text-gray-900">{reserva.cancha.nombre}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-semibold text-gray-900">{formatFecha(reserva.fecha)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Horario</span>
                  <span className="font-semibold text-gray-900">{reserva.horaInicio} - {reserva.horaFin}</span>
                </div>
                <div className="flex justify-between py-4 bg-blue-50 rounded-xl px-4 -mx-4">
                  <span className="font-bold text-gray-900">Total a pagar</span>
                  <span className="font-bold text-2xl text-blue-600">${reserva.cancha.precioPorHora}</span>
                </div>
              </div>
            </div>

            {/* Metodo de Pago */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Metodo de Pago</span>
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center space-x-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                {metodosPago.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      metodo === m.id
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodo"
                      value={m.id}
                      checked={metodo === m.id}
                      onChange={(e) => setMetodo(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-3xl mr-4">{m.icon}</span>
                    <div>
                      <span className="font-semibold text-gray-900 block">{m.nombre}</span>
                      <span className="text-sm text-gray-500">{m.desc}</span>
                    </div>
                    {metodo === m.id && (
                      <svg className="w-6 h-6 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={handlePagar}
                disabled={procesando || !metodo}
                className="w-full btn-primary mt-6 py-4 flex items-center justify-center space-x-2"
              >
                {procesando ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Procesando pago...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Pagar ${reserva.cancha.precioPorHora}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Al confirmar el pago, aceptas nuestros terminos y condiciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
