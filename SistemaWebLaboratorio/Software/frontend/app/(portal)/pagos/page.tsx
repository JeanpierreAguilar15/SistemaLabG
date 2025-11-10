"use client";
import { Header } from '../components/header';
import { PaymentsSection, usePaymentsData } from '../../../components/data/payments.client';
import { KpiCard } from '../../../components/ui/kpi-card';
import { Button } from '../../../components/ui/button';
import { CreditCardIcon, ReceiptIcon, CalendarIcon } from '../../../components/ui/icons';

export default function Page(){
  const { items, loading, error, pay, receipt, stats } = usePaymentsData();

  return (
    <section aria-label="pagos" className="space-y-5">
      <Header
        meta="Pagos"
        title="Gestion de pagos"
        subtitle="Consulta tus facturas pendientes, historial y metodos disponibles"
        actions={<Button variant="outline" onClick={()=>location.href='/historial'}>Ver historial</Button>}
      />
      <div className="portal-grid cols-3">
        <KpiCard variant="tile" title="Pendientes" value={`$${stats.pendingTotal.toFixed(2)}`} subtitle={`${stats.pendingCount} factura(s)`} accent="orange" icon={<CreditCardIcon />} />
        <KpiCard variant="tile" title="Pagados" value={`$${stats.paidTotal.toFixed(2)}`} subtitle={`${stats.paidCount} factura(s)`} accent="green" icon={<ReceiptIcon />} />
        <KpiCard variant="tile" title="Total facturado" value={`$${stats.total.toFixed(2)}`} subtitle="Historico acumulado" accent="blue" icon={<CalendarIcon />} />
      </div>
      <div className="portal-grid cols-2">
        <PaymentsSection items={items} loading={loading} error={error} onPay={pay} onReceipt={receipt} />
        <div className="panel">
          <div className="panel-heading">Metodos de pago disponibles</div>
          <div className="panel-sub">Elige la forma de pago mas conveniente para ti.</div>
          <div className="portal-grid cols-1 mt-3">
            <div className="panel hoverable">
              <div className="panel-heading">Tarjeta de credito/debito</div>
              <div className="panel-sub">Procesamiento seguro e inmediato.</div>
              <Button className="mt-3" onClick={()=>location.href='/pagos'}>Pagar ahora</Button>
            </div>
            <div className="panel hoverable">
              <div className="panel-heading">Transferencia bancaria</div>
              <div className="panel-sub">Recibe las instrucciones por correo.</div>
              <Button className="mt-3" variant="outline">Ver datos</Button>
            </div>
            <div className="panel hoverable">
              <div className="panel-heading">Pago en oficina</div>
              <div className="panel-sub">Entrega tu comprobante de manera presencial.</div>
              <Button className="mt-3" variant="outline">Mas informacion</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

