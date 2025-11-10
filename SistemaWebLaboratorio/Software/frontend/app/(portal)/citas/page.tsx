"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '../components/header';
import { Button } from '../../../components/ui/button';
import { KpiCard } from '../../../components/ui/kpi-card';
import { StatusBadge } from '../../../components/ui/status-badge';
import { CalendarIcon, BeakerIcon, ClockIcon } from '../../../components/ui/icons';
import { MonthCalendar } from '../../../components/appointments/month-calendar';
import { TimeSlotPicker } from '../../../components/appointments/time-slot-picker';
import { Modal } from '../../../components/ui/modal';
import { Toggle } from '../../../components/ui/toggle';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';
import { showToast } from '../../../lib/toast-store';

type Slot = { slot_id: number; inicio: string; fin: string };
type Cita = { numero_cita: number; codigo_servicio: string; estado: string; inicio: string; fin: string };
type Servicio = { codigo: string; nombre: string; precio: number };
type Sede = { codigo_sede: string; nombre_sede: string };

const dayKey = (input: string | Date) => {
  const date = typeof input === 'string' ? new Date(input) : input;
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

function CitasClient(){
  const { accessToken } = useSessionStore();
  const searchParams = useSearchParams();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [svc, setSvc] = useState('');
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [sede, setSede] = useState('');

  const [month, setMonth] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availableByDay, setAvailableByDay] = useState<Record<string, number>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [citas, setCitas] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [createQuote, setCreateQuote] = useState(false);

  const [reprogId, setReprogId] = useState<number | null>(null);
  const [reprogSlot, setReprogSlot] = useState<number | null>(null);
  const [reprogOpen, setReprogOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [agendaPage, setAgendaPage] = useState(1);
  const perAgendaPage = 6;

  useEffect(() => {
    (async () => {
      try{
        const res = await api<{ items: Servicio[] }>(`/catalog/public/services`, { method:'GET' });
        const items = (res.items || []).map(item => ({
          codigo: item.codigo,
          nombre: item.nombre,
          precio: Number(item.precio ?? 0),
        }));
        setServicios(items);
        if (!items.length) return;
        const preferred = searchParams?.get('svc');
        setSvc(prev => {
          if (preferred && items.some(s => s.codigo === preferred)) return preferred;
          if (prev && items.some(s => s.codigo === prev)) return prev;
          return items[0].codigo;
        });
      }catch{/* ignore */}
    })();
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try{
        if (!accessToken) return;
        const res = await api<{ items: Sede[] }>(`/appointments/sedes`, { method:'GET' }, accessToken);
        const items = res.items || [];
        setSedes(items);
        if (!items.length) return;
        setSede(prev => (prev && items.some(s => s.codigo_sede === prev)) ? prev : items[0].codigo_sede);
      }catch{/* ignore */}
    })();
  }, [accessToken]);

  const loadMonth = useCallback(async () => {
    if (!accessToken || !sede || !svc){
      setSlots([]);
      setAvailableByDay({});
      setDaySlots([]);
      setSelectedDay(null);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    try{
      const start = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0);
      const end = new Date(month.getFullYear(), month.getMonth()+1, 0, 23, 59, 59);
      const qs = `?codigo_servicio=${encodeURIComponent(svc)}&codigo_sede=${encodeURIComponent(sede)}&desde=${encodeURIComponent(start.toISOString())}&hasta=${encodeURIComponent(end.toISOString())}`;
      const res = await api<{ items: Slot[] }>(`/appointments/disponibilidad${qs}`, { method:'GET' }, accessToken);
      const list = res.items || [];
      setSlots(list);

      const byDay: Record<string, number> = {};
      list.forEach(slot => {
        const key = dayKey(slot.inicio);
        byDay[key] = (byDay[key] || 0) + 1;
      });
      setAvailableByDay(byDay);

      const upcoming = list.find(slot => new Date(slot.inicio) >= new Date());
      let resolvedDay: string | null = null;
      setSelectedDay(prev => {
        const next = (prev && byDay[prev]) ? prev : (upcoming ? dayKey(upcoming.inicio) : null);
        resolvedDay = next;
        return next;
      });
      setSelectedSlot(null);
      if (resolvedDay){
        const filtered = list
          .filter(slot => dayKey(slot.inicio) === resolvedDay)
          .sort((a,b)=> new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
        setDaySlots(filtered);
      }else{
        setDaySlots([]);
      }
    }catch{
      setSlots([]);
      setAvailableByDay({});
      setDaySlots([]);
    }finally{
      setLoadingSlots(false);
    }
  }, [accessToken, month, sede, svc]);

  const loadCitas = useCallback(async () => {
    if (!accessToken) return;
    setLoadingCitas(true);
    try{
      const res = await api<{ items: Cita[] }>(`/appointments/mis-citas`, { method:'GET' }, accessToken);
      setCitas(res.items || []);
    }catch{
      setCitas([]);
    }finally{
      setLoadingCitas(false);
    }
  }, [accessToken]);

  useEffect(() => { loadMonth(); }, [loadMonth]);
  useEffect(() => { loadCitas(); }, [loadCitas]);

  const handleSelectDay = (key: string) => {
    setSelectedDay(key);
    const filtered = slots
      .filter(slot => dayKey(slot.inicio) === key)
      .sort((a,b)=> new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
    setDaySlots(filtered);
    setSelectedSlot(null);
  };

  const setMessage = (msg: string) => {
    setFeedback(msg);
    if (msg) setTimeout(() => setFeedback(''), 6000);
  };

  const refreshData = async () => {
    await Promise.all([loadMonth(), loadCitas()]);
  };

  const agendar = async () => {
    if (!accessToken || selectedSlot == null) return;
    try{
      await api(`/appointments/crear`, { method:'POST', body: JSON.stringify({ slot_id: selectedSlot, crear_cotizacion: createQuote }) }, accessToken);
      showToast('Cita creada', { variant:'success' });
      setMessage('Tu cita fue registrada correctamente.');
      setSelectedSlot(null);
      await refreshData();
    }catch(e:any){
      const msg = String(e?.message || 'No se pudo agendar la cita');
      setMessage(msg);
      showToast(msg, { variant:'error' });
    }
  };

  const reprogramar = async (numero_cita:number, nuevo_slot_id:number) => {
    if (!accessToken) return;
    try{
      await api(`/appointments/reprogramar`, { method:'POST', body: JSON.stringify({ numero_cita, nuevo_slot_id }) }, accessToken);
      showToast('Cita reprogramada', { variant:'success' });
      setMessage('Actualizamos la fecha de tu cita.');
      await refreshData();
    }catch(e:any){
      const msg = String(e?.message || 'No se pudo reprogramar la cita');
      setMessage(msg);
      showToast(msg, { variant:'error' });
    }
  };

  const cancelar = async () => {
    if (!accessToken || cancelId == null) return;
    try{
      await api(`/appointments/cancelar`, { method:'POST', body: JSON.stringify({ numero_cita: cancelId, motivo }) }, accessToken);
      showToast('Cita cancelada', { variant:'info' });
      setMessage('La cita fue cancelada.');
      setCancelId(null);
      setMotivo('');
      await refreshData();
    }catch(e:any){
      const msg = String(e?.message || 'Error al cancelar la cita');
      setMessage(msg);
      showToast(msg, { variant:'error' });
    }
  };

  const svcMap = useMemo(() => Object.fromEntries(servicios.map(s => [s.codigo, s.nombre])), [servicios]);
  const selectedSvc = servicios.find(s => s.codigo === svc);
  const selectedSedeName = sedes.find(s => s.codigo_sede === sede)?.nombre_sede ?? 'Sin sede';

  const sortedCitas = useMemo(() => [...citas].sort((a,b)=> new Date(a.inicio).getTime() - new Date(b.inicio).getTime()), [citas]);
  useEffect(()=>{ setAgendaPage(1); }, [sortedCitas.length]);
  const totalAgendaPages = Math.max(1, Math.ceil(sortedCitas.length / perAgendaPage));
  const paginatedCitas = useMemo(()=> sortedCitas.slice((agendaPage-1)*perAgendaPage, agendaPage*perAgendaPage), [sortedCitas, agendaPage]);
  const upcoming = useMemo(() => sortedCitas.filter(c => new Date(c.inicio) >= new Date() && !/cancel/i.test(String(c.estado))), [sortedCitas]);
  const nextAppointment = upcoming[0];
  const nextLabel = nextAppointment ? new Date(nextAppointment.inicio).toLocaleDateString(undefined, { weekday:'short', day:'numeric', month:'short' }) : 'Sin agenda';
  const nextSubtitle = nextAppointment ? new Date(nextAppointment.inicio).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'Agenda una nueva cita';
  const upcomingSeven = upcoming.filter(c => {
    const diff = new Date(c.inicio).getTime() - Date.now();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const pendingCount = sortedCitas.filter(c => /pend/i.test(String(c.estado).toLowerCase())).length;

  const selectedSlotInfo = useMemo(() => {
    if (selectedSlot == null) return null;
    const slot = daySlots.find(s => s.slot_id === selectedSlot);
    if (!slot) return null;
    const start = new Date(slot.inicio);
    const end = new Date(slot.fin);
    return {
      date: start.toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long' }),
      time: `${start.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} - ${end.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`,
    };
  }, [selectedSlot, daySlots]);

  return (
    <section aria-label="citas" className="space-y-5">
      <Header
        meta="Agenda"
        title="Gestion de citas"
        subtitle="Reserva, reprograma o cancela tus atenciones clinicas en pocos pasos"
        actions={<Button variant="outline" onClick={()=>location.href='/historial'}>Ver historial</Button>}
      />

      <div className="portal-grid cols-3">
        <KpiCard variant="tile" accent="blue" title="Proxima cita" value={nextLabel} subtitle={nextSubtitle} icon={<CalendarIcon />} action={<Button size="sm" variant="ghost" onClick={()=>location.href='/citas'}>Gestionar</Button>} />
        <KpiCard variant="tile" accent="orange" title="Citas proximas" value={upcomingSeven} subtitle="Proximos 7 dias" icon={<ClockIcon />} />
        <KpiCard variant="tile" accent="green" title="Pendientes" value={pendingCount} subtitle="Por confirmar" icon={<BeakerIcon />} />
      </div>

      <div className="booking-grid">
        <div className="booking-step">
          <span className="booking-step__meta">Paso 1</span>
          <div className="booking-step__title">Elige el servicio y la sede</div>
          <div className="booking-step__subtitle">Define el motivo de tu visita para ver la disponibilidad exacta</div>
          <div className="booking-fields">
            <div className="form-group">
              <label className="form-label required">Servicio</label>
              <select className="form-select" value={svc} onChange={(e)=>setSvc(e.target.value)}>
                <option value="" disabled>{servicios.length ? 'Selecciona un servicio' : 'Cargando...'}</option>
                {servicios.map(item => (
                  <option key={item.codigo} value={item.codigo}>{item.nombre} {item.precio > 0 ? `- $${item.precio.toFixed(2)}` : ''}</option>
                ))}
              </select>
              <span className="form-hint">Selecciona el tipo de examen que necesitas</span>
            </div>
            <div className="form-group">
              <label className="form-label required">Sede</label>
              <select className="form-select" value={sede} onChange={(e)=>setSede(e.target.value)}>
                <option value="" disabled>{sedes.length ? 'Selecciona sede' : 'Cargando...'}</option>
                {sedes.map(item => (
                  <option key={item.codigo_sede} value={item.codigo_sede}>{item.nombre_sede}</option>
                ))}
              </select>
              <span className="form-hint">Elige la ubicación más conveniente</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-[var(--text-muted)] p-3 bg-[#F0F6FF] rounded-lg border border-[#BFDBFE]">
            <span className="font-medium text-[var(--brand-primary)]">Necesitas validar precios?</span>
            {' '}
            <button className="text-[var(--brand-primary)] font-semibold underline hover:no-underline" onClick={()=>location.href='/cotizaciones'}>
              Ir a cotizaciones
            </button>
          </div>
        </div>

        <div className="booking-step">
          <span className="booking-step__meta">Paso 2</span>
          <div className="booking-step__title">Selecciona fecha y horario</div>
          <div className="booking-step__subtitle">Consulta la disponibilidad en tiempo real.</div>
          <div className="booking-calendar">
            <MonthCalendar
              currentMonth={month}
              availableByDay={availableByDay}
              selectedDate={selectedDay}
              onSelect={handleSelectDay}
              onPrev={()=> setMonth(prev => new Date(prev.getFullYear(), prev.getMonth()-1, 1))}
              onNext={()=> setMonth(prev => new Date(prev.getFullYear(), prev.getMonth()+1, 1))}
            />
            <div className="slot-board">
              <div className="panel-heading">Horarios disponibles</div>
              <div className="panel-sub">Filtra por jornada y elige la hora ideal.</div>
              <div className="mt-3">
                {loadingSlots ? (
                  <div className="panel-sub">Cargando horarios...</div>
                ) : (
                  <TimeSlotPicker slots={daySlots} selected={selectedSlot} onSelect={setSelectedSlot} />
                )}
              </div>
              <div className="slot-note">
                Recuerda: elige primero el día en el calendario y luego el turno disponible. Los horarios se confirman en tiempo real.
              </div>
              <div className="text-xs body-muted mt-3">
                {selectedDay ? `Dia seleccionado: ${new Date(selectedDay).toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long' })}` : 'Selecciona un dia del calendario'}
              </div>
            </div>
          </div>
        </div>

        <div className="booking-step">
          <span className="booking-step__meta">Paso 3</span>
          <div className="booking-step__title">Confirma y recibe recordatorios</div>
          <div className="booking-step__subtitle">Revisa el resumen antes de finalizar</div>

          {/* Resumen de la cita */}
          <div className="mt-4 p-4 bg-[#FAFBFC] border border-[var(--border-soft)] rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Servicio</div>
                <div className="text-sm font-medium text-[var(--text-main)]">{selectedSvc?.nombre || 'No seleccionado'}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Sede</div>
                <div className="text-sm font-medium text-[var(--text-main)]">{selectedSedeName}</div>
              </div>
            </div>

            <div className="border-t border-[var(--border-soft)] pt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Horario</div>
                <div className="text-sm font-medium text-[var(--text-main)]">
                  {selectedSlotInfo ? (
                    <div>
                      <div>{selectedSlotInfo.date}</div>
                      <div className="text-xs text-[var(--brand-primary)] mt-0.5">{selectedSlotInfo.time}</div>
                    </div>
                  ) : (
                    <span className="text-[var(--text-muted)]">Selecciona un horario</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Costo referencial</div>
                <div className="text-lg font-bold text-[var(--brand-primary)]">{selectedSvc ? `$${selectedSvc.precio.toFixed(2)}` : '-'}</div>
              </div>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="mt-4 p-3 bg-white border border-[var(--border-soft)] rounded-lg hover:border-[var(--brand-primary)] transition-colors">
            <div className="flex items-start gap-3">
              <Toggle ariaLabel="Crear cotizacion automaticamente" checked={createQuote} onChange={setCreateQuote} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--text-main)]">Generar cotización</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Crea una cotización formal al confirmar tu cita</div>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="alert alert-info mt-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{feedback}</span>
            </div>
          )}

          <div className="booking-summary__cta">
            <Button className="btn-primary w-full" disabled={selectedSlot == null} onClick={agendar}>
              {selectedSlot == null ? 'Selecciona un horario' : 'Confirmar cita'}
            </Button>
            {selectedSlot != null && (
              <Button className="btn-ghost w-full" onClick={()=>setSelectedSlot(null)}>
                Limpiar selección
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">Tu agenda</div>
        <div className="panel-sub">Consulta y administra tus citas registradas.</div>
        {loadingCitas ? (
          <div className="agenda-empty mt-3">Cargando agenda...</div>
        ) : sortedCitas.length ? (
          <div className="agenda-list">
            {paginatedCitas.map(cita => {
              const start = new Date(cita.inicio);
              const end = new Date(cita.fin);
              const monthLabel = start.toLocaleDateString(undefined, { month:'short' });
              const dayLabel = start.getDate();
              const timeLabel = start.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
              const timeRange = `${timeLabel} - ${end.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`;
              const durationMin = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
              const diffDays = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const timeUntil = diffDays <= 0 ? 'Hoy' : diffDays === 1 ? 'Mañana' : `En ${diffDays} días`;
              const fastingNeeded = /GLUC|GLUCO|LIPIDO|PERFIL|COL/i.test(cita.codigo_servicio || '');
              const note = fastingNeeded ? 'Ayuno de 8h recomendado' : 'Llega 10 min antes para registro';
              return (
                <div key={cita.numero_cita} className="agenda-item">
                  <div className="agenda-item__badge">
                    <span>{dayLabel}</span>
                    <span>{monthLabel}</span>
                  </div>
                  <div className="agenda-item__layout">
                    <div className="agenda-item__body">
                      <div className="agenda-item__title">{svcMap[cita.codigo_servicio] || cita.codigo_servicio}</div>
                      <div className="agenda-item__meta">{timeRange}</div>
                      <div className="agenda-item__chips">
                        <span className="agenda-chip">Ticket #{cita.numero_cita}</span>
                        <span className="agenda-chip">Duracion {durationMin} min</span>
                        <span className="agenda-chip">{String(cita.estado).toLowerCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={cita.estado} size="sm" />
                      </div>
                      <div className="agenda-item__actions">
                        <Button size="sm" variant="outline" onClick={()=>{ setReprogId(cita.numero_cita); setReprogSlot(null); setReprogOpen(true); }}>Reprogramar</Button>
                        <Button size="sm" variant="ghost" onClick={()=>{ setCancelId(cita.numero_cita); setMotivo(''); setCancelOpen(true); }}>Cancelar</Button>
                      </div>
                    </div>
                    <div className="agenda-item__summary">
                      <div className="agenda-summary__stat">
                        <span className="agenda-summary__label">{timeUntil}</span>
                        <span className="agenda-summary__value">{start.toLocaleDateString(undefined, { weekday:'short' })}</span>
                      </div>
                      <div className="agenda-summary__note">{note}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={()=>showToast('Te enviaremos un recordatorio por correo cercano a la cita.', { variant:'info' })}
                      >
                        Agregar recordatorio
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="agenda-empty mt-4">Aun no registras citas.</div>
        )}
        {sortedCitas.length > perAgendaPage && (
          <div className="agenda-pagination">
            <Button size="sm" variant="outline" disabled={agendaPage === 1} onClick={()=>setAgendaPage(p=>Math.max(1, p-1))}>Anterior</Button>
            <span>Pagina {agendaPage} de {totalAgendaPages}</span>
            <Button size="sm" variant="outline" disabled={agendaPage === totalAgendaPages} onClick={()=>setAgendaPage(p=>Math.min(totalAgendaPages, p+1))}>Siguiente</Button>
          </div>
        )}
      </div>

      <Modal open={reprogOpen} onClose={()=>{ setReprogOpen(false); setReprogId(null); setReprogSlot(null); }} title="Reprogramar cita" hideDefaultClose>
        <div className="panel-sub mb-3">Selecciona un nuevo dia y horario.</div>
        <div className="booking-calendar">
          <MonthCalendar
            currentMonth={month}
            availableByDay={availableByDay}
            selectedDate={selectedDay}
            onSelect={handleSelectDay}
            onPrev={()=> setMonth(prev => new Date(prev.getFullYear(), prev.getMonth()-1, 1))}
            onNext={()=> setMonth(prev => new Date(prev.getFullYear(), prev.getMonth()+1, 1))}
          />
          <div className="slot-board">
            {daySlots.length ? (
              <TimeSlotPicker slots={daySlots} selected={reprogSlot} onSelect={setReprogSlot} />
            ) : (
              <div className="panel-sub">Elige un dia para ver horarios.</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={()=>{ setReprogOpen(false); setReprogId(null); setReprogSlot(null); }}>Cerrar</Button>
          <Button disabled={reprogId == null || reprogSlot == null} onClick={async()=>{
            if (reprogId != null && reprogSlot != null){
              await reprogramar(reprogId, reprogSlot);
              setReprogOpen(false);
              setReprogId(null);
              setReprogSlot(null);
            }
          }}>Guardar cambios</Button>
        </div>
      </Modal>

      <Modal open={cancelOpen} onClose={()=>{ setCancelOpen(false); setCancelId(null); setMotivo(''); }} title={cancelId ? `Cancelar cita #${cancelId}` : 'Cancelar cita'} hideDefaultClose>
        <label className="block text-sm font-medium text-[var(--text-main)]">
          Motivo (opcional)
          <textarea className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" rows={3} value={motivo} onChange={(e)=>setMotivo(e.target.value)} placeholder="Cuentanos el motivo si deseas" />
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="danger" onClick={async()=>{ await cancelar(); setCancelOpen(false); }}>Confirmar cancelacion</Button>
          <Button variant="outline" onClick={()=>{ setCancelOpen(false); setCancelId(null); setMotivo(''); }}>Cerrar</Button>
        </div>
      </Modal>
    </section>
  );
}

export default function Page(){
  return (
    <Suspense fallback={<section className="panel">Cargando...</section>}>
      <CitasClient />
    </Suspense>
  );
}
