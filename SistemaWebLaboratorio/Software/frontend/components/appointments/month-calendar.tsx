"use client";
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons';
import { Fragment, useMemo } from 'react';

export function MonthCalendar({
  currentMonth,
  availableByDay,
  selectedDate,
  onSelect,
  onPrev,
  onNext,
}: {
  currentMonth: Date;
  availableByDay: Record<string, number>;
  selectedDate: string | null;
  onSelect: (dateStr: string) => void;
  onPrev: () => void;
  onNext: () => void;
}){
  const { weeks, title } = useMemo(()=> {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const cells: (Date|null)[] = [];
    for (let i=0;i<startDay;i++) cells.push(null);
    for (let day=1; day<=daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);
    const computedWeeks: (Date|null)[][] = [];
    for (let i=0; i<cells.length; i+=7) computedWeeks.push(cells.slice(i, i+7));
    const label = currentMonth.toLocaleDateString(undefined, { month:'long', year:'numeric' });
    return { weeks: computedWeeks, title: label };
  }, [currentMonth]);

  const fmt = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const todayKey = (()=>{ const today=new Date(); return fmt(today); })();

  const totalSlots = Object.values(availableByDay).reduce((acc, value)=>acc+value,0);

  return (
    <div className="calendar-modern">
      <div className="calendar-header">
        <h3 className="calendar-title capitalize">{title}</h3>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" aria-label="Mes anterior" onClick={onPrev}>
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button className="calendar-nav-btn" aria-label="Mes siguiente" onClick={onNext}>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekdays.map((day)=> (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}

        {weeks.map((row, i) => (
          <Fragment key={`week-${i}`}>
            {row.map((date, j)=>{
              if (!date) return <div key={`empty-${i}-${j}`} className="aspect-square" />;
              const key = fmt(date);
              const count = availableByDay[key] || 0;
              const isPastDay = new Date(key) < new Date(todayKey);
              const isToday = todayKey === key;
              const isSelected = selectedDate === key;
              const canSelect = count > 0 && !isPastDay;
              const hasSlots = count > 0;

              let className = 'calendar-day';
              if (isSelected) className += ' calendar-day--selected';
              else if (!canSelect) className += ' calendar-day--disabled';
              else if (isToday) className += ' calendar-day--today';
              if (hasSlots && !isPastDay) className += ' calendar-day--has-slots';

              return (
                <button
                  key={key}
                  className={className}
                  onClick={()=> { if (canSelect) onSelect(key); }}
                  disabled={!canSelect}
                  title={canSelect ? `${count} horarios disponibles` : (isPastDay ? 'Fecha pasada' : 'Sin disponibilidad')}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-success)]"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-lg bg-[var(--brand-primary)]"></div>
            <span>Seleccionado</span>
          </div>
        </div>
        <div className="font-medium text-[var(--text-main)]">
          {totalSlots} horarios en el mes
        </div>
      </div>
    </div>
  );
}
