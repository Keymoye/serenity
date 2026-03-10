"use client";

import { useMemo, useState } from "react";
import type { TimeSlot } from "@/lib/domain/timeSlot.types";
import type { Therapist } from "@/lib/domain/therapist.types";

interface ScheduleViewerProps {
  slots: TimeSlot[];
  therapists: Therapist[];
}

// simple palette, just enough to differentiate
const PALETTE = [
  "bg-sky-200",
  "bg-emerald-200",
  "bg-rose-200",
  "bg-amber-200",
  "bg-indigo-200",
  "bg-lime-200",
  "bg-pink-200",
];

function colorForTherapist(id: string): string {
  // pick deterministic based on char codes
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return PALETTE[sum % PALETTE.length];
}

export function ScheduleViewer({ slots, therapists }: ScheduleViewerProps) {
  const [filter, setFilter] = useState<string>("all");

  const therapistMap = useMemo(() => {
    const m: Record<string, Therapist> = {};
    therapists.forEach((t) => (m[t.id] = t));
    return m;
  }, [therapists]);

  const filteredSlots = useMemo(() => {
    if (filter === "all") return slots;
    return slots.filter((s) => s.therapist_id === filter);
  }, [slots, filter]);

  const slotsByDate = useMemo(() => {
    const byDate: Record<string, TimeSlot[]> = {};
    filteredSlots.forEach((s) => {
      const date = s.start_time.split("T")[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(s);
    });
    return Object.keys(byDate)
      .sort()
      .map((d) => ({ date: d, slots: byDate[d] }));
  }, [filteredSlots]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm">
          Show
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="all">all therapists</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {slotsByDate.length === 0 ? (
        <p className="text-sm text-slate-600">No slots found.</p>
      ) : (
        slotsByDate.map(({ date, slots }) => (
          <div key={date}>
            <h3 className="text-lg font-medium text-slate-800">
              {new Date(date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <ul className="mt-2 space-y-1">
              {slots.map((s) => {
                const start = new Date(s.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const end = new Date(s.end_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const therapist = therapistMap[s.therapist_id];
                return (
                  <li
                    key={s.id}
                    className={
                      `flex items-center gap-2 text-sm text-slate-700 ` +
                      (s.is_available ? "" : "opacity-70")
                    }
                  >
                    <span
                      className={
                        `inline-block h-3 w-3 rounded-full ${
                          colorForTherapist(s.therapist_id)
                        }`
                      }
                    />
                    <span className="font-medium">
                      {therapist ? therapist.name : s.therapist_id}
                    </span>
                    <span>
                      {start}–{end}
                    </span>
                    {!s.is_available && (
                      <span className="ml-auto text-xs text-red-500">booked</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
