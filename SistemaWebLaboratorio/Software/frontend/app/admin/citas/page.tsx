"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';

type Appointment = {
  numero_cita: number;
  cedula: string;
  codigo_servicio: string;
  estado: string;
  inicio: string;
  fin: string;
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  sede?: string;
  observaciones?: string;
};

type User = { cedula: string; nombre_completo: string };
type Service = { codigo: string; nombre: string };
type Location = { id: string; nombre: string };
type Slot = { slot_id:number; inicio:string; fin:string };

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const today = useMemo(()=> new Date(), []);
  const [filtroDesde, setFiltroDesde] = useState<string>(()=> new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0,10));
  const [filtroHasta, setFiltroHasta] = useState<string>(()=> new Date(today.getFullYear(), today.getMonth(), today.getDate()+7).toISOString().slice(0,10));
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    cedula: '',
    codigo_servicio: '',
    sede: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    observaciones: '',
    estado: 'PENDIENTE'
  });

  const estados = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'];

  useEffect(()=>{ 
    if(!isAdmin || !accessToken) return;
    loadData();
  }, [isAdmin, accessToken]);

  const loadData = async () => {
    try {
      const qs = `?desde=${encodeURIComponent(new Date(`${filtroDesde}T00:00:00`).toISOString())}&hasta=${encodeURIComponent(new Date(`${filtroHasta}T23:59:59`).toISOString())}`;
      const [appointmentsRes, usersRes, servicesRes, locationsRes] = await Promise.all([
        api<{ items: Appointment[] }>(`/appointments/admin/list${qs}`, { method: 'GET' }, accessToken),
        api<any[]>(`/users`, { method: 'GET' }, accessToken),
        api<{ items: any[] }>(`/catalog/services`, { method: 'GET' }, accessToken),
        api<{ items: any[] }>(`/appointments/admin/sedes`, { method: 'GET' }, accessToken)
      ]);
      
      setAppointments(appointmentsRes.items || []);
      setUsers(((usersRes as any[]) || []).map((u:any)=>({
        cedula: u.cedula,
        nombre_completo: `${(u.nombres||'').split(' ')[0]} ${(u.apellidos||'').split(' ')[0]}`.trim(),
      })) as any);
      setServices(((servicesRes as any)?.items||[]).map((s:any)=>({ codigo: s.codigo || s.codigo_servicio, nombre: s.nombre || s.nombre_servicio })) as any);
      setLocations(((locationsRes as any)?.items||[]).map((x:any)=>({ id: x.codigo_sede, nombre: x.nombre_sede })) as any);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData({
      cedula: '',
      codigo_servicio: '',
      sede: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      observaciones: '',
      estado: 'PENDIENTE'
    });
    setShowModal(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditing(appointment);
    setFormData({
      cedula: appointment.cedula,
      codigo_servicio: appointment.codigo_servicio,
      sede: appointment.sede || '',
      fecha: new Date(appointment.inicio).toISOString().split('T')[0],
      hora_inicio: new Date(appointment.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      hora_fin: new Date(appointment.fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      observaciones: appointment.observaciones || '',
      estado: appointment.estado
    });
    setShowModal(true);
  };

  const handleCancel = async (numero_cita: number) => {
    if (!confirm('Â¿EstÃ¡ seguro de cancelar esta cita?')) return;
    
    try {
      await api(`/appointments/admin/cancel/${numero_cita}`, { method: 'PUT' }, accessToken);
      loadData();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Error al cancelar la cita');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones básicas
    const inicioIso = `${formData.fecha}T${formData.hora_inicio}`;
    const finIso = `${formData.fecha}T${formData.hora_fin}`;
    if (new Date(inicioIso) < new Date()) { alert('No puedes agendar en una fecha/hora pasada'); return; }
    if (new Date(finIso) <= new Date(inicioIso)) { alert('La hora fin debe ser mayor a la hora inicio'); return; }

    try {
      const endpoint = editing 
        ? `/appointments/admin/update/${editing.numero_cita}`
        : `/appointments/admin/create`;
      
      const method = editing ? 'PUT' : 'POST';
      const payload = {
        cedula: formData.cedula,
        codigo_servicio: formData.codigo_servicio,
        sede: formData.sede,
        fecha_hora_inicio: inicioIso,
        fecha_hora_fin: finIso,
        observaciones: formData.observaciones,
        estado: formData.estado,
      } as any;

      await api(endpoint, { method, body: JSON.stringify(payload) }, accessToken);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Error al guardar la cita');
    }
  };

  // Reprogramación: buscar disponibilidad diaria por servicio/sede
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const buscarDisponibilidad = async () => {
    setSlots([]);
    if (!formData.codigo_servicio || !formData.sede || !formData.fecha) { alert('Elige servicio, sede y fecha'); return; }
    try{
      setLoadingSlots(true);
      const desdeIso = new Date(`${formData.fecha}T00:00:00`).toISOString();
      const hastaIso = new Date(`${formData.fecha}T23:59:59`).toISOString();
      const qs = `?codigo_servicio=${encodeURIComponent(formData.codigo_servicio)}&codigo_sede=${encodeURIComponent(formData.sede)}&desde=${encodeURIComponent(desdeIso)}&hasta=${encodeURIComponent(hastaIso)}`;
      const r = await api<{ items: Slot[] }>(`/appointments/disponibilidad${qs}`, { method:'GET' }, accessToken!);
      setSlots(r.items||[]);
    }catch(e:any){ alert(String(e?.message||'Error consultando disponibilidad')); }
    finally{ setLoadingSlots(false); }
  };

  if(!isAdmin) return <div className="card">Acceso denegado</div>;
  
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-md">Gestion de Citas</h1>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-sm">Desde</label>
            <Input type="date" value={filtroDesde} onChange={(e)=>setFiltroDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Hasta</label>
            <Input type="date" value={filtroHasta} onChange={(e)=>setFiltroHasta(e.target.value)} />
          </div>
          <Button variant="outline" onClick={loadData}>Filtrar</Button>
          <Button onClick={handleCreate} variant="primary">Nueva Cita</Button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div>Cargando...¦</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-hover">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Paciente</th>
                  <th className="p-3 text-left">Servicio</th>
                  <th className="p-3 text-left">Sede</th>
                  <th className="p-3 text-left">Fecha/Hora</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appointment => (
                  <tr key={appointment.numero_cita} className="border-b border-border-soft hover:bg-gray-50">
                    <td className="p-3">{appointment.numero_cita}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{appointment.nombre_completo}</div>
                        <div className="text-sm text-gray-600">{appointment.cedula}</div>
                      </div>
                    </td>
                    <td className="p-3">{appointment.codigo_servicio}</td>
                    <td className="p-3">{appointment.sede}</td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{new Date(appointment.inicio).toLocaleDateString()}</div>
                        <div>{new Date(appointment.inicio).toLocaleTimeString()} - {new Date(appointment.fin).toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.estado === 'CONFIRMADA' ? 'bg-green-100 text-green-800' :
                        appointment.estado === 'COMPLETADA' ? 'bg-blue-100 text-blue-800' :
                        appointment.estado === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleEdit(appointment)}
                          variant="outline"
                          size="sm"
                        >
                          Editar
                        </Button>
                        {appointment.estado !== 'CANCELADA' && (
                          <Button 
                            onClick={() => handleCancel(appointment.numero_cita)}
                            variant="danger"
                            size="sm"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar/Reprogramar Cita' : 'Nueva Cita'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Paciente</label>
              <Select
                value={formData.cedula}
                onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                required
              >
                <option value="">Seleccione un paciente</option>
                {users.map(user => (
                  <option key={user.cedula} value={user.cedula}>
                    {user.nombre_completo} - {user.cedula}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Servicio</label>
              <Select
                value={formData.codigo_servicio}
                onChange={(e) => setFormData({...formData, codigo_servicio: e.target.value})}
                required
              >
                <option value="">Seleccione un servicio</option>
                {services.map(service => (
                  <option key={service.codigo} value={service.codigo}>
                    {service.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sede</label>
              <Select
                value={formData.sede}
                onChange={(e) => setFormData({...formData, sede: e.target.value})}
                required
              >
                <option value="">Seleccione una sede</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.nombre}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <Select
                value={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
              >
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Hora Inicio</label>
              <Input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Hora Fin</label>
              <Input
                type="time"
                value={formData.hora_fin}
                onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editing ? 'Actualizar' : 'Crear'} Cita
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}











