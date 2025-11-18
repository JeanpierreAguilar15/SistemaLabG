'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

interface Resultado {
  codigo_resultado: number
  codigo_paciente: number
  codigo_examen: number
  fecha_resultado: string
  valor_obtenido: string
  valor_numerico: number | null
  nivel: string
  observaciones: string | null
  estado: string
  paciente: {
    nombres: string
    apellidos: string
    email: string
  }
  examen: {
    nombre: string
    codigo_interno: string
  }
}

export default function ResultadosAdminPage() {
  const { accessToken } = useAuthStore()
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadResultados()
  }, [])

  const loadResultados = async () => {
    try {
      // Este endpoint necesitaría implementarse en el backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/resultados`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setResultados(data)
      }
    } catch (error) {
      console.error('Error loading resultados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredResultados = resultados.filter((resultado) => {
    const matchSearch =
      searchTerm === '' ||
      resultado.paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resultado.paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resultado.examen.nombre.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'NORMAL':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'BAJO':
        return 'bg-lab-info-100 text-lab-info-800'
      case 'ALTO':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'CRITICO':
        return 'bg-lab-danger-100 text-lab-danger-800'
      default:
        return 'bg-lab-neutral-100 text-lab-neutral-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lab-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Resultados</h1>
          <p className="text-lab-neutral-600 mt-2">
            Administra los resultados de exámenes de laboratorio
          </p>
        </div>
        <Button>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Resultado
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por paciente o examen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Resultados Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados ({filteredResultados.length})</CardTitle>
          <CardDescription>Lista de resultados de laboratorio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Paciente</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Examen</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Valor</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Nivel</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredResultados.map((resultado) => (
                  <tr
                    key={resultado.codigo_resultado}
                    className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50"
                  >
                    <td className="p-4 text-sm text-lab-neutral-700">
                      {formatDate(new Date(resultado.fecha_resultado))}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">
                        {resultado.paciente.nombres} {resultado.paciente.apellidos}
                      </div>
                      <div className="text-sm text-lab-neutral-600">{resultado.paciente.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">{resultado.examen.nombre}</div>
                      <div className="text-sm text-lab-neutral-600">{resultado.examen.codigo_interno}</div>
                    </td>
                    <td className="p-4 font-semibold text-lab-neutral-900">{resultado.valor_obtenido}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${getNivelBadge(resultado.nivel)}`}>
                        {resultado.nivel}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-700">{resultado.estado}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                      <Button size="sm" variant="outline">
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResultados.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">
                No se encontraron resultados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
