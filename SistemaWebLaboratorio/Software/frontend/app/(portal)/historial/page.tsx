"use client";
import { useEffect, useState } from 'react';
import { Header } from '../components/header';
import { Button } from '../../../components/ui/button';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';
import { CalendarIcon, FileIcon, CreditCardIcon, UserIcon, ClockIcon } from '../../../components/ui/icons';

type ActivityItem = {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  ip_address?: string;
  metadatos?: any;
};

const activityIcons: Record<string, any> = {
  'LOGIN': UserIcon,
  'CITA_CREADA': CalendarIcon,
  'CITA_CANCELADA': CalendarIcon,
  'RESULTADO_DESCARGADO': FileIcon,
  'PAGO_REALIZADO': CreditCardIcon,
  'PERFIL_ACTUALIZADO': UserIcon,
  'DEFAULT': ClockIcon,
};

const activityColors: Record<string, string> = {
  'LOGIN': 'text-[var(--brand-primary)]',
  'CITA_CREADA': 'text-[var(--accent-success)]',
  'CITA_CANCELADA': 'text-[var(--accent-danger)]',
  'RESULTADO_DESCARGADO': 'text-[var(--accent-info)]',
  'PAGO_REALIZADO': 'text-[var(--accent-warning)]',
  'PERFIL_ACTUALIZADO': 'text-[var(--brand-secondary)]',
  'DEFAULT': 'text-[var(--text-muted)]',
};

export default function Page() {
  const { accessToken } = useSessionStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'citas' | 'resultados' | 'pagos' | 'perfil'>('all');

  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      setLoading(true);
      try {
        const res = await api<{ items: ActivityItem[] }>(`/profile/history`, { method: 'GET' }, accessToken);
        setActivities(res.items || []);
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'citas') return activity.tipo.includes('CITA');
    if (filter === 'resultados') return activity.tipo.includes('RESULTADO');
    if (filter === 'pagos') return activity.tipo.includes('PAGO');
    if (filter === 'perfil') return activity.tipo.includes('PERFIL') || activity.tipo === 'LOGIN';
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return 'Hace ' + diffMins + ' minuto' + (diffMins > 1 ? 's' : '');
    if (diffHours < 24) return 'Hace ' + diffHours + ' hora' + (diffHours > 1 ? 's' : '');
    if (diffDays < 7) return 'Hace ' + diffDays + ' dia' + (diffDays > 1 ? 's' : '');

    return date.toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section aria-label="historial" className="space-y-6">
      <Header
        meta="Mi Cuenta"
        title="Historial de Actividad"
        subtitle="Registro de todas tus acciones e interacciones en el sistema"
        actions={
          <Button variant="outline" onClick={() => location.href = '/dashboard'}>
            Volver al inicio
          </Button>
        }
      />

      <div className="panel">
        <div className="panel-heading mb-3">Filtrar actividades</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={'chip ' + (filter === 'all' ? 'chip-active' : '')}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('citas')}
            className={'chip ' + (filter === 'citas' ? 'chip-active' : '')}
          >
            Citas
          </button>
          <button
            onClick={() => setFilter('resultados')}
            className={'chip ' + (filter === 'resultados' ? 'chip-active' : '')}
          >
            Resultados
          </button>
          <button
            onClick={() => setFilter('pagos')}
            className={'chip ' + (filter === 'pagos' ? 'chip-active' : '')}
          >
            Pagos
          </button>
          <button
            onClick={() => setFilter('perfil')}
            className={'chip ' + (filter === 'perfil' ? 'chip-active' : '')}
          >
            Perfil y Sesion
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading mb-3">
          {filteredActivities.length} {filteredActivities.length === 1 ? 'actividad registrada' : 'actividades registradas'}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-20 rounded-lg"></div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
            <p className="text-[var(--text-muted)]">No hay actividades registradas</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Tus interacciones apareceran aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity, index) => {
              const Icon = activityIcons[activity.tipo] || activityIcons.DEFAULT;
              const colorClass = activityColors[activity.tipo] || activityColors.DEFAULT;

              return (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-4 p-4 bg-[var(--surface-hover)] border border-[var(--border-soft)] rounded-lg hover:border-[var(--brand-primary)] transition-all"
                >
                  <div className={'flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 ' + colorClass.replace('text-', 'border-') + ' flex items-center justify-center'}>
                    <Icon className={'w-5 h-5 ' + colorClass} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--text-main)]">
                          {activity.descripcion}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {formatDate(activity.fecha)}
                          </span>
                          {activity.ip_address && (
                            <span className="flex items-center gap-1">
                              IP: {activity.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={'text-xs font-semibold px-2 py-1 rounded-full ' + colorClass + ' bg-current bg-opacity-10'}>
                        {activity.tipo.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel bg-[#F0F6FF] border-[#BFDBFE]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[var(--text-main)] mb-1">
              Acerca del historial
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Este registro mantiene un historial de tus actividades principales en el sistema.
              Los datos se conservan por motivos de seguridad y auditoria segun nuestras politicas de privacidad.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
