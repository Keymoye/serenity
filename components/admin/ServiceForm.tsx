"use client";

import React, { useState, useEffect } from "react";
import { postJson, apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { logger } from "@/lib/utils/logger";
import type { AdminServiceInput } from "@/lib/utils/validation";
import { adminServiceSchema } from "@/lib/utils/validation";

type ServiceFormInput = AdminServiceInput & { id?: string };

type Props = {
  initial?: ServiceFormInput | null;
  onSaved?: () => void;
};

export default function ServiceForm({ initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [duration, setDuration] = useState<string>(initial?.duration_minutes ? String(initial.duration_minutes) : "");
  const [price, setPrice] = useState<string>(initial?.price ? String(initial.price) : "");
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [galleryImages, setGalleryImages] = 
    useState<Array<{
      id: string
      image_url: string
      sort_order: number | null
    }>>([])
  const [galleryLoading, setGalleryLoading] = 
    useState(false)
  const [uploadingGallery, setUploadingGallery] = 
    useState(false)
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [allTherapists, setAllTherapists] = useState<
    Array<{ id: string; name: string; title: string | null }>
  >([]);
  const [selectedTherapistIds, setSelectedTherapistIds] = useState<string[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingTherapists(true);
      try {
        // Load all available therapists
        const data = await apiFetch<{ therapists: Array<{ id: string; name: string; title: string | null }> }>('/api/admin/services?forAssignment=true');
        setAllTherapists(data.therapists ?? []);

        // If editing, load current assignments
        if (initial?.id) {
          const assignData = await apiFetch<Array<{ id: string }>>(`/api/services/${initial.id}/therapists`);
          const currentIds = assignData.map((t: { id: string }) => t.id);
          setSelectedTherapistIds(currentIds);
        }
      } catch (err) {
        logger.error('Failed to load therapist data', err);
        // silently fail — assignments are not critical
      } finally {
        setLoadingTherapists(false);
      }
    }
    load();
  }, [initial?.id]);

  useEffect(() => {
    if (!initial?.id) return
    setGalleryLoading(true)
    apiFetch<{ images: Array<{ id: string; image_url: string; sort_order: number | null }> }>(`/api/admin/services/${initial.id}/images`)
      .then((data) => setGalleryImages(data.images ?? []))
      .catch((e) => logger.error('Failed to load gallery images', e))
      .finally(() => setGalleryLoading(false))
  }, [initial?.id])

  function toggleTherapist(therapistId: string) {
    setSelectedTherapistIds((prev) =>
      prev.includes(therapistId)
        ? prev.filter((id) => id !== therapistId)
        : [...prev, therapistId]
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const payload = { name, category: category || null, duration_minutes: duration ? Number(duration) : null, price: price ? Number(price) : null, is_active: isActive, description: description || null, therapistIds: selectedTherapistIds };
    
    const parsed = adminServiceSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (field) errs[field] = issue.message
      })
      setFieldErrors(errs)
      setLoading(false)
      return
    }
    setFieldErrors({})
    
    try {
      if (initial?.id) {
        await apiFetch(`/api/admin/services`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, ...payload }),
        });
      } else {
        await postJson(`/api/admin/services`, payload);
      }
      onSaved?.();
    } catch (err: unknown) {
      logger.error('Failed to save service', err);
      setError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  async function handleGalleryUpload(url: string) {
    if (!url || !initial?.id) return
    setUploadingGallery(true)
    try {
      const data = await apiFetch<{ image: { id: string; image_url: string; sort_order: number | null } }>(`/api/admin/services/${initial.id}/images`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          image_url: url,
          sort_order: galleryImages.length,
        }),
      })
      if (data.image) {
        setGalleryImages((prev) => [...prev, data.image])
      }
    } catch (e) {
      logger.error('Failed to upload gallery image', e)
    } finally {
      setUploadingGallery(false)
    }
  }

  async function handleGalleryDelete(
    imageId: string
  ) {
    if (!initial?.id) return
    try {
      await apiFetch(`/api/admin/services/${initial.id}/images`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ image_id: imageId }),
      })
      setGalleryImages((prev) => 
        prev.filter((img) => img.id !== imageId)
      )
    } catch (e) {
      logger.error('Failed to delete gallery image', e)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
        <input 
          id="name"
          value={name} 
          onChange={(e) => {
            setName(e.target.value)
            if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }))
          }} 
          className={`mt-1 block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            fieldErrors.name 
              ? 'border-red-400 focus:ring-red-300' 
              : 'border-gray-200 focus:ring-stone-300'
          }`}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name && (
          <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
            {fieldErrors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
        <input 
          id="category"
          value={category ?? ""} 
          onChange={(e) => {
            setCategory(e.target.value)
            if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: '' }))
          }} 
          className={`mt-1 block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            fieldErrors.category 
              ? 'border-red-400 focus:ring-red-300' 
              : 'border-gray-200 focus:ring-stone-300'
          }`}
          aria-describedby={fieldErrors.category ? "category-error" : undefined}
        />
        {fieldErrors.category && (
          <p id="category-error" className="mt-1 text-xs text-red-600" role="alert">
            {fieldErrors.category}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: '' }))
          }}
          rows={3}
          placeholder="Describe this service..."
          className={`mt-1 block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
            fieldErrors.description 
              ? 'border-red-400 focus:ring-red-300' 
              : 'border-stone-200 focus:ring-stone-300'
          }`}
          aria-describedby={fieldErrors.description ? "description-error" : undefined}
        />
        {fieldErrors.description && (
          <p id="description-error" className="mt-1 text-xs text-red-600" role="alert">
            {fieldErrors.description}
          </p>
        )}
      </div>

      {/* Gallery images */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium
                        text-stone-700">
            Gallery images
          </label>
          <p className="text-xs text-stone-400 mt-0.5">
            Multiple images shown on the service
            detail page
          </p>
        </div>

        {!initial?.id ? (
          <p className="text-xs text-stone-400
                    bg-stone-50 rounded-xl p-3">
            Save the service first to add
            gallery images.
          </p>
        ) : galleryLoading ? (
          <div className="h-20 bg-stone-50
                      rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            {/* Existing gallery images */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((img) => (
                  <div key={img.id}
                       className="relative aspect-square
                                      overflow-hidden rounded-xl
                                      bg-stone-100 group">
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleGalleryDelete(img.id)
                      }
                      className="absolute top-1 right-1
                                 bg-white/90 hover:bg-red-50
                                 text-stone-500
                                 hover:text-red-600
                                 rounded-full p-1
                                 opacity-0 group-hover:opacity-100
                                 transition-all shadow-sm
                                 border border-stone-200"
                    >
                      <svg width="12" height="12"
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="2.5"
                           strokeLinecap="round">
                        <line x1="18" y1="6"
                              x2="6" y2="18"/>
                        <line x1="6" y1="6"
                              x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload new gallery image */}
            {galleryImages.length < 8 && (
              <ImageUpload
                currentUrl={null}
                bucket="service-images"
                entityId={`gallery-${initial.id}-${Date.now()}`}
                onUpload={handleGalleryUpload}
                aspectRatio="landscape"
                disabled={uploadingGallery}
                label="Add gallery image"
              />
            )}

            {galleryImages.length >= 8 && (
              <p className="text-xs text-stone-400">
                Maximum 8 gallery images reached.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-700">Duration (mins)</label>
          <input 
            id="duration"
            value={duration} 
            onChange={(e) => {
              setDuration(e.target.value)
              if (fieldErrors.duration_minutes) setFieldErrors(prev => ({ ...prev, duration_minutes: '' }))
            }} 
            type="number" 
            className={`mt-1 block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.duration_minutes 
                ? 'border-red-400 focus:ring-red-300' 
                : 'border-gray-200 focus:ring-stone-300'
            }`}
            aria-describedby={fieldErrors.duration_minutes ? "duration-error" : undefined}
          />
          {fieldErrors.duration_minutes && (
            <p id="duration-error" className="mt-1 text-xs text-red-600" role="alert">
              {fieldErrors.duration_minutes}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-700">Price</label>
          <input 
            id="price"
            value={price} 
            onChange={(e) => {
              setPrice(e.target.value)
              if (fieldErrors.price) setFieldErrors(prev => ({ ...prev, price: '' }))
            }} 
            type="number" 
            step="0.01" 
            className={`mt-1 block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.price 
                ? 'border-red-400 focus:ring-red-300' 
                : 'border-gray-200 focus:ring-stone-300'
            }`}
            aria-describedby={fieldErrors.price ? "price-error" : undefined}
          />
          {fieldErrors.price && (
            <p id="price-error" className="mt-1 text-xs text-red-600" role="alert">
              {fieldErrors.price}
            </p>
          )}
        </div>
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
          Therapists who offer this service
        </label>
        {loadingTherapists ? (
          <p className="text-sm text-stone-400">
            Loading therapists...
          </p>
        ) : allTherapists.length === 0 ? (
          <p className="text-sm text-stone-400">
            No therapists available
          </p>
        ) : (
          <div className="space-y-2 max-h-48 
                          overflow-y-auto border 
                          border-stone-200 rounded-xl p-3">
            {allTherapists.map((therapist) => (
              <label
                key={therapist.id}
                className="flex items-center gap-3 
                           cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedTherapistIds.includes(
                    therapist.id
                  )}
                  onChange={() => toggleTherapist(therapist.id)}
                  className="h-4 w-4 rounded border-stone-300 
                             text-stone-800 
                             focus:ring-stone-500"
                />
                <span className="text-sm text-stone-700 
                                 group-hover:text-stone-900">
                  {therapist.name}
                  {therapist.title && (
                    <span className="text-stone-400 ml-1">
                      · {therapist.title}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div>
        <button type="submit" disabled={loading} className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-60">
          {loading ? (<><Spinner size={4} /> Saving...</>) : initial ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
