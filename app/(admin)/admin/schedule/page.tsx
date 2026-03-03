"use client";

import { useCallback, useEffect, useState } from "react";
import { adminTimeSlotCreateSchema, type AdminTimeSlotCreateInput } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type SlotRow = {
  id: string;
  therapist_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean | null;
};

const INITIAL_FORM: AdminTimeSlotCreateInput = {
  therapistId: "",
  start_time: "",
  end_time: "",
};

export default function AdminSchedulePage() {
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ values: AdminTimeSlotCreateInput; error: string | null; isSubmitting: boolean }>({ values: INITIAL_FORM, error: null, isSubmitting: false });

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/time-slots");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        logger.error("Failed to load time slots", body);
        return;
      }
      setSlots((body ?? []) as SlotRow[]);
    } catch (err) {
      logger.error("Unexpected error loading time slots", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, error: null, isSubmitting: true }));
    const parsed = adminTimeSlotCreateSchema.safeParse(form.values);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message ?? "Invalid input.";
      setForm((prev) => ({ ...prev, error: firstError, isSubmitting: false }));
      return;
    }

    try {
      const res = await fetch("/api/admin/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        logger.error("Failed to create time slot", body);
        setForm((prev) => ({ ...prev, error: "Unable to create time slot.", isSubmitting: false }));
        return;
      }
      setForm({ values: INITIAL_FORM, error: null, isSubmitting: false });
      await loadSlots();
    } catch (err) {
      logger.error("Unexpected error creating time slot", err);
      setForm((prev) => ({ ...prev, error: "Something went wrong.", isSubmitting: false }));
    }
  };

  const handleChange = (field: keyof AdminTimeSlotCreateInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, values: { ...(prev.values as Record<string, unknown>), [field]: e.target.value } as AdminTimeSlotCreateInput }));
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Schedule</h1>
        <p className="text-sm text-slate-700">Manage therapist time slots.</p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Existing slots</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white mt-2">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Therapist</th>
                <th className="px-3 py-2 text-left">Start</th>
                <th className="px-3 py-2 text-left">End</th>
                <th className="px-3 py-2 text-left">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-3 py-4 text-sm text-slate-600">Loading slots...</td></tr>
              ) : slots.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-4 text-sm text-slate-600">No slots defined yet.</td></tr>
              ) : (
                slots.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-slate-900">{s.therapist_id}</td>
                    <td className="px-3 py-2 text-slate-700">{s.start_time}</td>
                    <td className="px-3 py-2 text-slate-700">{s.end_time}</td>
                    <td className="px-3 py-2">{s.is_available ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Create time slot</h2>
        {form.error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</div>}
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">Therapist ID</label>
            <input required type="text" value={form.values.therapistId} onChange={handleChange("therapistId")} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">Start (ISO)</label>
            <input required type="text" value={form.values.start_time} onChange={handleChange("start_time")} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">End (ISO)</label>
            <input required type="text" value={form.values.end_time} onChange={handleChange("end_time")} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center justify-end pt-1">
            <button type="submit" disabled={form.isSubmitting} className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300">{form.isSubmitting ? "Creating..." : "Create slot"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
