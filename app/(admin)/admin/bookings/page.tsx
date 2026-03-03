"use client";

import { useCallback, useEffect, useState } from "react";
import { adminBookingStatusSchema, type AdminBookingStatusInput } from "@/lib/utils/validation";
import { apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

type BookingRow = {
  id: string;
  customer_name: string;
  status: string;
  created_at: string | null;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const limit = 20;

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const body = await apiFetch(`/api/admin/bookings?${params.toString()}`);
      setBookings((body ?? []) as BookingRow[]);
    } catch {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  // reload whenever page or filters change
  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  // if filters change, reset to first page
  useEffect(() => {
    setPage(0);
  }, [startDate, endDate]);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    const payload: AdminBookingStatusInput = { bookingId, status: status as "confirmed" | "cancelled" | "pending" };
    const parsed = adminBookingStatusSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Invalid booking status");
      return;
    }

    setUpdating(bookingId);
    try {
      await apiFetch("/api/admin/bookings", {
        method: "PUT",
        body: JSON.stringify({ bookingId: parsed.data.bookingId, status: parsed.data.status }),
      });
      await loadBookings();
    } catch {
      setError("Failed to update booking status");
    } finally {
      setUpdating(null);
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
        <div className="mt-2 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-600">
              From
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs text-slate-600">
              To
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-xs text-sky-600 hover:underline"
          >
            Clear filters
          </button>
        </div>

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
                <tr><td colSpan={4} className="px-3 py-4 text-center"><Spinner /></td></tr>
              ) : error ? (
                <tr><td colSpan={4} className="px-3 py-4 text-sm text-red-600">{error}</td></tr>
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
                        <button type="button" onClick={() => handleUpdateStatus(b.id, "confirmed")} disabled={updating === b.id} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed">{updating === b.id ? <Spinner /> : "Confirm"}</button>
                        <button type="button" onClick={() => handleUpdateStatus(b.id, "cancelled")} disabled={updating === b.id} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">{updating === b.id ? <Spinner /> : "Cancel"}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* pagination controls */}
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="rounded-md border px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-3 py-1 text-sm text-slate-700"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
