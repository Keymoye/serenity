"use client";
import React, { useState } from "react";
import { postJson, apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

import type { AdminTherapistInput } from "@/lib/domain/admin.types";

type TherapistInput = {
  id?: string;
  name?: string;
  title?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

type Props = {
  initial?: Partial<AdminTherapistInput> | null | undefined;
  onSaved?: () => void;
};

export default function TherapistForm({ initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");
  const [bio, setBio] = useState(initial?.bio_short ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { name, title, photo_url: photoUrl, bio, is_active: Boolean(isActive) };
      if ((initial as Partial<AdminTherapistInput>)?.id) {
        await apiFetch(`/api/admin/therapists`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: (initial as Partial<AdminTherapistInput>).id, ...payload, bio_short: bio }),
        });
      } else {
        await postJson(`/api/admin/therapists`, { ...payload, bio_short: bio });
      }
      // Call parent callback to refresh list or close modal
      onSaved?.();
      setLoading(false);
    } catch (err: unknown) {
      console.error(err);
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
        <label className="block text-sm font-medium text-slate-700">Photo URL</label>
        <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
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
