"use client";

import { useMemo, useState, useEffect } from "react";

interface CalendarPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

// simple month calendar; doesn't handle localization or week start days
export function CalendarPicker({ selectedDate, onSelectDate }: CalendarPickerProps) {
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate) {
      setCurrentDate(new Date().toISOString().slice(0,10));
    }
  }, []);

  const effectiveDate = selectedDate || currentDate;
  const displayMonth = useMemo(() => (effectiveDate ? new Date(effectiveDate) : new Date()), [effectiveDate]);

  const year = displayMonth.getFullYear();
  
  if (!effectiveDate) {
    // while we wait for client-side effect, render empty placeholder
    return <div className="w-full max-w-sm sm:max-w-xs">Loading calendar…</div>;
  }
  const month = displayMonth.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // compute weekday of first cell (0=Sunday)
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: Array<{ day: number; date: Date }> = [];

  // fill blanks for previous month
  for (let i = 0; i < startWeekday; i++) {
    days.push({ day: 0, date: new Date(0) });
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push({ day: d, date: new Date(year, month, d) });
  }

  const monthLabel = displayMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const formatIso = (date: Date) => date.toISOString().slice(0, 10);

  return (
    <div className="w-full max-w-sm sm:max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onSelectDate(new Date(year, month - 1, 1).toISOString().slice(0,10))}
          className="text-slate-600 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="text-sm font-semibold text-slate-700">
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => onSelectDate(new Date(year, month + 1, 1).toISOString().slice(0,10))}
          className="text-slate-600 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-slate-500 uppercase">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center gap-y-1">
        {days.map((cell, idx) => {
          if (cell.day === 0) {
            return <div key={idx} className="py-2" />;
          }
          const iso = formatIso(cell.date);
          const isSelected = iso === selectedDate;
          const todayIso = formatIso(new Date());
          const disabled = iso < todayIso;
          const isToday = iso === todayIso;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => !disabled && onSelectDate(iso)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`py-2 text-sm rounded-full w-9 h-9 leading-9 transition flex items-center justify-center
                ${isSelected ? 'bg-sky-600 text-white' : 'hover:bg-slate-100'}
                ${disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700'}
                ${isToday && !isSelected ? 'ring-1 ring-sky-500' : ''}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
