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
    const startDay = (first.getDay() + 6) % 7; // 0=Mon
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
  const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const todayKey = (()=>{ const today=new Date(); return fmt(today); })();

  return (
    <div className="calendar card">
      <div className="flex items-center justify-between mb-2">
        <button className="icon" aria-label="Anterior" onClick={onPrev}><ChevronLeftIcon className="w-4 h-4" /></button>
        <div className="heading-sm capitalize">{title}</div>
        <button className="icon" aria-label="Siguiente" onClick={onNext}><ChevronRightIcon className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center body-muted mb-1">
        {weekdays.map((day)=> <div key={day} className="py-1">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((row, i) => (
          <Fragment key={`week-${i}`}>
            {row.map((date, j)=>{
              if (!date) return <div key={`empty-${i}-${j}`} className="h-8" />;
              const key = fmt(date);
              const count = availableByDay[key] || 0;
              const isPastDay = new Date(key) < new Date(todayKey);
              const isSelected = selectedDate === key;
              const canSelect = count > 0 && !isPastDay;
              return (
                <button
                  key={key}
                  className={`h-8 rounded-md border text-sm ${isSelected ? 'bg-[var(--brand-secondary)] text-white border-transparent' : 'border-[var(--border-soft)] bg-white'} ${canSelect ? '' : 'opacity-50 cursor-not-allowed'}`}
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
      <div className="mt-2 text-xs body-muted">
        <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background:'var(--brand-secondary)' }} />
        Dia seleccionado · {Object.values(availableByDay).reduce((acc, value)=>acc+value,0)} horarios en el mes
      </div>
    </div>
  );
}

