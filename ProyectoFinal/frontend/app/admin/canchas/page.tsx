'use client'

import { useEffect, useState } from 'react'
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

export default function AdminCanchasPage() {
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cancha | null>(null)

  useEffect(() => {
    cargarCanchas()
  }, [])

  const cargarCanchas = async () => {
    try {
      const data = await api.getCanchas()
      setCanchas(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleNueva = () => {
    setEditando(null)
    setModalOpen(true)
  }

  const handleEditar = (cancha: Cancha) => {
    setEditando(cancha)
    setModalOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Canchas</h1>
        <button onClick={handleNueva} className="btn-primary">
          + Nueva Cancha
        </button>
      </div>

      {/* Grid de Canchas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canchas.map((cancha) => (
            <div key={cancha.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className={`h-32 flex items-center justify-center ${
                cancha.tipo === 'FUTBOL' ? 'bg-green-500' :
                cancha.tipo === 'TENIS' ? 'bg-yellow-500' : 'bg-orange-500'
              }`}>
                <span className="text-6xl">{tipoIcons[cancha.tipo]}</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{cancha.nombre}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    cancha.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {cancha.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{cancha.descripcion}</p>
                <p className="text-primary-600 font-bold mb-4">Bs. {cancha.precioPorHora}/hora</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditar(cancha)}
                    className="flex-1 btn-secondary text-sm"
                  >
                    Editar
                  </button>
                  <button className="flex-1 text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Horarios
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edición (simplificado) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editando ? 'Editar Cancha' : 'Nueva Cancha'}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  defaultValue={editando?.nombre}
                  className="input-field"
                  placeholder="Nombre de la cancha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select defaultValue={editando?.tipo || ''} className="input-field">
                  <option value="">Seleccionar</option>
                  <option value="FUTBOL">Fútbol</option>
                  <option value="TENIS">Tenis</option>
                  <option value="BASQUET">Básquet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  defaultValue={editando?.descripcion}
                  className="input-field"
                  rows={3}
                  placeholder="Descripción de la cancha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Hora (Bs.)</label>
                <input
                  type="number"
                  defaultValue={editando?.precioPorHora}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
