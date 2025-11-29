'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Pago {
  codigo_pago: number
  numero_pago: string
  fecha_pago: string
  monto_total: number
  metodo_pago: string
  estado: string
  proveedor_pasarela?: string
  cotizacion?: {
    numero_cotizacion: string
    total: number
    detalles: Array<{
      examen: { nombre: string }
      cantidad: number
    }>
  }
}

interface Cotizacion {
  codigo_cotizacion: number
  numero_cotizacion: string
  fecha_cotizacion: string
  subtotal: number
  descuento: number
  total: number
  estado: string
  fecha_expiracion: string
  detalles: Array<{
    codigo_detalle_cotizacion: number
    cantidad: number
    precio_unitario: number
    total_linea: number
    examen: {
      codigo_examen: number
      nombre: string
      codigo_interno: string
    }
  }>
}

interface StripeConfig {
  publicKey: string | null
  isConfigured: boolean
}

export default function PagosPage() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const cotizacionParam = searchParams.get('cotizacion')

  const [loading, setLoading] = useState(false)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState<Cotizacion[]>([])
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [processingPayment, setProcessingPayment] = useState<number | null>(null)

  useEffect(() => {
    loadData()
    loadStripeConfig()
  }, [])

  // Verificar si venimos de un pago completado
  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId)
    }
  }, [sessionId])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadPagos(), loadCotizacionesPendientes()])
    setLoading(false)
  }

  const loadPagos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos/my`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPagos(data)
      }
    } catch (error) {
      console.error('Error loading pagos:', error)
    }
  }

  const loadCotizacionesPendientes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cotizaciones/mis-cotizaciones`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        // Filtrar solo las pendientes y no expiradas
        const pendientes = data.filter((c: Cotizacion) =>
          c.estado === 'PENDIENTE' && new Date(c.fecha_expiracion) > new Date()
        )
        setCotizacionesPendientes(pendientes)
      }
    } catch (error) {
      console.error('Error loading cotizaciones:', error)
    }
  }

  const loadStripeConfig = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos/stripe/config`)
      if (response.ok) {
        const data = await response.json()
        setStripeConfig(data)
      }
    } catch (error) {
      console.error('Error loading Stripe config:', error)
    }
  }

  const verifyPayment = async (sessionId: string) => {
    try {
      setMessage({ type: 'info', text: 'Verificando pago...' })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pagos/stripe/session?session_id=${sessionId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (response.ok) {
        const session = await response.json()

        if (session.payment_status === 'paid') {
          setMessage({ type: 'success', text: 'Pago procesado exitosamente. Gracias por tu compra.' })
          loadData() // Recargar datos
        } else {
          setMessage({ type: 'error', text: 'El pago no se completó correctamente.' })
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      setMessage({ type: 'error', text: 'Error al verificar el pago' })
    }
  }

  const handlePagarConStripe = async (cotizacion: Cotizacion) => {
    if (!stripeConfig?.isConfigured) {
      setMessage({ type: 'error', text: 'El sistema de pagos no está configurado' })
      return
    }

    setProcessingPayment(cotizacion.codigo_cotizacion)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          codigo_cotizacion: cotizacion.codigo_cotizacion,
          success_url: `${window.location.origin}/portal/pagos`,
          cancel_url: `${window.location.origin}/portal/pagos`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirigir a Stripe Checkout
        window.location.href = data.url
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Error al crear sesión de pago' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al servidor' })
    } finally {
      setProcessingPayment(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'PENDIENTE':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'RECHAZADO':
      case 'FALLIDO':
        return 'bg-lab-danger-100 text-lab-danger-800'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-800'
    }
  }

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'TARJETA_CREDITO':
      case 'TARJETA_DEBITO':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )
      case 'EFECTIVO':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'TRANSFERENCIA':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Mis Pagos</h1>
        <p className="text-lab-neutral-600 mt-2">Gestiona tus pagos y realiza nuevas transacciones</p>
      </div>

      {/* Mensaje */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : message.type === 'error'
              ? 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
              : 'bg-lab-info-50 text-lab-info-800 border border-lab-info-200'
          }`}
        >
          {message.type === 'success' && (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.type === 'error' && (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.type === 'info' && (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-lab-info-600"></div>
          )}
          {message.text}
        </div>
      )}

      {/* Cotizaciones Pendientes de Pago */}
      {cotizacionesPendientes.length > 0 && (
        <Card className="border-lab-primary-200 bg-lab-primary-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-lab-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Cotizaciones Pendientes de Pago
            </CardTitle>
            <CardDescription>
              Tienes {cotizacionesPendientes.length} cotización{cotizacionesPendientes.length !== 1 && 'es'} pendiente{cotizacionesPendientes.length !== 1 && 's'} de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cotizacionesPendientes.map((cotizacion) => (
                <div
                  key={cotizacion.codigo_cotizacion}
                  className="bg-white rounded-lg border border-lab-neutral-200 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lab-neutral-900">
                          {cotizacion.numero_cotizacion}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded bg-lab-warning-100 text-lab-warning-800">
                          Pendiente
                        </span>
                      </div>
                      <p className="text-sm text-lab-neutral-600 mb-1">
                        Creada: {formatDate(new Date(cotizacion.fecha_cotizacion))}
                      </p>
                      <p className="text-sm text-lab-neutral-500">
                        {cotizacion.detalles.length} examen{cotizacion.detalles.length !== 1 && 'es'} •
                        Expira: {formatDate(new Date(cotizacion.fecha_expiracion))}
                      </p>
                      <div className="mt-2">
                        <ul className="text-sm text-lab-neutral-600">
                          {cotizacion.detalles.slice(0, 3).map((d, i) => (
                            <li key={i}>- {d.examen.nombre}</li>
                          ))}
                          {cotizacion.detalles.length > 3 && (
                            <li className="text-lab-neutral-500">
                              ... y {cotizacion.detalles.length - 3} más
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        {Number(cotizacion.descuento) > 0 && (
                          <p className="text-sm text-lab-neutral-500 line-through">
                            ${Number(cotizacion.subtotal).toFixed(2)}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-lab-primary-600">
                          ${Number(cotizacion.total).toFixed(2)}
                        </p>
                        {Number(cotizacion.descuento) > 0 && (
                          <p className="text-sm text-lab-success-600">
                            Ahorro: ${Number(cotizacion.descuento).toFixed(2)}
                          </p>
                        )}
                      </div>

                      {stripeConfig?.isConfigured ? (
                        <Button
                          onClick={() => handlePagarConStripe(cotizacion)}
                          disabled={processingPayment === cotizacion.codigo_cotizacion}
                          className="w-full md:w-auto"
                        >
                          {processingPayment === cotizacion.codigo_cotizacion ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Procesando...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Pagar con Tarjeta
                            </>
                          )}
                        </Button>
                      ) : (
                        <p className="text-sm text-lab-neutral-500 italic">
                          Pagos en línea no disponibles
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Todos tus pagos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lab-primary-600"></div>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-lab-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lab-neutral-500">No tienes pagos registrados</p>
              <p className="text-sm text-lab-neutral-400 mt-1">
                Los pagos aparecerán aquí cuando realices una transacción
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagos.map((pago) => (
                <div
                  key={pago.codigo_pago}
                  className="flex items-center justify-between p-4 rounded-lg border border-lab-neutral-200 hover:bg-lab-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      pago.estado === 'COMPLETADO' ? 'bg-lab-success-100 text-lab-success-600' : 'bg-lab-neutral-100 text-lab-neutral-600'
                    }`}>
                      {getMetodoPagoIcon(pago.metodo_pago)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lab-neutral-900">{pago.numero_pago}</h4>
                      <p className="text-sm text-lab-neutral-600">
                        {formatDate(new Date(pago.fecha_pago))} • {pago.metodo_pago.replace('_', ' ')}
                        {pago.proveedor_pasarela && ` (${pago.proveedor_pasarela})`}
                      </p>
                      {pago.cotizacion && (
                        <p className="text-xs text-lab-neutral-500 mt-1">
                          Cotización: {pago.cotizacion.numero_cotizacion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(pago.estado)}`}>
                      {pago.estado}
                    </span>
                    <span className="text-lg font-bold text-lab-neutral-900">
                      ${Number(pago.monto_total).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de Métodos de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-lab-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Métodos de Pago Aceptados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-lab-neutral-50 rounded-lg">
              <div className="w-10 h-10 bg-lab-primary-100 rounded-lg flex items-center justify-center text-lab-primary-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-lab-neutral-900">Tarjeta de Crédito/Débito</p>
                <p className="text-sm text-lab-neutral-600">Visa, Mastercard, American Express</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-lab-neutral-50 rounded-lg">
              <div className="w-10 h-10 bg-lab-success-100 rounded-lg flex items-center justify-center text-lab-success-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-lab-neutral-900">Efectivo</p>
                <p className="text-sm text-lab-neutral-600">En nuestras sedes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-lab-neutral-50 rounded-lg">
              <div className="w-10 h-10 bg-lab-info-100 rounded-lg flex items-center justify-center text-lab-info-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-lab-neutral-900">Transferencia Bancaria</p>
                <p className="text-sm text-lab-neutral-600">Bancos nacionales</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
