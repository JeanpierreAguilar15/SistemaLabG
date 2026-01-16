'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'

interface Cancha {
  id: string
  nombre: string
  tipo: string
  descripcion: string
  precioPorHora: number
  activa: boolean
}

const tipoIcons: Record<string, string> = {
  FUTBOL: '⚽',
  TENIS: '🎾',
  BASQUET: '🏀',
}

const tipoGradients: Record<string, string> = {
  FUTBOL: 'sport-gradient-futbol',
  TENIS: 'sport-gradient-tenis',
  BASQUET: 'sport-gradient-basquet',
}

const tipoBadgeColors: Record<string, string> = {
  FUTBOL: 'bg-emerald-100 text-emerald-700',
  TENIS: 'bg-amber-100 text-amber-700',
  BASQUET: 'bg-orange-100 text-orange-700',
}

const tipoLabels: Record<string, string> = {
  FUTBOL: 'Futbol',
  TENIS: 'Tenis',
  BASQUET: 'Basquet',
}

export default function CanchasPage() {
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string>('')

  useEffect(() => {
    api.getCanchas(filtro)
      .then(setCanchas)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filtro])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <header className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 animated-gradient"></div>
        <div className="absolute inset-0 pattern-dots"></div>
        <div className="relative container mx-auto px-4">
          <Link href="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white text-sm mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver al inicio</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nuestras Canchas</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Selecciona una cancha para ver disponibilidad y reservar. Todas nuestras instalaciones cuentan con equipamiento de primera calidad.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 -mt-8">
        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => setFiltro('')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filtro === ''
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltro('FUTBOL')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
              filtro === 'FUTBOL'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>⚽</span>
            <span>Futbol</span>
          </button>
          <button
            onClick={() => setFiltro('TENIS')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
              filtro === 'TENIS'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🎾</span>
            <span>Tenis</span>
          </button>
          <button
            onClick={() => setFiltro('BASQUET')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
              filtro === 'BASQUET'
                ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🏀</span>
            <span>Basquet</span>
          </button>
        </div>

        {/* Lista de Canchas */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600 text-lg">Cargando canchas...</p>
          </div>
        ) : canchas.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {canchas.map((cancha) => (
              <Link
                key={cancha.id}
                href={`/canchas/${cancha.id}`}
                className="group card-hover overflow-hidden"
              >
                {/* Card Image */}
                <div className={`relative h-48 ${tipoGradients[cancha.tipo]} rounded-xl mb-6 overflow-hidden`}>
                  <div className="absolute inset-0 pattern-dots opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="sport-icon bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                      <span className="text-5xl">{tipoIcons[cancha.tipo]}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent"></div>

                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${tipoBadgeColors[cancha.tipo]}`}>
                      {tipoLabels[cancha.tipo]}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {cancha.nombre}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {cancha.descripcion}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">${cancha.precioPorHora}</span>
                      <span className="text-gray-500 text-sm">/hora</span>
                    </div>
                    <span className="inline-flex items-center space-x-1 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Ver horarios</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-gray-500">No hay canchas disponibles</p>
            <p className="text-gray-400 mt-2">Intenta con otro filtro</p>
          </div>
        )}
      </main>
    </div>
  )
}
