'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store';
import {
  FlaskConical,
  Clock,
  AlertTriangle,
  Play,
  TestTube,
  Trash2,
  RefreshCw,
  Package,
  Timer,
} from 'lucide-react';

interface LoteAbierto {
  codigo_lote: number;
  numero_lote: string;
  item_nombre: string;
  codigo_item: number;
  fecha_apertura: string;
  fecha_vencimiento_abierto: string;
  dias_restantes: number;
  horas_restantes: number;
  pruebas_realizadas: number;
  capacidad_pruebas: number;
  pruebas_restantes: number;
  porcentaje_uso: number;
  estado: string;
}

interface LoteCerrado {
  codigo_lote: number;
  numero_lote: string;
  item: {
    nombre: string;
    es_reactivo: boolean;
    vida_util_dias_abierto: number;
    capacidad_pruebas: number;
  };
  fecha_vencimiento: string;
  cantidad_actual: number;
  estado_lote: string;
}

export default function ReactivosPage() {
  const { token } = useAuthStore();
  const [lotesAbiertos, setLotesAbiertos] = useState<LoteAbierto[]>([]);
  const [lotesCerrados, setLotesCerrados] = useState<LoteCerrado[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAbrirLote, setDialogAbrirLote] = useState(false);
  const [dialogRegistrarPruebas, setDialogRegistrarPruebas] = useState(false);
  const [dialogDescartar, setDialogDescartar] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<number | null>(null);
  const [cantidadPruebas, setCantidadPruebas] = useState('');
  const [motivoDescarte, setMotivoDescarte] = useState('');
  const [observacion, setObservacion] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener lotes abiertos
      const resAbiertos = await fetch(`${API_URL}/admin/inventory/reactivos/lotes-abiertos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resAbiertos.ok) {
        const data = await resAbiertos.json();
        setLotesAbiertos(data);
      }

      // Obtener lotes cerrados (reactivos disponibles para abrir)
      const resLotes = await fetch(`${API_URL}/admin/inventory/lotes?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resLotes.ok) {
        const data = await resLotes.json();
        // Filtrar solo lotes cerrados de items que son reactivos
        const cerrados = data.items?.filter(
          (l: LoteCerrado) => l.estado_lote === 'CERRADO' && l.item?.es_reactivo
        ) || [];
        setLotesCerrados(cerrados);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos de reactivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAbrirLote = async () => {
    if (!loteSeleccionado) return;

    try {
      const res = await fetch(`${API_URL}/admin/inventory/reactivos/abrir-lote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo_lote: loteSeleccionado }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.mensaje || 'Lote abierto exitosamente');
        setDialogAbrirLote(false);
        setLoteSeleccionado(null);
        fetchData();
      } else {
        toast.error(data.message || 'Error al abrir lote');
      }
    } catch (error) {
      toast.error('Error de conexion');
    }
  };

  const handleRegistrarPruebas = async () => {
    if (!loteSeleccionado || !cantidadPruebas) return;

    try {
      const res = await fetch(`${API_URL}/admin/inventory/reactivos/registrar-pruebas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo_lote: loteSeleccionado,
          cantidad_pruebas: parseInt(cantidadPruebas),
          observacion: observacion || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${cantidadPruebas} pruebas registradas. Restantes: ${data.pruebas_restantes}`);
        setDialogRegistrarPruebas(false);
        setLoteSeleccionado(null);
        setCantidadPruebas('');
        setObservacion('');
        fetchData();
      } else {
        toast.error(data.message || 'Error al registrar pruebas');
      }
    } catch (error) {
      toast.error('Error de conexion');
    }
  };

  const handleDescartarLote = async () => {
    if (!loteSeleccionado || !motivoDescarte) return;

    try {
      const res = await fetch(`${API_URL}/admin/inventory/reactivos/descartar-lote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo_lote: loteSeleccionado,
          motivo: motivoDescarte,
          observacion: observacion || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.warning(`Lote descartado. ${data.pruebas_desperdiciadas} pruebas no utilizadas.`);
        setDialogDescartar(false);
        setLoteSeleccionado(null);
        setMotivoDescarte('');
        setObservacion('');
        fetchData();
      } else {
        toast.error(data.message || 'Error al descartar lote');
      }
    } catch (error) {
      toast.error('Error de conexion');
    }
  };

  const getEstadoBadge = (estado: string, horasRestantes: number) => {
    if (estado === 'VENCIDO' || horasRestantes <= 0) {
      return <Badge variant="destructive">VENCIDO</Badge>;
    }
    if (estado === 'CRITICO' || horasRestantes <= 24) {
      return <Badge variant="destructive">CRITICO - {horasRestantes}h</Badge>;
    }
    return <Badge variant="default">{estado}</Badge>;
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            Control de Reactivos
          </h1>
          <p className="text-muted-foreground">
            Gestion de lotes abiertos con vida util limitada
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lotes Abiertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotesAbiertos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Criticos (menos de 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lotesAbiertos.filter(l => l.horas_restantes <= 24 && l.horas_restantes > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {lotesAbiertos.filter(l => l.horas_restantes <= 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibles para Abrir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{lotesCerrados.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lotes Abiertos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Lotes Abiertos en Uso
          </CardTitle>
          <CardDescription>
            Lotes de reactivos que han sido abiertos y tienen vida util limitada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : lotesAbiertos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay lotes abiertos actualmente
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reactivo</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Tiempo Restante</TableHead>
                  <TableHead>Pruebas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotesAbiertos.map((lote) => (
                  <TableRow key={lote.codigo_lote} className={lote.horas_restantes <= 0 ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{lote.item_nombre}</TableCell>
                    <TableCell>{lote.numero_lote}</TableCell>
                    <TableCell className="text-sm">{formatFecha(lote.fecha_apertura)}</TableCell>
                    <TableCell className="text-sm">{formatFecha(lote.fecha_vencimiento_abierto)}</TableCell>
                    <TableCell>
                      {lote.horas_restantes > 24 ? (
                        <span className="text-green-600 font-medium">{lote.dias_restantes} dias</span>
                      ) : lote.horas_restantes > 0 ? (
                        <span className="text-orange-600 font-medium">{lote.horas_restantes}h</span>
                      ) : (
                        <span className="text-red-600 font-bold">VENCIDO</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{lote.pruebas_realizadas} / {lote.capacidad_pruebas}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${lote.porcentaje_uso}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(lote.estado, lote.horas_restantes)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setLoteSeleccionado(lote.codigo_lote);
                            setDialogRegistrarPruebas(true);
                          }}
                          disabled={lote.horas_restantes <= 0}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setLoteSeleccionado(lote.codigo_lote);
                            setDialogDescartar(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lotes Disponibles para Abrir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lotes Cerrados - Disponibles para Abrir
          </CardTitle>
          <CardDescription>
            Lotes de reactivos que aun no han sido abiertos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : lotesCerrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay lotes de reactivos disponibles para abrir
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reactivo</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Vencimiento Lote</TableHead>
                  <TableHead>Vida Util al Abrir</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotesCerrados.map((lote) => (
                  <TableRow key={lote.codigo_lote}>
                    <TableCell className="font-medium">{lote.item?.nombre}</TableCell>
                    <TableCell>{lote.numero_lote}</TableCell>
                    <TableCell>
                      {lote.fecha_vencimiento
                        ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-EC')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {lote.item?.vida_util_dias_abierto
                        ? `${lote.item.vida_util_dias_abierto} dias`
                        : 'Sin limite'}
                    </TableCell>
                    <TableCell>
                      {lote.item?.capacidad_pruebas
                        ? `${lote.item.capacidad_pruebas} pruebas`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          setLoteSeleccionado(lote.codigo_lote);
                          setDialogAbrirLote(true);
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Abrir Lote */}
      <Dialog open={dialogAbrirLote} onOpenChange={setDialogAbrirLote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Lote de Reactivo</DialogTitle>
            <DialogDescription>
              Al abrir el lote, comenzara el contador de vida util. Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Lote seleccionado: <strong>{lotesCerrados.find(l => l.codigo_lote === loteSeleccionado)?.numero_lote}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Reactivo: <strong>{lotesCerrados.find(l => l.codigo_lote === loteSeleccionado)?.item?.nombre}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbrirLote(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAbrirLote}>
              Confirmar Apertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pruebas */}
      <Dialog open={dialogRegistrarPruebas} onOpenChange={setDialogRegistrarPruebas}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pruebas Realizadas</DialogTitle>
            <DialogDescription>
              Ingrese la cantidad de pruebas que se realizaron con este lote
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad de Pruebas</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={cantidadPruebas}
                onChange={(e) => setCantidadPruebas(e.target.value)}
                placeholder="Ej: 10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observacion (opcional)</Label>
              <Input
                id="obs"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Pruebas de glucosa dia 20/12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRegistrarPruebas(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPruebas} disabled={!cantidadPruebas}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Descartar Lote */}
      <Dialog open={dialogDescartar} onOpenChange={setDialogDescartar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar Lote</DialogTitle>
            <DialogDescription>
              Esta accion descartara el lote y actualizara el inventario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo del Descarte</Label>
              <Select value={motivoDescarte} onValueChange={setMotivoDescarte}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENCIDO_APERTURA">Vencido por tiempo de apertura</SelectItem>
                  <SelectItem value="VENCIDO_LOTE">Vencido por fecha de lote</SelectItem>
                  <SelectItem value="AGOTADO">Capacidad agotada</SelectItem>
                  <SelectItem value="DANADO">Danado/Contaminado</SelectItem>
                  <SelectItem value="MANUAL">Descarte manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs-descarte">Observacion (opcional)</Label>
              <Input
                id="obs-descarte"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Detalles adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDescartar(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDescartarLote} disabled={!motivoDescarte}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
