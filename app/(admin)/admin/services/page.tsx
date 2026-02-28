"use client";

import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  adminServiceSchema,
  type AdminServiceInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type ServiceRow = {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  is_active: boolean | null;
  updated_at: string | null;
};

type FormState = {
  values: AdminServiceInput;
  error: string | null;
  isSubmitting: boolean;
};

const INITIAL_FORM: AdminServiceInput = {
  name: "",
  category: "",
  duration_minutes: 60,
  price: 120,
  is_active: true,
};

export default function AdminServicesPage() {
  const supabase = getBrowserSupabaseClient();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    values: INITIAL_FORM,
    error: null,
    isSubmitting: false,
  });

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select(
          "id, name, category, duration_minutes, price, is_active, updated_at"
        )
        .order("updated_at", { ascending: false });

      if (error) {
        logger.error("Failed to load admin services", error);
        return;
      }

      setServices((data ?? []) as ServiceRow[]);
    } catch (error) {
      logger.error("Unexpected error while loading admin services", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const handleToggleActive = async (service: ServiceRow) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: !service.is_active })
        .eq("id", service.id);

      if (error) {
        logger.error("Failed to toggle service active", error, {
          serviceId: service.id,
        });
        return;
      }

      await loadServices();
    } catch (error) {
      logger.error("Unexpected error toggling service active", error, {
        serviceId: service.id,
      });
    }
  };

  const handleChange =
    (field: keyof AdminServiceInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "duration_minutes" || field === "price"
          ? Number(event.target.value)
          : event.target.value;
      setForm((prev) => ({
        ...prev,
        values: { ...(prev.values as Record<string, unknown>), [field]: value } as AdminServiceInput,
      }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setForm((prev) => ({
      ...prev,
      error: null,
      isSubmitting: true,
    }));

    const parsed = adminServiceSchema.safeParse(form.values);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message ?? "Invalid input.";
      setForm((prev) => ({
        ...prev,
        error: firstError,
        isSubmitting: false,
      }));
      return;
    }

    try {
      const { error } = await supabase.from("services").insert({
        name: parsed.data.name,
        category: parsed.data.category || null,
        duration_minutes: parsed.data.duration_minutes,
        price: parsed.data.price,
        is_active:
          typeof parsed.data.is_active === "boolean"
            ? parsed.data.is_active
            : true,
      });

      if (error) {
        logger.error("Failed to create service", error);
        setForm((prev) => ({
          ...prev,
          error: "Unable to create service.",
          isSubmitting: false,
        }));
        return;
      }

      setForm({
        values: INITIAL_FORM,
        error: null,
        isSubmitting: false,
      });
      await loadServices();
    } catch (error) {
      logger.error("Unexpected error creating service", error);
      setForm((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again.",
        isSubmitting: false,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Services
        </h1>
        <p className="text-sm text-slate-700">
          Manage your catalog of treatments, pricing, and availability.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Existing services
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Duration</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-sm text-slate-600"
                  >
                    Loading services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-sm text-slate-600"
                  >
                    No services defined yet.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">
                        {service.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {service.category || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {service.duration_minutes
                        ? `${service.duration_minutes} min`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {service.price != null
                        ? `$${service.price.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          service.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {service.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(service)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {service.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Create new service
        </h2>
        {form.error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {form.error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">
              Name
            </label>
            <input
              type="text"
              value={form.values.name}
              onChange={handleChange("name")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">
              Category
            </label>
            <input
              type="text"
              value={form.values.category ?? ""}
              onChange={handleChange("category")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={15}
              max={600}
              value={form.values.duration_minutes}
              onChange={handleChange("duration_minutes")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">
              Price
            </label>
            <input
              type="number"
              min={0}
              value={form.values.price}
              onChange={handleChange("price")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={form.values.is_active ?? true}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    values: {
                      ...prev.values,
                      is_active: e.target.checked,
                    },
                  }))
                }
                className="h-3 w-3 rounded border-slate-300"
              />
              Active (visible for booking)
            </label>
            <button
              type="submit"
              disabled={form.isSubmitting}
              className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {form.isSubmitting ? "Creating..." : "Create service"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

