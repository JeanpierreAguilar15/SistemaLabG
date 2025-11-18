'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface Cita {
  codigo_cita: number
  codigo_paciente: number
  codigo_slot: number
  estado: string
  observaciones: string | null
  fecha_creacion: string
  paciente: {
    nombres: string
    apellidos: string
    email: string
    telefono: string | null
  }
  slot: {
    fecha: string
    hora_inicio: string
    hora_fin: string
    servicio: {
      nombre: string
    }
  }
}

export default function CitasAdminPage() {
  const { accessToken } = useAuthStore()
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODAS')
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadCitas()
  }, [filtro])

  const loadCitas = async () => {
    try {
      const params = new URLSearchParams()
      if (filtro !== 'TODAS') params.append('estado', filtro)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCitas(data)
      }
    } catch (error) {
      console.error('Error loading citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (codigo_cita: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas/${codigo_cita}/confirm`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cita confirmada correctamente' })
        loadCitas()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al confirmar cita' })
    }
  }

  const handleUpdateEstado = async (codigo_cita: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/admin/citas/${codigo_cita}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Cita marcada como ${nuevoEstado}` })
        loadCitas()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar cita' })
    }
  }

  const filteredCitas = citas.filter((cita) => {
    const matchSearch =
      searchTerm === '' ||
      cita.paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.paciente.email.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-lab-warning-100 text-lab-warning-800'
      case 'CONFIRMADA':
        return 'bg-lab-info-100 text-lab-info-800'
      case 'COMPLETADA':
        return 'bg-lab-success-100 text-lab-success-800'
      case 'CANCELADA':
        return 'bg-lab-danger-100 text-lab-danger-800'
      case 'NO_ASISTIO':
        return 'bg-lab-neutral-100 text-lab-neutral-800'
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
      <div>
        <h1 className="text-3xl font-bold text-lab-neutral-900">Gestión de Citas</h1>
        <p className="text-lab-neutral-600 mt-2">Administra todas las citas programadas del sistema</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-lab-success-50 text-lab-success-800 border border-lab-success-200'
              : 'bg-lab-danger-50 text-lab-danger-800 border border-lab-danger-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buscar Paciente</Label>
              <Input
                placeholder="Nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Estado</Label>
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-lab-neutral-300"
              >
                <option value="TODAS">Todas</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="COMPLETADA">Completadas</option>
                <option value="CANCELADA">Canceladas</option>
                <option value="NO_ASISTIO">No Asistió</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Citas ({filteredCitas.length})</CardTitle>
          <CardDescription>Lista de citas programadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lab-neutral-200">
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Paciente</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Fecha y Hora</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Servicio</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Estado</th>
                  <th className="text-left p-4 font-semibold text-lab-neutral-900">Contacto</th>
                  <th className="text-right p-4 font-semibold text-lab-neutral-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCitas.map((cita) => (
                  <tr key={cita.codigo_cita} className="border-b border-lab-neutral-100 hover:bg-lab-neutral-50">
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">
                        {cita.paciente.nombres} {cita.paciente.apellidos}
                      </div>
                      <div className="text-sm text-lab-neutral-600">{cita.paciente.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-lab-neutral-900">{formatDate(new Date(cita.slot.fecha))}</div>
                      <div className="text-sm text-lab-neutral-600">
                        {cita.slot.hora_inicio} - {cita.slot.hora_fin}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-700">{cita.slot.servicio.nombre}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-lab-neutral-600">{cita.paciente.telefono || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {cita.estado === 'PENDIENTE' && (
                          <Button size="sm" onClick={() => handleConfirm(cita.codigo_cita)}>
                            Confirmar
                          </Button>
                        )}
                        {cita.estado === 'CONFIRMADA' && (
                          <>
                            <Button size="sm" onClick={() => handleUpdateEstado(cita.codigo_cita, 'COMPLETADA')}>
                              Completar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateEstado(cita.codigo_cita, 'NO_ASISTIO')}
                            >
                              No Asistió
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCitas.length === 0 && (
              <div className="text-center py-12 text-lab-neutral-500">No se encontraron citas</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
