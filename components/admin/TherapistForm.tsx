"use client";
import React, { useState } from "react";
import { postJson, apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

type TherapistInput = {
  id?: string;
  name?: string;
  bio?: string | null;
  [key: string]: unknown;
};

type Props = {
  initial?: TherapistInput | null;
  onSaved?: () => void;
};

export default function TherapistForm({ initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { name, bio };
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
        <label className="block text-sm font-medium text-slate-700">Bio</label>
        <textarea
          value={bio ?? ""}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
          rows={3}
        />
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
