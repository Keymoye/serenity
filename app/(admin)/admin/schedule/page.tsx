"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";
import type { TimeSlot } from "@/lib/domain/timeSlot.types";

export default function AdminSchedulePage() {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [title, setTitle] = useState("");

  async function loadSlots() {
    setLoading(true);
    try {
      const data = await apiFetch<TimeSlot[]>("/api/admin/time-slots");
      setSlots(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadSlots();
  }, []);

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/admin/time-slots", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      setTitle("");
      await loadSlots();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Schedule</h1>

      <form onSubmit={createSlot} className="mb-4 flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Time slot title"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {slots.map((s) => (
            <div key={s.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{new Date(s.start_time).toLocaleString()}</div>
                <div className="text-sm text-gray-500">{s.therapist_id}</div>
              </div>
              <button
                className="text-red-600"
                onClick={async () => {
                  await apiFetch(`/api/admin/time-slots`, { method: "DELETE", body: JSON.stringify({ id: s.id }) });
                  await loadSlots();
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
