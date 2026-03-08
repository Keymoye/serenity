"use client";

import React, { useState } from "react";
import { postJson, apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";

type ServiceInput = {
  id?: string;
  name?: string;
  category?: string | null;
  duration_minutes?: number | null;
  price?: number | null;
  is_active?: boolean;
  thumbnail_url?: string | null;
};

type Props = {
  initial?: ServiceInput | null;
  onSaved?: () => void;
};

export default function ServiceForm({ initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [duration, setDuration] = useState<string>(initial?.duration_minutes ? String(initial.duration_minutes) : "");
  const [price, setPrice] = useState<string>(initial?.price ? String(initial.price) : "");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initial?.thumbnail_url ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { name, category: category || null, duration_minutes: duration ? Number(duration) : null, price: price ? Number(price) : null, is_active: isActive, thumbnail_url: thumbnailUrl };
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
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Category</label>
        <input value={category ?? ""} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
      </div>
      <div>
        <ImageUpload
          currentUrl={thumbnailUrl}
          bucket="service-images"
          entityId={initial?.id ?? "new"}
          onUpload={(url) => setThumbnailUrl(url)}
          label="Service image"
          aspectRatio="landscape"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Duration (mins)</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span className="text-sm text-slate-700">Active</span>
        </label>
      </div>
      <div>
        <button type="submit" disabled={loading} className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-60">
          {loading ? (<><Spinner size={4} /> Saving...</>) : initial ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
