'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

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

const tipoColors: Record<string, string> = {
  FUTBOL: 'bg-green-500',
  TENIS: 'bg-yellow-500',
  BASQUET: 'bg-orange-500',
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
      {/* Header */}
      <header className="bg-primary-600 text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-2 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold">Nuestras Canchas</h1>
          <p className="text-white/80 mt-2">Selecciona una cancha para ver disponibilidad y reservar</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFiltro('')}
            className={`px-4 py-2 rounded-full transition-colors ${
              filtro === '' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltro('FUTBOL')}
            className={`px-4 py-2 rounded-full transition-colors ${
              filtro === 'FUTBOL' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚽ Fútbol
          </button>
          <button
            onClick={() => setFiltro('TENIS')}
            className={`px-4 py-2 rounded-full transition-colors ${
              filtro === 'TENIS' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎾 Tenis
          </button>
          <button
            onClick={() => setFiltro('BASQUET')}
            className={`px-4 py-2 rounded-full transition-colors ${
              filtro === 'BASQUET' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🏀 Básquet
          </button>
        </div>

        {/* Lista de Canchas */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando canchas...</p>
          </div>
        ) : canchas.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canchas.map((cancha) => (
              <Link key={cancha.id} href={`/canchas/${cancha.id}`} className="card hover:shadow-lg transition-shadow">
                <div className={`h-40 ${tipoColors[cancha.tipo]} rounded-lg mb-4 flex items-center justify-center`}>
                  <span className="text-6xl">{tipoIcons[cancha.tipo]}</span>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold">{cancha.nombre}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {cancha.tipo}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{cancha.descripcion}</p>
                <div className="flex justify-between items-center">
                  <p className="text-primary-600 font-bold text-lg">
                    Bs. {cancha.precioPorHora}/hora
                  </p>
                  <span className="text-primary-600 hover:underline">
                    Ver disponibilidad →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl">No hay canchas disponibles</p>
          </div>
        )}
      </main>
    </div>
  )
}
