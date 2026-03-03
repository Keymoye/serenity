"use client";
import React, { useState } from "react";
import type { Booking } from "@/lib/domain/booking.types";
import { apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

export default function BookingRow({
  booking,
  onDeleted,
}: {
  booking: Partial<Booking> & { id?: string };
  onDeleted?: () => void;
}) {
  const [status, setStatus] = useState<string>(booking.status ?? "pending");

  const [loadingStatus, setLoadingStatus] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoadingStatus(true);
    try {
      await apiFetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: booking.id, status: newStatus }),
      });
      setStatus(newStatus);
    } catch {
      alert("Update failed");
    } finally {
      setLoadingStatus(false);
    }
  }

  async function remove() {
    if (!confirm("Delete booking?")) return;
    try {
      await apiFetch(`/api/admin/bookings?id=${booking.id}`, { method: "DELETE" });
      onDeleted?.();
    } catch {
      alert("Delete failed");
    }
  }

  return (
    <div>
      <div>
        <strong>{booking.customer_name}</strong> — {booking.date} {booking.time} ({booking.service_id})
      </div>
      <div>
        <span>Status: {status}</span>
        <button onClick={() => updateStatus("confirmed")} disabled={loadingStatus} className="mr-2">
          {loadingStatus ? <Spinner size={4} /> : "Confirm"}
        </button>
        <button onClick={() => updateStatus("cancelled")} disabled={loadingStatus} className="mr-2">
          Cancel
        </button>
        <button onClick={remove}>Delete</button>
      </div>
    </div>
  );
}
