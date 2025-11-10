"use client";
import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/header';
import { KpiCard } from '../../../components/ui/kpi-card';
import { CalendarIcon, FileIcon, CreditCardIcon } from '../../../components/ui/icons';
import { RecentResults } from '../../../components/lists/recent-results.client';
import { Button } from '../../../components/ui/button';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';

type Cita = { numero_cita:number; codigo_servicio:string; estado:string; inicio:string; fin:string };
type Resultado = { codigo_resultado:number; codigo_prueba:string; estado:string; fecha_resultado?:string|null };
type Factura = { numero_factura:number; estado:string; monto_total:number };

export default function Page(){
  const { accessToken } = useSessionStore();
  const [proxima, setProxima] = useState<string>('-');
  const [svcMap, setSvcMap] = useState<Record<string,string>>({});
  const [pendRes, setPendRes] = useState<number>(0);
  const [pendPagos, setPendPagos] = useState<{ count:number; total:number }>({ count:0, total:0 });
  const [recent, setRecent] = useState<Resultado[]>([]);
  const [me, setMe] = useState<{ nombres?:string; apellidos?:string }|null>(null);

  useEffect(()=>{ (async()=>{
    if (!accessToken) return;
    try{
      const mine = await api<{ items:Cita[] }>(`/appointments/mis-citas`, { method:'GET' }, accessToken);
      const upcoming = (mine.items||[])
        .filter(c => new Date(c.inicio) > new Date())
        .sort((a,b)=> new Date(a.inicio).getTime() - new Date(b.inicio).getTime())[0];
      if (upcoming) {
        const d = new Date(upcoming.inicio);
        const svcName = svcMap[upcoming.codigo_servicio] || upcoming.codigo_servicio;
        const human = `${svcName}  ${d.toLocaleDateString()}  ${d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`;
        setProxima(human);
      } else setProxima('Sin citas proximas');
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
      setRecent((res.items||[]).slice(0,3));
    }catch{}
    try{
      const p = await api<any>(`/profile/me`, { method:'GET' }, accessToken);
      setMe({ nombres: p?.nombres, apellidos: p?.apellidos });
    }catch{}
  })(); }, [accessToken, svcMap]);

  // Cargar mapa de servicios publicos (codigo -> nombre)
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
    <section aria-label="dashboard" className="space-y-5">
      <Header
        meta="Mi portal"
        title={nombre}
        subtitle="Gestiona tus citas, resultados y pagos en un solo lugar"
        actions={<Button variant="outline" onClick={()=>location.href='/historial'}>Ver historial</Button>}
      />

      <div className="portal-grid cols-3">
        <div className="panel hoverable">
          <div className="panel-heading flex items-center gap-3">
            <span className="tag">Agenda</span>
            Proxima cita
          </div>
          <div className="panel-sub">{proxima}</div>
          <Button className="mt-4 w-full" onClick={()=>location.href='/citas'}>Gestionar citas</Button>
        </div>
        <div className="panel hoverable">
          <div className="panel-heading flex items-center gap-3">
            <span className="tag">Resultados</span>
            Ultimos enviados
          </div>
          <div className="panel-sub">{pendRes ? `${pendRes} analisis en proceso` : 'No tienes analisis pendientes'}</div>
          <Button className="mt-4 w-full" variant="outline" onClick={()=>location.href='/resultados'}>Ver resultados</Button>
        </div>
        <div className="panel hoverable">
          <div className="panel-heading flex items-center gap-3">
            <span className="tag">Pagos</span>
            Facturas pendientes
          </div>
          <div className="panel-sub">{pendPagos.count ? `${pendPagos.count} factura(s) | $${pendPagos.total.toFixed(2)}` : 'No tienes pagos pendientes'}</div>
          <Button className="mt-4 w-full" variant="outline" onClick={()=>location.href='/pagos'}>Pagar ahora</Button>
        </div>
      </div>

      <div className="portal-grid cols-3">
        <KpiCard variant="tile" title="Citas" value={proxima !== 'Sin citas proximas' ? '1 proxima' : '0'} subtitle="Proximos 7 dias" accent="blue" icon={<CalendarIcon />} />
        <KpiCard variant="tile" title="Resultados" value={pendRes} subtitle="En proceso" accent="green" icon={<FileIcon />} />
        <KpiCard variant="tile" title="Pagos" value={`$${pendPagos.total.toFixed(2)}`} subtitle={`${pendPagos.count} factura(s)`} accent="orange" icon={<CreditCardIcon />} />
      </div>

      <div className="portal-grid cols-2">
        <RecentResults items={recentMapped as any} />
        <div className="panel">
          <div className="panel-heading">Acciones rapidas</div>
          <div className="panel-sub">Organiza tus pendientes principales</div>
          <div className="portal-grid cols-1 mt-4">
            <div className="panel hoverable">
              <div className="panel-heading">Agendar nueva cita</div>
              <div className="panel-sub">Reserva tu proxima atencion clinica</div>
              <Button className="mt-3 w-full" onClick={()=>location.href='/citas'}>+ Nueva cita</Button>
            </div>
            <div className="panel hoverable">
              <div className="panel-heading">Solicitar cotizacion</div>
              <div className="panel-sub">Selecciona pruebas y genera una propuesta</div>
              <Button className="mt-3 w-full" variant="outline" onClick={()=>location.href='/cotizaciones'}>+ Nueva cotizacion</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
