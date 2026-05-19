'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { getGreeting } from '@/lib/utils'

interface DashboardStats {
  resultadosListos: number
  resultadosEnProceso: number
}

const defaultStats: DashboardStats = {
  resultadosListos: 0,
  resultadosEnProceso: 0,
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [stats, setStats] = useState<DashboardStats>(defaultStats)

  const loadDashboardData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/my/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error('No se pudo consultar el resumen de resultados')
      }

      const data = await response.json()
      setStats({
        resultadosListos: Number(data?.stats?.resultadosListos || 0),
        resultadosEnProceso: Number(data?.stats?.resultadosEnProceso || 0),
      })
      setLastUpdated(new Date())
    } catch {
      setStats(defaultStats)
      setError('No se pudo cargar el resumen. Intenta actualizar o consulta Mis Resultados.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const greeting = useMemo(() => getGreeting(), [])
  const totalResultados = stats.resultadosListos + stats.resultadosEnProceso

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-lab-primary-600" />
          <p className="text-sm text-lab-neutral-600">Cargando resumen del paciente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-lab-primary-700 via-lab-primary-600 to-lab-success-600 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-lab-primary-100">Laboratorio Franz</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              {greeting}, {user?.nombres || 'paciente'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-lab-primary-50 sm:text-base">
              Consulta tus resultados disponibles, revisa el estado de los que siguen en proceso y mantiene tus datos de contacto actualizados.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <p className="text-lab-primary-100">Ultima actualizacion</p>
            <p className="font-semibold">{lastUpdated ? lastUpdated.toLocaleString('es-EC') : 'Sin sincronizar'}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-lab-warning-200 bg-lab-warning-50 p-4 text-sm text-lab-warning-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              onClick={loadDashboardData}
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-lab-warning-900 shadow-sm hover:bg-lab-warning-100"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <StatusCard
          title="Resultados listos"
          value={stats.resultadosListos}
          description="Disponibles para revisar o descargar"
          href="/portal/resultados"
          tone="success"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"
        />
        <StatusCard
          title="En proceso"
          value={stats.resultadosEnProceso}
          description="Pendientes de validacion o publicacion"
          href="/portal/resultados"
          tone="warning"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatusCard
          title="Total visible"
          value={totalResultados}
          description="Resultados asociados a tu cuenta"
          href="/portal/resultados"
          tone="info"
          icon="M3 4a1 1 0 011-1h16a1 1 0 011 1v2H3V4zm0 4h18v12a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm4 3h10v2H7v-2zm0 4h7v2H7v-2z"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ActionCard
          title="Mis Resultados"
          description="Ver resultados agrupados por muestra, revisar valores y descargar PDF cuando este disponible."
          href="/portal/resultados"
          buttonLabel="Abrir resultados"
          tone="primary"
        />
        <ActionCard
          title="Mi Perfil"
          description="Actualizar telefono, direccion, contacto de emergencia, consentimientos y contrasena."
          href="/portal/perfil"
          buttonLabel="Abrir perfil"
          tone="neutral"
        />
      </section>

      <Card className="border-lab-primary-200 bg-gradient-to-r from-lab-primary-50 to-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lab-primary-600 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-lab-neutral-900">Informacion importante</h2>
              <p className="mt-2 text-sm text-lab-neutral-700">
                El portal esta enfocado en resultados, datos personales, consentimientos y seguridad de la cuenta.
              </p>
              <Link href="/portal/resultados" className="mt-3 inline-flex text-sm font-medium text-lab-primary-700 hover:text-lab-primary-800 hover:underline">
                Ir a mis resultados
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusCard({
  title,
  value,
  description,
  href,
  tone,
  icon,
}: {
  title: string
  value: number
  description: string
  href: string
  tone: 'success' | 'warning' | 'info'
  icon: string
}) {
  const toneClasses = {
    success: 'bg-lab-success-50 text-lab-success-700 border-lab-success-200',
    warning: 'bg-lab-warning-50 text-lab-warning-700 border-lab-warning-200',
    info: 'bg-lab-info-50 text-lab-info-700 border-lab-info-200',
  }

  return (
    <Link href={href}>
      <Card className="h-full border-lab-neutral-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-lab-neutral-600">{title}</p>
              <p className="mt-3 text-4xl font-bold text-lab-neutral-900">{value}</p>
            </div>
            <div className={`rounded-2xl border p-3 ${toneClasses[tone]}`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-sm text-lab-neutral-500">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function ActionCard({
  title,
  description,
  href,
  buttonLabel,
  tone,
}: {
  title: string
  description: string
  href: string
  buttonLabel: string
  tone: 'primary' | 'neutral'
}) {
  const buttonClass =
    tone === 'primary'
      ? 'bg-lab-primary-600 text-white hover:bg-lab-primary-700'
      : 'bg-lab-neutral-900 text-white hover:bg-lab-neutral-800'

  return (
    <Card className="h-full border-lab-neutral-200">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div>
          <h2 className="text-xl font-semibold text-lab-neutral-900">{title}</h2>
          <p className="mt-2 text-sm text-lab-neutral-600">{description}</p>
        </div>
        <Link
          href={href}
          className={`mt-5 inline-flex w-fit rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonClass}`}
        >
          {buttonLabel}
        </Link>
      </CardContent>
    </Card>
  )
}
