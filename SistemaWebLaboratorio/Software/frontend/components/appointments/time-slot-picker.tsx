"use client";
import { useMemo, useState } from 'react';
import { ClockIcon } from '../ui/icons';

export type Slot = { slot_id:number; inicio:string; fin:string };

type Props = {
  slots: Slot[];
  selected?: number | null;
  onSelect: (slotId: number) => void;
};

export function TimeSlotPicker({ slots, selected, onSelect }: Props){
  const [filter, setFilter] = useState<'all'|'morning'|'afternoon'|'evening'>('all');

  const filtered = useMemo(() => {
    const fitsFilter = (d: Date) => {
      const hour = d.getHours();
      if (filter === 'morning') return hour < 12;
      if (filter === 'afternoon') return hour >= 12 && hour < 18;
      if (filter === 'evening') return hour >= 18;
      return true;
    };
    return slots.filter(slot => fitsFilter(new Date(slot.inicio)));
  }, [slots, filter]);

  const countByFilter = useMemo(()=> {
    const counters = { all: slots.length, morning:0, afternoon:0, evening:0 } as Record<string, number>;
    for (const slot of slots){
      const hour = new Date(slot.inicio).getHours();
      if (hour < 12) counters.morning++;
      else if (hour < 18) counters.afternoon++;
      else counters.evening++;
    }
    return counters;
  }, [slots]);

  return (
    <div className="time-slots-container">
      <div className="time-slots-header">
        <h4 className="time-slots-title">Horarios disponibles</h4>
        <p className="time-slots-subtitle">Selecciona el horario que mejor se ajuste a tu agenda</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className={`chip ${filter==='all'?'chip-active':''}`}
          onClick={()=>setFilter('all')}
        >
          Todos ({countByFilter.all})
        </button>
        <button
          className={`chip ${filter==='morning'?'chip-active':''}`}
          onClick={()=>setFilter('morning')}
        >
          Mañana ({countByFilter.morning})
        </button>
        <button
          className={`chip ${filter==='afternoon'?'chip-active':''}`}
          onClick={()=>setFilter('afternoon')}
        >
          Tarde ({countByFilter.afternoon})
        </button>
        <button
          className={`chip ${filter==='evening'?'chip-active':''}`}
          onClick={()=>setFilter('evening')}
        >
          Noche ({countByFilter.evening})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-muted)]">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay horarios disponibles para este filtro</p>
        </div>
      ) : (
        <div className="time-slots-grid">
          {filtered.map(slot => {
            const start = new Date(slot.inicio);
            const end = new Date(slot.fin);
            const timeLabel = start.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
            const isSelected = selected === slot.slot_id;

            return (
              <button
                key={slot.slot_id}
                onClick={()=> onSelect(slot.slot_id)}
                className={`time-slot ${isSelected ? 'time-slot--selected' : ''}`}
                aria-pressed={isSelected}
              >
                <ClockIcon className="w-4 h-4 mb-1 opacity-60" />
                <span className="time-slot__time">{timeLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)] text-xs text-[var(--text-muted)] text-center">
          {filtered.length} {filtered.length === 1 ? 'horario disponible' : 'horarios disponibles'}
        </div>
      )}
    </div>
  );
}
