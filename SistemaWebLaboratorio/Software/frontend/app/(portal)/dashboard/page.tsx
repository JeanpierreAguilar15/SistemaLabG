"use client";
import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/header';
import { KpiCard } from '../../../components/ui/kpi-card';
import { CalendarIcon, FileIcon, CreditCardIcon, ChevronRightIcon, BeakerIcon } from '../../../components/ui/icons';
import { RecentResults } from '../../../components/lists/recent-results.client';
import { Button } from '../../../components/ui/button';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';

type Cita = { numero_cita:number; codigo_servicio:string; estado:string; inicio:string; fin:string };
type Resultado = { codigo_resultado:number; codigo_prueba:string; estado:string; fecha_resultado?:string|null };
type Factura = { numero_factura:number; estado:string; monto_total:number };

export default function Page(){
  const { accessToken } = useSessionStore();
  const [proxima, setProxima] = useState<{ label: string; date?: Date; servicio?: string }>({ label: '-' });
  const [svcMap, setSvcMap] = useState<Record<string,string>>({});
  const [pendRes, setPendRes] = useState<number>(0);
  const [pendPagos, setPendPagos] = useState<{ count:number; total:number }>({ count:0, total:0 });
  const [recent, setRecent] = useState<Resultado[]>([]);
  const [me, setMe] = useState<{ nombres?:string; apellidos?:string }|null>(null);
  const [totalCitas, setTotalCitas] = useState(0);

  useEffect(()=>{ (async()=>{
    if (!accessToken) return;
    try{
      const mine = await api<{ items:Cita[] }>(`/appointments/mis-citas`, { method:'GET' }, accessToken);
      const upcomingAll = (mine.items||[]).filter(c => new Date(c.inicio) > new Date());
      setTotalCitas(upcomingAll.length);
      const upcoming = upcomingAll.sort((a,b)=> new Date(a.inicio).getTime() - new Date(b.inicio).getTime())[0];
      if (upcoming) {
        const d = new Date(upcoming.inicio);
        const svcName = svcMap[upcoming.codigo_servicio] || upcoming.codigo_servicio;
        setProxima({ label: svcName, date: d, servicio: upcoming.codigo_servicio });
      } else {
        setProxima({ label: 'Sin citas programadas' });
      }
    }catch{}
    try{
      const rpend = await api<{ items:Resultado[] }>(`/results?estado=EN_PROCESO`, { method:'GET' }, accessToken);
      setPendRes((rpend.items||[]).length);
    }catch{}
    try{
      const fac = await api<{ items:Factura[] }>(`/billing/facturas?estado=PENDIENTE`, { method:'GET' }, accessToken);
      const items = fac.items||[];
      setPendPagos({ count: items.length, total: items.reduce((a,b)=> a + (Number(b.monto_total)||0), 0) });
    }catch{}
    try{
      const res = await api<{ items:Resultado[] }>(`/results`, { method:'GET' }, accessToken);
      setRecent((res.items||[]).slice(0,5));
    }catch{}
    try{
      const p = await api<any>(`/profile/me`, { method:'GET' }, accessToken);
      setMe({ nombres: p?.nombres, apellidos: p?.apellidos });
    }catch{}
  })(); }, [accessToken, svcMap]);

  useEffect(()=>{ (async()=>{
    try{
      const res = await api<{ items:{ codigo:string; nombre:string }[] }>(`/catalog/public/services`, { method:'GET' });
      const map = Object.fromEntries((res.items||[]).map(s => [s.codigo, s.nombre]));
      setSvcMap(map);
    }catch{}
  })(); }, []);

  const nombre = useMemo(()=> {
    if (!me?.nombres) return 'Bienvenido/a';
    const nom = me.nombres.split(' ')[0];
    return `Hola, ${nom}`;
  }, [me]);

  const recentMapped = useMemo(()=> (recent||[]).map(r => ({
    titulo: r.codigo_prueba,
    fecha: r.fecha_resultado ? new Date(r.fecha_resultado).toLocaleDateString() : '-',
    estado: r.estado === 'COMPLETADO' ? 'completado' : 'en-proceso',
    codigo_resultado: r.codigo_resultado,
  })), [recent]);

  return (
    <section aria-label="dashboard" className="space-y-6">
      <Header
        meta="Portal del Paciente"
        title={nombre}
        subtitle="Gestiona toda tu información médica de forma segura y centralizada"
        actions={
          <div className="flex gap-2">
            <Button variant="primary" onClick={()=>location.href='/citas'}>
              <CalendarIcon className="w-4 h-4" />
              Nueva cita
            </Button>
            <Button variant="outline" onClick={()=>location.href='/historial'}>
              Ver historial
            </Button>
          </div>
        }
      />

      {/* KPI Cards - Métricas principales */}
      <div className="portal-grid cols-3">
        <KpiCard
          variant="tile"
          title="Próximas citas"
          value={totalCitas.toString()}
          subtitle="Próximos 30 días"
          accent="blue"
          icon={<CalendarIcon />}
          action={<Button size="sm" variant="ghost" onClick={()=>location.href='/citas'}>Ver agenda</Button>}
        />
        <KpiCard
          variant="tile"
          title="Resultados"
          value={pendRes.toString()}
          subtitle="En proceso"
          accent="green"
          icon={<BeakerIcon />}
          action={<Button size="sm" variant="ghost" onClick={()=>location.href='/resultados'}>Ver todos</Button>}
        />
        <KpiCard
          variant="tile"
          title="Pagos pendientes"
          value={`$${pendPagos.total.toFixed(2)}`}
          subtitle={`${pendPagos.count} ${pendPagos.count === 1 ? 'factura' : 'facturas'}`}
          accent="orange"
          icon={<CreditCardIcon />}
          action={<Button size="sm" variant="ghost" onClick={()=>location.href='/pagos'}>Pagar</Button>}
        />
      </div>

      {/* Próxima cita destacada */}
      <div className="panel" style={{
        background: 'linear-gradient(135deg, #0052CC 0%, #00366D 100%)',
        color: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wider opacity-90">
                Próxima cita
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2">{proxima.label}</h3>
            {proxima.date && (
              <div className="flex flex-wrap gap-4 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Fecha:</span>
                  <span>{proxima.date.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Hora:</span>
                  <span>{proxima.date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=>location.href='/citas'} style={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)'
            }}>
              Gestionar citas
            </Button>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resultados recientes - 2 columnas */}
        <div className="lg:col-span-2">
          <RecentResults items={recentMapped as any} />
        </div>

        {/* Acciones rápidas - 1 columna */}
        <div className="space-y-4">
          <div className="panel">
            <div className="panel-heading">Acciones rápidas</div>
            <div className="panel-sub mb-4">Accede a las funciones más utilizadas</div>

            <div className="space-y-3">
              <button
                onClick={()=>location.href='/citas'}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-soft)] bg-white hover:bg-[var(--surface-hover)] hover:border-[var(--brand-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#DBEAFE] transition-colors">
                    <CalendarIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-main)]">Agendar cita</div>
                    <div className="text-xs text-[var(--text-muted)]">Reserva tu atención</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
              </button>

              <button
                onClick={()=>location.href='/cotizaciones'}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-soft)] bg-white hover:bg-[var(--surface-hover)] hover:border-[var(--brand-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center group-hover:bg-[#FFEDD5] transition-colors">
                    <FileIcon className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-main)]">Nueva cotización</div>
                    <div className="text-xs text-[var(--text-muted)]">Solicita presupuesto</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
              </button>

              <button
                onClick={()=>location.href='/resultados'}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-soft)] bg-white hover:bg-[var(--surface-hover)] hover:border-[var(--brand-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center group-hover:bg-[#D1FAE5] transition-colors">
                    <BeakerIcon className="w-5 h-5 text-[#00B67A]" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-main)]">Ver resultados</div>
                    <div className="text-xs text-[var(--text-muted)]">Consulta tus análisis</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
              </button>

              <button
                onClick={()=>location.href='/perfil'}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-soft)] bg-white hover:bg-[var(--surface-hover)] hover:border-[var(--brand-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#E5E7EB] transition-colors">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-main)]">Mi perfil</div>
                    <div className="text-xs text-[var(--text-muted)]">Datos personales</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
              </button>
            </div>
          </div>

          {/* Información de ayuda */}
          <div className="panel bg-[#F0F6FF] border-[#BFDBFE]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[var(--text-main)] mb-1">
                  Necesitas ayuda?
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Contáctanos para cualquier consulta sobre tus citas, resultados o servicios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
