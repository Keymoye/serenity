"use client";
import React, { useState } from "react";
import type { Booking } from "@/lib/domain/booking.types";

export default function BookingRow({ booking }: { booking: Partial<Booking> & { id?: string } }) {
  const [status, setStatus] = useState<string>(booking.status ?? "pending");

  async function updateStatus(newStatus: string) {
    const res = await fetch("/api/admin/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking.id, status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
    } else {
      alert("Update failed");
    }
  }

  async function remove() {
    if (!confirm("Delete booking?")) return;
    const res = await fetch(`/api/admin/bookings?id=${booking.id}`, { method: "DELETE" });
    if (res.ok) location.reload();
    else alert("Delete failed");
  }

  return (
    <div>
      <div>
        <strong>{booking.customer_name}</strong> — {booking.date} {booking.time} ({booking.service_id})
      </div>
      <div>
        <span>Status: {status}</span>
        <button onClick={() => updateStatus("confirmed")}>Confirm</button>
        <button onClick={() => updateStatus("cancelled")}>Cancel</button>
        <button onClick={remove}>Delete</button>
      </div>
    </div>
  );
}
