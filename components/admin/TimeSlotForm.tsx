"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, postJson, useApi } from "@/lib/utils/api";
import type { Therapist } from "@/lib/domain/therapist.types";
import { Spinner } from "@/components/ui/Spinner";

export function TimeSlotForm() {
  const router = useRouter();
  const { loading, error, call, setError } = useApi();
  const [therapists, setTherapists] = useState<Therapist[]>([]);

  const [therapistId, setTherapistId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const list = await apiFetch<Therapist[]>("/api/admin/therapists");
        setTherapists(list);
        if (list.length > 0) setTherapistId(list[0].id);
      } catch (err: unknown) {
        setError((err as Error).message);
      }
    };
    void load();
  }, [setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!therapistId || !date || !startTime || !endTime) {
      setError("All fields are required.");
      return;
    }

    const start_iso = `${date}T${startTime}`;
    const end_iso = `${date}T${endTime}`;

    await call(async () => {
      await postJson("/api/admin/time-slots", {
        therapistId,
        start_time: start_iso,
        end_time: end_iso,
      });
    });

    router.refresh();
    setDate("");
    setStartTime("");
    setEndTime("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">Add time slot</h2>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">Therapist</label>
          <select
            value={therapistId}
            onChange={(e) => setTherapistId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">End time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading && <Spinner size={4} />}
        Add slot
      </button>
    </form>
  );
}
