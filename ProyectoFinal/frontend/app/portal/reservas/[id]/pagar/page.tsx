'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

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
  { id: 'TARJETA', nombre: 'Tarjeta de Crédito/Débito', icon: '💳' },
  { id: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria', icon: '🏦' },
  { id: 'EFECTIVO', nombre: 'Pago en Efectivo (en local)', icon: '💵' },
]

export default function PagarReservaPage() {
  const params = useParams()
  const router = useRouter()
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
      .catch(() => router.push('/portal/reservas'))
      .finally(() => setLoading(false))
  }, [reservaId, router])

  const handlePagar = async () => {
    if (!metodo) {
      setError('Selecciona un método de pago')
      return
    }

    setProcesando(true)
    setError('')

    try {
      const resultado = await api.procesarPago({
        reservaId,
        metodo,
      })
      setExito(resultado)
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setProcesando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!reserva) return null

  // Si el pago fue exitoso, mostrar comprobante
  if (exito) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h1>
          <p className="text-gray-600 mb-6">Tu reserva ha sido confirmada</p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <h3 className="font-semibold mb-3">Comprobante de Pago</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Referencia:</span> <strong>{exito.comprobante.referencia}</strong></p>
              <p><span className="text-gray-500">Cancha:</span> {exito.comprobante.cancha}</p>
              <p><span className="text-gray-500">Fecha:</span> {new Date(exito.comprobante.fechaReserva).toLocaleDateString('es-ES')}</p>
              <p><span className="text-gray-500">Horario:</span> {exito.comprobante.horario}</p>
              <p><span className="text-gray-500">Monto:</span> <strong>Bs. {exito.comprobante.monto}</strong></p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Se ha enviado un correo de confirmación con los detalles de tu reserva.
          </p>

          <div className="space-y-2">
            <Link href="/portal/reservas" className="btn-primary w-full block">
              Ver mis reservas
            </Link>
            <Link href="/canchas" className="btn-secondary w-full block">
              Hacer otra reserva
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/portal/reservas" className="text-gray-500 hover:text-gray-700 text-sm mb-4 inline-block">
        ← Volver a mis reservas
      </Link>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Completar Pago</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resumen de Reserva */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Resumen de Reserva</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Cancha</span>
              <span className="font-medium">{reserva.cancha.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha</span>
              <span className="font-medium">{formatFecha(reserva.fecha)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Horario</span>
              <span className="font-medium">{reserva.horaInicio} - {reserva.horaFin}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total a pagar</span>
              <span className="font-bold text-primary-600">Bs. {reserva.cancha.precioPorHora}</span>
            </div>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Método de Pago</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {metodosPago.map((m) => (
              <label
                key={m.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  metodo === m.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
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
                <span className="text-2xl mr-3">{m.icon}</span>
                <span className="font-medium">{m.nombre}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handlePagar}
            disabled={procesando || !metodo}
            className="w-full btn-primary mt-6 py-3"
          >
            {procesando ? 'Procesando...' : `Pagar Bs. ${reserva.cancha.precioPorHora}`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Al confirmar el pago, aceptas nuestros términos y condiciones.
          </p>
        </div>
      </div>
    </div>
  )
}
