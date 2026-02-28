"use client";
import React, { useState } from "react";
import type { Therapist } from "@/lib/db/therapists";

type Props = {
  initial?: Therapist | null;
};

export default function TherapistForm({ initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, bio };
      const url = initial?.id ? `/api/admin/therapists` : `/api/admin/therapists`;
      const method = initial?.id ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initial?.id ? { id: initial.id, ...payload } : payload),
      });
      // simple refresh to reflect changes
      window.location.reload();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
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
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1 text-sm text-white"
          disabled={loading}
        >
          {loading ? "Saving..." : initial ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
