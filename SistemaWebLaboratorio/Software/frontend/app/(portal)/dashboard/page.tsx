import { Header } from '../components/header';
import { KpiCard } from '../../../components/ui/kpi-card';
import { CalendarIcon, FileIcon, CreditCardIcon } from '../../../components/ui/icons';
import { RecentResults } from '../../../components/lists/recent-results.client';
import { Button } from '../../../components/ui/button';

export default async function Page(){
  return (
    <section aria-label="dashboard">
      <Header title="Bienvenida, María" subtitle="Gestiona tus citas y resultados médicos" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
        <KpiCard title="Próxima Cita" value="25 Oct 2025" subtitle="Análisis de sangre • 10:30 AM" accent="red" icon={<CalendarIcon />} />
        <KpiCard title="Resultados Pendientes" value={2} subtitle="En proceso de análisis" accent="blue" icon={<FileIcon />} action={<a href="/resultados" className="text-[var(--brand-secondary)]">Ver detalles →</a>} />
        <KpiCard title="Pagos Pendientes" value="$245.00" subtitle="1 factura pendiente" accent="orange" icon={<CreditCardIcon />} action={<a href="/pagos" className="text-[var(--brand-secondary)]">Pagar ahora →</a>} />
      </div>

      <div className="mt-4">
        <RecentResults
          items={[
            { titulo:'Análisis de Glucosa', fecha:'15 Oct 2025', estado:'completado' },
            { titulo:'Hemograma Completo', fecha:'20 Oct 2025', estado:'en-proceso' },
            { titulo:'Perfil Lipídico', fecha:'08 Oct 2025', estado:'completado' },
          ]}
        />
      </div>

      <div className="row cols-2 mt-4">
        <div className="card">
          <div className="heading-sm">Agendar Nueva Cita</div>
          <div className="body-muted">Reserva tu próxima cita de análisis clínico</div>
          <Button className="w-full mt-3" variant="danger">+ Nueva Cita</Button>
        </div>
        <div className="card">
          <div className="heading-sm">Solicitar Cotización</div>
          <div className="body-muted">Obtén el precio de los análisis que necesitas</div>
          <Button className="w-full mt-3">+ Nueva Cotización</Button>
        </div>
      </div>
    </section>
  );
}
