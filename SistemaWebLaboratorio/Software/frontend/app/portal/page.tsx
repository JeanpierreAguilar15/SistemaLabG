'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getGreeting, formatDate } from '@/lib/utils'

interface DashboardStats {
  resultadosListos: number
  resultadosEnProceso: number
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { accessToken } = useAuthStore()
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    resultadosListos: 0,
    resultadosEnProceso: 0,
  })

  useEffect(() => {
    setGreeting(getGreeting())
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resultados/my/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      // Stats will show 0s if API is unavailable
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'Resultados Listos',
      value: stats.resultadosListos.toString(),
      description: 'Disponibles para descargar',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'green',
      href: '/portal/resultados',
    },
    {
      title: 'En Proceso',
      value: stats.resultadosEnProceso.toString(),
      description: 'Resultados pendientes',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'orange',
      href: '/portal/resultados',
    },
  ]

  const quickActions = [
    {
      title: 'Ver Resultados',
      description: 'Consulta y descarga tus resultados',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      href: '/portal/resultados',
      color: 'bg-lab-success-600',
    },
    {
      title: 'Mi Perfil',
      description: 'Actualiza tu información personal',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      href: '/portal/perfil',
      color: 'bg-lab-neutral-600',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-lab-primary-600 to-lab-primary-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">
          {greeting}, {user?.nombres}!
        </h1>
        <p className="text-lab-primary-100 text-sm sm:text-lg">
          Bienvenido a tu portal. Aquí puedes consultar y descargar tus resultados.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statsCards.map((stat, index) => {
          const colorClasses = {
            blue: 'bg-lab-primary-50 text-lab-primary-700',
            green: 'bg-lab-success-50 text-lab-success-700',
            orange: 'bg-lab-warning-50 text-lab-warning-700',
            purple: 'bg-purple-50 text-purple-700',
          }

          return (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-lab-neutral-200 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-lab-neutral-900 mb-1">{stat.value}</h3>
                  <p className="text-sm font-medium text-lab-neutral-700 mb-1">{stat.title}</p>
                  <p className="text-xs text-lab-neutral-500">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-lab-neutral-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-lab-neutral-200 h-full group">
                <CardContent className="p-6">
                  <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lab-neutral-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-lab-neutral-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-lab-primary-50 to-lab-success-50 border-lab-primary-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-lab-primary-600 text-white rounded-full p-3 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lab-neutral-900 mb-2">
                Información Importante
              </h3>
              <p className="text-sm text-lab-neutral-700 mb-3">
                Recuerda que para algunos exámenes es necesario preparación previa como ayuno.
                Consulta las instrucciones específicas de cada examen antes de realizarlo.
              </p>
              <Link href="/portal/resultados" className="text-sm font-medium text-lab-primary-700 hover:text-lab-primary-800 hover:underline">
                Ver mis resultados →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
