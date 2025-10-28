import { Header } from '../components/header';
import { PaymentsSection } from '../../../components/data/payments.client';
import { KpiCard } from '../../../components/ui/kpi-card';
import { Button } from '../../../components/ui/button';
import { Suspense } from 'react';

export default function Page(){
  return (
    <section aria-label="pagos">
      <Header title="Gestión de Pagos" subtitle="Administra tus pagos y facturas" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
        <KpiCard title="Pagos Pendientes" value={'—'} accent="orange" />
        <KpiCard title="Pagos Completados" value={'—'} accent="green" />
        <KpiCard title="Total Facturado" value={'—'} accent="blue" />
      </div>
      <div className="mt-4">
        <Suspense fallback={<div className="card" aria-busy="true">Cargando pagos…</div>}>
          <PaymentsSection />
        </Suspense>
      </div>
      <div className="card mt-4">
        <div className="heading-sm">Métodos de Pago Disponibles</div>
        <div className="body-muted">Elige la forma de pago más conveniente para ti</div>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3 mt-3">
          <div className="border border-[var(--border-soft)] rounded-md p-4">Tarjeta de crédito/débito <Button className="mt-2">Pagar</Button></div>
          <div className="border border-[var(--border-soft)] rounded-md p-4">Transferencia bancaria <Button className="mt-2" variant="outline">Ver datos</Button></div>
          <div className="border border-[var(--border-soft)] rounded-md p-4">Comprobante en oficina <Button className="mt-2" variant="outline">Más info</Button></div>
        </div>
      </div>
    </section>
  );
}
