"use client";
import React, { useState } from "react";
import type { Therapist } from "@/lib/domain/therapist.types";
import { apiFetch } from "@/lib/utils/api";
import TherapistForm from "./TherapistForm";
import { logger } from "@/lib/utils/logger";

type Props = {
  initialTherapists: Therapist[];
};

export default function TherapistsList({ initialTherapists }: Props) {
  const [therapists, setTherapists] = useState(initialTherapists);

  const handleDelete = async (therapistId: string) => {
    if (!confirm("Delete therapist?")) return;
    try {
      await apiFetch(`/api/admin/therapists`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId }),
      });
      // Remove from local list
      setTherapists((prev) => prev.filter((t) => t.id !== therapistId));
    } catch (err) {
      logger.error("Failed to delete therapist", err);
      alert("Unable to delete therapist. Please try again.");
    }
  };

  const handleTherapistSaved = () => {
    // Optionally refresh the list by calling the API
    // For now, just close any editing UI (parent can handle)
    refreshTherapists();
  };

  const refreshTherapists = async () => {
    try {
      const res = await apiFetch("/api/admin/therapists");
      setTherapists(res as Therapist[]);
    } catch (err) {
      logger.error("Failed to refresh therapists", err);
    }
  };

  return (
    <ul>
      {therapists.map((t) => (
        <li key={t.id}>
          <strong>{t.name}</strong> — {t.bio_short || t.title}
          <div>
            <TherapistForm initial={t as Therapist} onSaved={handleTherapistSaved} />
            <button
              onClick={() => handleDelete(t.id)}
              className="mt-2 rounded bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
