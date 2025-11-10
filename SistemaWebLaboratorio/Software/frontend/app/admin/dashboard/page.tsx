"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';
import { KpiCard } from '../../../components/ui/kpi-card';
import { StatusBadge } from '../../../components/ui/status-badge';
import { UserIcon, FileIcon, CreditCardIcon, CalendarIcon, ReceiptIcon, BeakerIcon, ChevronRightIcon, TrendingUpIcon, XCircleIcon, CheckCircleIcon } from '../../../components/ui/icons';

type Metrics = { users?: number; results_pending?: number; payments_pending?: number; appointments_today?: number };

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);

  const [metrics, setMetrics] = useState<Metrics>({});
  const [userStats, setUserStats] = useState<any>(null);
  const [appointmentStats, setAppointmentStats] = useState<any>(null);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'hoy' | 'semana' | 'mes' | 'anio'>('hoy');

  useEffect(()=>{ (async()=>{
    if(!isAdmin || !accessToken) return;
    try{ const res = await api<Metrics>(`/admin/metrics`, { method:'GET' }, accessToken); setMetrics(res); }catch{}
    try{ const res = await api<any>(`/admin/stats/users`, { method:'GET' }, accessToken); setUserStats(res); }catch{}
    try{ const res = await api<any>(`/admin/stats/appointments`, { method:'GET' }, accessToken); setAppointmentStats(res); }catch{}
    try{ const res = await api<any>(`/admin/stats/financial`, { method:'GET' }, accessToken); setFinancialStats(res); }catch{}
  })(); }, [isAdmin, accessToken]);

  useEffect(()=>{ (async()=>{
    if(!isAdmin || !accessToken) return;
    try{
      const now = new Date();
      const desde = now.toISOString();
      const hasta = new Date(now.getTime() + 7*24*60*60*1000).toISOString();
      const qs = `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;
      const r = await api<{ items:any[] }>(`/appointments/admin/list${qs}`, { method:'GET' }, accessToken);
      const items = (r.items||[])
        .filter(x => !/cancel/i.test(String(x.estado||'')))
        .sort((a:any,b:any)=> new Date(a.inicio||a.fecha).getTime() - new Date(b.inicio||b.fecha).getTime());
      setRecentAppointments(items.slice(0,8));
    }catch{}
  })(); }, [isAdmin, accessToken]);

  const revenues = useMemo(()=>{
    const f = financialStats || {};
    return {
      hoy: f.today_revenue ?? 0,
      semana: f.week_revenue ?? 0,
      mes: f.monthly_revenue ?? 0,
      anio: f.year_revenue ?? 0,
    } as const;
  }, [financialStats]);

  const kpiTrends = useMemo(() => {
    const activeRate = userStats?.total_users ? (100 * (userStats.active_last_30d ?? 0) / Math.max(1, userStats.total_users)) : undefined;
    return {
      users: typeof activeRate === 'number' ? { delta: +(activeRate - 50).toFixed(1), label: 'vs. 30d' } : undefined,
    } as const;
  }, [userStats]);

  if(!isAdmin) return <div className="card">Acceso denegado</div>;

  return (
    <section className="space-y-4">
      {/* Header hero: gradient + segmented timeframe */}
      <div className="card hero anim-fade-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="heading-lg">Panel Administrativo</div>
            <div className="body-muted">Vista general: usuarios, agenda, servicios, pagos y resultados</div>
          </div>
          <div className="pill-tabs" role="tablist" aria-label="Periodo">
            {(['hoy','semana','mes','anio'] as const).map((tf) => (
              <button key={tf} role="tab" aria-selected={timeframe===tf} className={`pill-tab ${timeframe===tf?'active':''}`} onClick={()=>setTimeframe(tf)}>
                {tf === 'hoy' ? 'Hoy' : tf === 'semana' ? 'Semana' : tf === 'mes' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 action-tiles anim-fade-up">
        <Link href="/admin/citas" className="action-tile">
          <div className="action-icon blue"><CalendarIcon className="w-4 h-4" /></div>
          <div>
            <div className="action-title">Agenda del día</div>
            <div className="action-sub">Gestiona citas y cupos</div>
          </div>
          <ChevronRightIcon className="action-chevron" />
        </Link>
        <Link href="/admin/usuarios" className="action-tile">
          <div className="action-icon"><UserIcon className="w-4 h-4" /></div>
          <div>
            <div className="action-title">Usuarios activos</div>
            <div className="action-sub">Invita o asigna roles</div>
          </div>
          <ChevronRightIcon className="action-chevron" />
        </Link>
        <Link href="/admin/facturas" className="action-tile">
          <div className="action-icon orange"><ReceiptIcon className="w-4 h-4" /></div>
          <div>
            <div className="action-title">Cobranza</div>
            <div className="action-sub">Revisa pagos y facturas</div>
          </div>
          <ChevronRightIcon className="action-chevron" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard variant="tile" className="anim-fade-up anim-delay-1" title="Usuarios" value={metrics.users ?? 0} subtitle="Registrados" accent="blue" icon={<UserIcon />} trend={kpiTrends.users as any} />
        <KpiCard variant="tile" className="anim-fade-up anim-delay-2" title="Resultados" value={metrics.results_pending ?? 0} subtitle="Pendientes" accent="orange" icon={<FileIcon />} />
        <KpiCard variant="tile" className="anim-fade-up anim-delay-3" title="Pagos" value={metrics.payments_pending ?? 0} subtitle="Pendientes" accent="red" icon={<CreditCardIcon />} />
        <KpiCard variant="tile" className="anim-fade-up anim-delay-4" title="Citas" value={metrics.appointments_today ?? 0} subtitle="Hoy" accent="green" icon={<CalendarIcon />} />
      </div>

      {/* Conversions + Performance */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Donut style conversion card */}
        <div className="card anim-fade-up xl:col-span-1">
          <div className="heading-sm mb-4">Conversión de citas</div>
          <div className="grid grid-cols-2 gap-3 items-center">
            {(() => {
              const total = Math.max(1, Number(appointmentStats?.total_appointments) || 1);
              const confirmed = Number(appointmentStats?.confirmed) || 0;
              const pct = Math.round((confirmed / total) * 100);
              return (
                <div className="donut">
                  <div className="ring" style={{ ['--p' as any]: pct + '%' }} aria-hidden />
                  <div className="center">
                    <div className="value">{pct}%</div>
                    <div className="sub">Confirmadas</div>
                  </div>
                </div>
              );
            })()}
            <div className="space-y-2">
              <div className="flex justify-between"><span className="body-muted">Esta semana</span><span className="font-semibold">{appointmentStats?.upcoming ?? '-'} próximas</span></div>
              <div className="flex justify-between"><span className="body-muted">Confirmadas</span><span className="font-semibold">{appointmentStats?.confirmed ?? '-'}</span></div>
              <div className="flex justify-between"><span className="body-muted">Canceladas</span><span className="font-semibold">{appointmentStats?.cancelled ?? '-'}</span></div>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="card anim-fade-up xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="heading-sm">Rendimiento</div>
            <div className="text-sm body-muted flex items-center gap-2"><TrendingUpIcon className="w-4 h-4" /> Tendencia general</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat">
              <div className="body-muted">Ingresos {timeframe}</div>
              <div className="stat-value">${revenues[timeframe]?.toFixed(2)}</div>
              <div className="progress-line"><span style={{ width: `${Math.min(100, (revenues[timeframe]||0) % 100)}%` }} /></div>
            </div>
            <div className="stat">
              <div className="body-muted">Resultados pendientes</div>
              <div className="stat-value">{metrics.results_pending ?? 0}</div>
              <div className="progress-line"><span style={{ width: `${Math.min(100, (metrics.results_pending||0) * 10)}%` }} /></div>
            </div>
            <div className="stat">
              <div className="body-muted">Pagos pendientes</div>
              <div className="stat-value">{metrics.payments_pending ?? 0}</div>
              <div className="progress-line danger"><span style={{ width: `${Math.min(100, (metrics.payments_pending||0) * 10)}%` }} /></div>
            </div>
            <div className="stat">
              <div className="body-muted">Citas hoy</div>
              <div className="stat-value">{metrics.appointments_today ?? 0}</div>
              <div className="progress-line success"><span style={{ width: `${Math.min(100, (metrics.appointments_today||0) * 10)}%` }} /></div>
            </div>
          </div>
          <div className="spark mt-6" aria-hidden />
        </div>
        {/* sin rail derecho (actividad oculta) */}
      </div>

      {/* Appointments list */}
      <div className="card anim-fade-up">
        <div className="heading-sm mb-3">Citas recientes</div>
        <div className="divide-y">
          {recentAppointments.map((a:any) => {
            const nombre = a.nombre_completo || a.paciente || a.cedula || 'Paciente';
            const ini = a.inicio || a.fin || a.fecha || Date.now();
            const estado = String(a.estado||'').toLowerCase();
            const status = estado.includes('cancel') ? 'cancelada' : estado.includes('complet') ? 'completado' : estado.includes('confirm') ? 'confirmada' : estado.includes('proce') ? 'en-proceso' : 'pendiente';
            return (
              <div key={a.numero_cita} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="avatar" aria-hidden>{String(nombre).charAt(0)}</div>
                  <div>
                    <div className="font-medium">{nombre}</div>
                    <div className="body-muted text-sm">{new Date(ini).toLocaleString()} - {a.codigo_servicio || 'Servicio'}</div>
                  </div>
                </div>
                <StatusBadge status={status as any} size="sm" />
              </div>
            );
          })}
          {!recentAppointments.length && (
            <div className="body-muted">Sin citas recientes</div>
          )}
        </div>
      </div>

      {/* Secondary analytics */}
      <div className="grid gap-4 md:grid-cols-3">
        {userStats && (
          <div className="card anim-fade-up anim-delay-1">
            <div className="heading-sm mb-2">Usuarios</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="body-muted">Total</span><span className="font-medium">{userStats.total_users}</span></div>
              <div className="flex justify-between"><span className="body-muted">Activos (30d)</span><span className="font-medium">{userStats.active_last_30d}</span></div>
              <div className="flex justify-between"><span className="body-muted">Admins</span><span className="font-medium">{userStats.admins}</span></div>
            </div>
          </div>
        )}
        {appointmentStats && (
          <div className="card anim-fade-up anim-delay-2">
            <div className="heading-sm mb-2">Citas</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="body-muted">Total</span><span className="font-medium">{appointmentStats.total_appointments}</span></div>
              <div className="flex justify-between"><span className="body-muted">Próximas</span><span className="font-medium">{appointmentStats.upcoming}</span></div>
              <div className="flex justify-between"><span className="body-muted">Confirmadas</span><span className="font-medium">{appointmentStats.confirmed}</span></div>
              <div className="flex justify-between"><span className="body-muted">Canceladas</span><span className="font-medium">{appointmentStats.cancelled}</span></div>
            </div>
          </div>
        )}
        {financialStats && (
          <div className="card anim-fade-up anim-delay-3">
            <div className="heading-sm mb-2">Finanzas</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="body-muted">Cotizaciones</span><span className="font-medium">{financialStats.total_quotes}</span></div>
              <div className="flex justify-between"><span className="body-muted">Facturas</span><span className="font-medium">{financialStats.total_invoices}</span></div>
              <div className="flex justify-between"><span className="body-muted">Pendiente</span><span className="font-medium">${financialStats.pending_payments_total?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="body-muted">Mes</span><span className="font-medium">${financialStats.monthly_revenue?.toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
