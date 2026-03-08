"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { BookingSummary, BookingStatus } from "@/lib/domain/booking.types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { pushToast } from "@/components/ui/Toast";

type BookingRow = BookingSummary & {
  customer_name?: string | null;
  service_name?: string | null;
  therapist_name?: string | null;
  slot_start?: string | null;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchRef, setSearchRef] = useState<string>("");

  // per-row updating / deleting
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<BookingRow | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/admin/bookings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!mounted) return;
        setBookings(body ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load bookings");
        pushToast("error", "Failed to load bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && (b.status ?? "pending") !== statusFilter) return false;
      const slot = b.slot_start ?? b.created_at ?? null;
      if (startDate) {
        const d = new Date(startDate);
        if (!slot || new Date(slot) < d) return false;
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23,59,59,999);
        if (!slot || new Date(slot) > d) return false;
      }
      if (searchRef) {
        const rc = (b.reference_code ?? "").toLowerCase();
        if (!rc.includes(searchRef.toLowerCase())) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, startDate, endDate, searchRef]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // update local row
      setBookings((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus as BookingStatus } : r)));
      pushToast('success', 'Booking status updated');
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to update booking status');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deletingId) return setConfirmOpen(false);
    const id = deletingId;
    setConfirmOpen(false);
    try {
      const res = await fetch(`/api/admin/bookings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBookings((prev) => prev.filter((r) => r.id !== id));
      pushToast('success', 'Booking deleted');
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to delete booking');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
        <p className="text-sm text-slate-700">Manage bookings and update statuses.</p>
      </header>

      <section>
        <div className="mb-3 grid gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs text-slate-600">Status
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm">
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>
          <div>
            <label className="block text-xs text-slate-600">From
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
            </label>
          </div>
          <div>
            <label className="block text-xs text-slate-600">To
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
            </label>
          </div>
          <div>
            <label className="block text-xs text-slate-600">Reference
              <input type="text" placeholder="Search ref" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No bookings" message="No bookings match your filters." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Reference</th>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-left">Service</th>
                  <th className="px-3 py-2 text-left">Therapist</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2">{b.reference_code ?? b.id}</td>
                    <td className="px-3 py-2">{b.customer_name ?? '—'}</td>
                    <td className="px-3 py-2">{b.service_name ?? '—'}</td>
                    <td className="px-3 py-2">{b.therapist_name ?? '—'}</td>
                    <td className="px-3 py-2">{b.slot_start ? new Date(b.slot_start).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge status={b.status ?? 'pending'} />
                        <select value={b.status ?? 'pending'} onChange={(e) => handleStatusChange(b.id, e.target.value)} disabled={updatingId === b.id} className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm">
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewBooking(b)} className="text-sky-600">View</button>
                        <button onClick={() => confirmDelete(b.id)} className="text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog open={confirmOpen} title="Delete booking" description="Are you sure you want to delete this booking?" onCancel={() => setConfirmOpen(false)} onConfirm={doDelete} />

        {viewBooking && (
          <div
            className="fixed inset-0 z-50 flex items-center 
                       justify-center bg-black/40 p-4"
            onClick={() => setViewBooking(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl 
                         w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center 
                              justify-between">
                <h2 className="text-lg font-semibold 
                               text-stone-800">
                  Booking Details
                </h2>
                <button
                  onClick={() => setViewBooking(null)}
                  className="text-stone-400 
                             hover:text-stone-600 
                             transition-colors text-xl 
                             leading-none"
                >
                  ×
                </button>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Reference</dt>
                  <dd className="font-medium text-stone-800">
                    {viewBooking.reference_code}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Customer</dt>
                  <dd className="font-medium text-stone-800">
                    {viewBooking.customer_name ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Service</dt>
                  <dd className="font-medium text-stone-800">
                    {viewBooking.service_name ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Therapist</dt>
                  <dd className="font-medium text-stone-800">
                    {viewBooking.therapist_name ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Date & Time</dt>
                  <dd className="font-medium text-stone-800">
                    {viewBooking.slot_start ? new Date(viewBooking.slot_start).toLocaleString() : '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Status</dt>
                  <dd className="font-medium text-stone-800 
                                capitalize">
                    {viewBooking.status}
                  </dd>
                </div>
              </dl>

              <div className="pt-2">
                <button
                  onClick={() => setViewBooking(null)}
                  className="w-full px-4 py-2 bg-stone-100 
                             text-stone-700 rounded-lg text-sm 
                             font-medium hover:bg-stone-200 
                             transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
