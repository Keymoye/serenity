"use client";

import { useEffect, useState, useCallback } from "react";
import {
  adminServiceSchema,
  type AdminServiceInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { apiFetch } from "@/lib/utils/api";
import { useRouter } from "next/navigation";
import ServiceForm from "@/components/admin/ServiceForm";

type ServiceRow = {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  is_active: boolean | null;
  thumbnail_url: string | null;
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
  const router = useRouter();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    values: INITIAL_FORM,
    error: null,
    isSubmitting: false,
  });
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ServiceRow[]>("/api/admin/services");
      setServices(data);
    } catch (error) {
      logger.error("Unexpected error while loading admin services", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const handleToggleActive = async (service: ServiceRow) => {
    try {
        try {
        await apiFetch("/api/admin/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: service.id, is_active: !service.is_active, name: service.name, category: service.category, duration_minutes: service.duration_minutes, price: service.price }),
        });
        await loadServices();
      } catch (err) {
        logger.error("Failed to toggle service active", err, { serviceId: service.id });
      }
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
      try {
        await apiFetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: parsed.data.name,
            category: parsed.data.category || null,
            duration_minutes: parsed.data.duration_minutes,
            price: parsed.data.price,
            is_active: typeof parsed.data.is_active === "boolean" ? parsed.data.is_active : true,
          }),
        });
        // reload after successful creation
        await loadServices();
        setForm({ values: INITIAL_FORM, error: null, isSubmitting: false });
      } catch (err) {
        logger.error("Failed to create service", err);
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
                <th className="px-3 py-2 text-left">Image</th>
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
                    colSpan={7}
                    className="px-3 py-4 text-sm text-slate-600"
                  >
                    Loading services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-sm text-slate-600"
                  >
                    No services defined yet.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-4 py-3">
                      {service.thumbnail_url ? (
                        <img
                          src={service.thumbnail_url}
                          alt={service.name}
                          className="h-10 w-10 rounded-lg 
                                     object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg 
                                        bg-stone-100 flex items-center 
                                        justify-center text-stone-400 
                                        text-xs">
                          No img
                        </div>
                      )}
                    </td>
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
                        onClick={() => {
                          setEditingService(service)
                          setShowForm(true)
                        }}
                        className="text-sm text-sky-600 
                                   hover:text-sky-800 
                                   transition-colors mr-2"
                      >
                        Edit
                      </button>
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
        <button
          onClick={() => {
            setEditingService(null)
            setShowForm(true)
          }}
          className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
        >
          Add service
        </button>
      </section>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start
                     justify-center bg-black/40 
                     overflow-y-auto p-4 pt-16"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl 
                       w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center 
                            justify-between mb-4">
              <h2 className="text-lg font-semibold 
                             text-stone-800">
                {editingService 
                  ? "Edit service" 
                  : "Add service"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-stone-400 
                           hover:text-stone-600 
                           text-xl leading-none"
              >
                ×
              </button>
            </div>
            <ServiceForm
              initial={editingService ? {
                ...editingService,
                is_active: editingService.is_active ?? true
              } : undefined}
              onSaved={() => {
                setShowForm(false)
                setEditingService(null)
                loadServices()
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

