"use client";

import { useCallback, useEffect, useState } from "react";
import { adminTherapistSchema, type AdminTherapistInput } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { apiFetch } from "@/lib/utils/api";

type TherapistRow = {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

const INITIAL_FORM: AdminTherapistInput = {
  name: "",
  title: "",
  photo_url: "",
  bio_short: "",
  is_active: true,
};

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<TherapistRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ values: AdminTherapistInput; error: string | null; isSubmitting: boolean }>({ values: INITIAL_FORM, error: null, isSubmitting: false });

  const loadTherapists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<TherapistRow[]>("/api/admin/therapists");
      setTherapists(data);
    } catch (err) {
      logger.error("Unexpected error loading therapists", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTherapists();
  }, [loadTherapists]);

  const handleToggleActive = async (t: TherapistRow) => {
    // Local-only toggle: update UI without calling server (no-op on backend)
    setTherapists((prev) => prev.map((p) => (p.id === t.id ? { ...p, is_active: !p.is_active } : p)));
  };



  const handleChange = (field: keyof AdminTherapistInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, values: { ...(prev.values as Record<string, unknown>), [field]: value } as AdminTherapistInput }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, error: null, isSubmitting: true }));
    const parsed = adminTherapistSchema.safeParse(form.values);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message ?? "Invalid input.";
      setForm((prev) => ({ ...prev, error: firstError, isSubmitting: false }));
      return;
    }

    try {
      await apiFetch("/api/admin/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          title: parsed.data.title || null,
          photo_url: parsed.data.photo_url || null,
          bio_short: parsed.data.bio_short || null,
          is_active: parsed.data.is_active ?? true,
        }),
      });
      setForm({ values: INITIAL_FORM, error: null, isSubmitting: false });
      await loadTherapists();
    } catch (err) {
      logger.error("Unexpected error creating therapist", err);
      setForm((prev) => ({ ...prev, error: "Something went wrong.", isSubmitting: false }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Therapists</h1>
        <p className="text-sm text-slate-700">Manage therapist profiles and availability.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Existing therapists</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-sm text-slate-600">Loading therapists...</td>
                </tr>
              ) : therapists.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-sm text-slate-600">No therapists defined yet.</td>
                </tr>
              ) : (
                therapists.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{t.name}</td>
                    <td className="px-3 py-2 text-slate-700">{t.title ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{t.is_active ? "Active" : "Hidden"}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => handleToggleActive(t)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">{t.is_active ? "Deactivate" : "Activate"}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Create new therapist</h2>
        {form.error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">Name</label>
            <input required type="text" value={form.values.name} onChange={(e) => setForm((p) => ({ ...p, values: { ...p.values, name: e.target.value } }))} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">Title</label>
            <input type="text" value={form.values.title ?? ""} onChange={handleChange("title")} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">Photo URL</label>
            <input type="text" value={form.values.photo_url ?? ""} onChange={handleChange("photo_url")} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">Short bio</label>
            <textarea value={form.values.bio_short ?? ""} onChange={handleChange("bio_short")} rows={3} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={form.values.is_active ?? true} onChange={(e) => setForm((prev) => ({ ...prev, values: { ...prev.values, is_active: e.target.checked } }))} className="h-3 w-3 rounded border-slate-300" />
              Active
            </label>
            <button type="submit" disabled={form.isSubmitting} className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300">{form.isSubmitting ? "Creating..." : "Create therapist"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
