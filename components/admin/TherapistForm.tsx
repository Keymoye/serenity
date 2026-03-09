"use client";
import React, { useState, useEffect } from "react";
import { postJson, apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { logger } from "@/lib/utils/logger";
import type { AdminTherapistInput } from "@/lib/utils/validation";

type TherapistFormInput = AdminTherapistInput & { id?: string };

type Props = {
  initial?: TherapistFormInput | null;
  onSaved?: () => void;
};

export default function TherapistForm({ initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");
  // entityId is either existing therapist id or a temporary string
  const entityId = initial?.id ?? "new";
  const [bio, setBio] = useState(initial?.bio_short ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allServices, setAllServices] = useState<
    Array<{ id: string; name: string; category: string | null }>
  >([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    []
  );
  const [loadingServices, setLoadingServices] = useState(false);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingServices(true);
      try {
        // Load all available services
        const res = await fetch(
          '/api/admin/therapists?forAssignment=true'
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAllServices(data.services ?? []);

        // If editing, load current assignments
        if (initial?.id) {
          const assignRes = await fetch(
            `/api/therapists/${initial.id}`
          );
          const assignData = await assignRes.json();
          const currentIds = (assignData.services ?? [])
            .map((s: { id: string }) => s.id);
          setSelectedServiceIds(currentIds);
        }
      } catch (err) {
        logger.error("Failed to load services for therapist form", err);
      } finally {
        setLoadingServices(false);
      }
    }
    load();
  }, [initial?.id]);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { name, title, photo_url: photoUrl, bio_short: bio, is_active: Boolean(isActive), serviceIds: selectedServiceIds };
      if (initial?.id) {
        await apiFetch(`/api/admin/therapists`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, ...payload }),
        });
      } else {
        await postJson(`/api/admin/therapists`, payload);
      }
      // Call parent callback to refresh list or close modal
      onSaved?.();
      setLoading(false);
    } catch (err: unknown) {
      logger.error('Failed to save therapist', err);
      setError(err instanceof Error ? err.message : "Failed to save therapist");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
      </div>
      <div>
        <ImageUpload
          currentUrl={photoUrl}
          bucket="therapist-photos"
          entityId={entityId}
          onUpload={(url) => setPhotoUrl(url)}
          label="Profile photo"
          aspectRatio="square"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Bio</label>
        <textarea
          value={bio ?? ""}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span className="text-sm text-slate-700">Active</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium 
                           text-stone-700 mb-2">
          Services offered
        </label>
        {loadingServices ? (
          <p className="text-sm text-stone-400">
            Loading services...
          </p>
        ) : allServices.length === 0 ? (
          <p className="text-sm text-stone-400">
            No services available
          </p>
        ) : (
          <div className="space-y-2 max-h-48 
                          overflow-y-auto border 
                          border-stone-200 rounded-xl p-3">
            {allServices.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-3 
                           cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedServiceIds.includes(
                    service.id
                  )}
                  onChange={() => toggleService(service.id)}
                  className="h-4 w-4 rounded border-stone-300 
                             text-stone-800 
                             focus:ring-stone-500"
                />
                <span className="text-sm text-stone-700 
                                 group-hover:text-stone-900">
                  {service.name}
                  {service.category && (
                    <span className="text-stone-400 ml-1">
                      · {service.category}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div>
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size={4} /> Saving...
            </>
          ) : initial ? (
            "Update"
          ) : (
            "Create"
          )}
        </button>
      </div>
    </form>
  );
}
