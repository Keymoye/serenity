"use client";

import React from 'react';

type Slot = { id: string; start_time: string; status?: 'available'|'locked'|'booked' };

interface TimeSlotGridProps {
  slots: Slot[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function TimeSlotGrid({ slots, selectedId, onSelect }: TimeSlotGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map(slot => {
        const label = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isSelected = selectedId === slot.id;
        const cls = slot.status === 'booked' ? 'border-slate-200 text-slate-400' : slot.status === 'locked' ? 'border-amber-400 text-amber-700' : isSelected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50';
        return (
          <button key={slot.id} type="button" onClick={() => onSelect?.(slot.id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>{label}</button>
        );
      })}
    </div>
  );
}
