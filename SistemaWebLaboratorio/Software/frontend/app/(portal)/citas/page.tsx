import { Header } from '../components/header';
import { Button } from '../../../components/ui/button';
import { StatusBadge } from '../../../components/ui/status-badge';
import { CalendarIcon } from '../../../components/ui/icons';

export default function Page(){
  return (
    <section aria-label="citas">
      <Header title="Gestión de Citas" subtitle="Agenda y gestiona tus citas médicas" />
      <div className="row cols-2 mt-4">
        <div className="card">
          <div className="heading-sm flex items-center gap-2"><CalendarIcon /> Calendario</div>
          <div className="body-muted">Selecciona una fecha para ver disponibilidad</div>
          <div className="mt-3 grid grid-cols-7 gap-2 text-center">
            {['su','mo','tu','we','th','fr','sa'].map(d => <div key={d} className="text-[var(--text-muted)] text-sm">{d}</div>)}
            {Array.from({length:35}).map((_,i)=> (
              <div key={i} className={`py-2 rounded-md ${i===26? 'bg-black text-white': 'bg-white border border-[var(--border-soft)]'}`}>{i<2? '' : (i-1)}</div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between"><div className="heading-sm">Mis Citas</div><Button variant="danger">Nueva Cita</Button></div>
          <div className="body-muted">Lista de citas agendadas</div>
          <div className="mt-3 space-y-2">
            {[
              { t:'análisis de sangre', f:'24 oct 2025 • 10:30 am', s:'confirmada' as const },
              { t:'perfil lipídico', f:'23 oct 2025 • 2:00 pm', s:'completado' as const },
              { t:'hemograma completo', f:'25 oct 2025 • 11:00 am', s:'pendiente' as const },
              { t:'análisis de orina', f:'26 oct 2025 • 9:00 am', s:'confirmada' as const },
            ].map((c,i)=> (
              <div key={i} className="flex items-center justify-between rounded-md border border-[var(--border-soft)] bg-white p-3">
                <div>
                  <div className="font-medium">{c.t}</div>
                  <div className="body-muted">{c.f}</div>
                </div>
                <StatusBadge status={c.s} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="row cols-3 mt-4">
        <div className="card"><div className="body-muted">Total de Citas</div><div className="heading-lg mt-1">4</div></div>
        <div className="card"><div className="body-muted">Confirmadas</div><div className="heading-lg mt-1">2</div></div>
        <div className="card"><div className="body-muted">Completadas</div><div className="heading-lg mt-1">1</div></div>
      </div>
    </section>
  );
}
