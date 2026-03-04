import React from "react";
import { requireAdmin } from "@/lib/services/authService";
import { listAdminBookingRows, updateBookingStatusAdmin, deleteBookingAdmin } from "@/lib/application/admin.service";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default async function AdminBookingsPage() {
  const current = await requireAdmin();
  if (!current) return null;

  const context = { userId: current.user?.id ?? "", role: current.profile?.role ?? "admin" };

  let bookings: any[] = [];
  try {
    bookings = await listAdminBookingRows(context);
  } catch (err) {
    console.error("listAdminBookingRows failed", err);
  }

  return (
    <SectionWrapper>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
            <p className="text-sm text-slate-600">Manage and review bookings</p>
          </div>
          <div>
            <Link href="/admin/bookings/new" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">New Booking</Link>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2">Ref</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Therapist</th>
                <th className="px-4 py-2">Slot</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-600">No bookings found.</td>
                </tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3">{b.reference_code ?? b.id}</td>
                    <td className="px-4 py-3">{b.customer_name ?? b.customer_email ?? '—'}</td>
                    <td className="px-4 py-3">{b.service_name ?? '—'}</td>
                    <td className="px-4 py-3">{b.therapist_name ?? '—'}</td>
                    <td className="px-4 py-3">{b.slot_start ? new Date(b.slot_start).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3"><Badge status={b.status ?? 'pending'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/bookings/${b.id}`} className="text-sky-600">View</Link>
                        <Link href={`/admin/bookings/${b.id}/edit`} className="text-slate-600">Edit</Link>
                        <Link href={`/admin/bookings/${b.id}/delete`} className="text-red-600">Delete</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SectionWrapper>
  );
}
import React from "react";
import { requireAdmin } from "@/lib/services/authService";
import { listAdminBookingRows } from "@/lib/application/admin.service";
import { SectionWrapper } from "@/components/layout/SectionWrapper";


export default async function BookingsAdminPage() {
  const current = await requireAdmin();
  if (!current) return null;

  const bookings = await listAdminBookingRows({ userId: current.user.id, role: current.profile.role });
  return (
    <SectionWrapper>
      <h1 className="text-2xl font-semibold text-slate-900">Bookings (Admin)</h1>
      <section>
        <h2 className="text-lg font-medium text-slate-900 mt-4">Existing</h2>
        <ul className="mt-2 space-y-2">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-md bg-white p-3 shadow-sm">
              <strong>{b.customer_name}</strong> — {b.created_at ?? "—"}
            </li>
          ))}
        </ul>
      </section>
    </SectionWrapper>
  );
}
