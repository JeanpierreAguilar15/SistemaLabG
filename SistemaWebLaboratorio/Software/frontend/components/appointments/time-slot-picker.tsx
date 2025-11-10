"use client";
import { useMemo, useState } from 'react';

export type Slot = { slot_id:number; inicio:string; fin:string };

type Props = {
  slots: Slot[];
  selected?: number | null;
  onSelect: (slotId: number) => void;
};

export function TimeSlotPicker({ slots, selected, onSelect }: Props){
  const [filter, setFilter] = useState<'all'|'morning'|'afternoon'|'evening'>('all');

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    const fitsFilter = (d: Date) => {
      const hour = d.getHours();
      if (filter === 'morning') return hour < 12;
      if (filter === 'afternoon') return hour >= 12 && hour < 18;
      if (filter === 'evening') return hour >= 18;
      return true;
    };
    for (const slot of slots) {
      const date = new Date(slot.inicio);
      if (!fitsFilter(date)) continue;
      const hourKey = `${date.getHours().toString().padStart(2,'0')}:00`;
      const arr = map.get(hourKey) || [];
      arr.push(slot);
      map.set(hourKey, arr);
    }
    return Array.from(map.entries()).sort((a,b)=> a[0].localeCompare(b[0]));
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
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        <button className={`chip ${filter==='all'?'chip-active':''}`} onClick={()=>setFilter('all')}>
          Todos <span className="ml-1 body-muted">({countByFilter.all})</span>
        </button>
        <button className={`chip ${filter==='morning'?'chip-active':''}`} onClick={()=>setFilter('morning')}>
          Mañana <span className="ml-1 body-muted">({countByFilter.morning})</span>
        </button>
        <button className={`chip ${filter==='afternoon'?'chip-active':''}`} onClick={()=>setFilter('afternoon')}>
          Tarde <span className="ml-1 body-muted">({countByFilter.afternoon})</span>
        </button>
        <button className={`chip ${filter==='evening'?'chip-active':''}`} onClick={()=>setFilter('evening')}>
          Noche <span className="ml-1 body-muted">({countByFilter.evening})</span>
        </button>
      </div>
      <div className="mt-3 max-h-[50vh] overflow-auto pr-1">
        {grouped.length === 0 && (
          <div className="subtitle">No hay horarios para este filtro.</div>
        )}
        {grouped.map(([hour, slotsForHour]) => (
          <div key={hour} className="mb-3">
            <div className="text-xs body-muted mb-1">{hour}</div>
            <div className="flex flex-wrap gap-2">
              {slotsForHour.map(slot => {
                const start = new Date(slot.inicio);
                const end = new Date(slot.fin);
                const label = `${start.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} - ${end.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`;
                const isSelected = selected === slot.slot_id;
                return (
                  <button
                    key={slot.slot_id}
                    onClick={()=> onSelect(slot.slot_id)}
                    className={`px-3 py-2 rounded-md border text-sm ${isSelected ? 'border-[var(--brand-secondary)] bg-[var(--brand-secondary)] text-white' : 'border-[var(--border-soft)] bg-white hover:bg-[#f3f4f6]'}`}
                    aria-pressed={isSelected}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
