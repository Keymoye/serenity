"use client";

import { useCallback, useEffect, useState } from "react";
import { adminBookingStatusSchema, type AdminBookingStatusInput } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type BookingRow = {
  id: string;
  customer_name: string;
  status: string;
  created_at: string | null;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        logger.error("Failed to load bookings", body);
        return;
      }
      setBookings((body ?? []) as BookingRow[]);
    } catch (err) {
      logger.error("Unexpected error loading bookings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    const payload: AdminBookingStatusInput = { bookingId, status: status as "confirmed" | "cancelled" | "pending" };
    const parsed = adminBookingStatusSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid booking status payload", parsed.error);
      return;
    }

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: parsed.data.bookingId, status: parsed.data.status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        logger.error("Failed to update booking status", body, { bookingId });
        return;
      }
      await loadBookings();
    } catch (err) {
      logger.error("Unexpected error updating booking status", err, { bookingId });
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
        <p className="text-sm text-slate-700">Manage bookings and update statuses.</p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Recent bookings</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white mt-2">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-3 py-4 text-sm text-slate-600">Loading bookings...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-4 text-sm text-slate-600">No bookings yet.</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{b.customer_name}</td>
                    <td className="px-3 py-2 text-slate-700">{b.status}</td>
                    <td className="px-3 py-2 text-slate-700">{b.created_at ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button type="button" onClick={() => handleUpdateStatus(b.id, "confirmed")} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Confirm</button>
                        <button type="button" onClick={() => handleUpdateStatus(b.id, "cancelled")} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
