import React from "react";
import { requireAdmin } from "@/lib/services/authService";
import { getAdminMetrics, listAdminBookingRows, listServices, listTherapistsAdmin } from "@/lib/application/admin.service";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default async function AdminIndexPage() {
  const current = await requireAdmin();
  if (!current) return null;

  const context = { userId: current.user?.id ?? "", role: current.profile?.role ?? "admin" };

  let metrics = { bookingsThisMonth: 0, upcomingToday: 0, unreadMessages: 0, bookingsLast7Days: [] as any[] };
  try {
    metrics = await getAdminMetrics(context);
  } catch (err) {
    // keep defaults so page can render partial data
    console.error("getAdminMetrics failed", err);
  }

  let bookings: any[] = [];
  try {
    bookings = await listAdminBookingRows(context);
  } catch (err) {
    console.error("listAdminBookingRows failed", err);
  }

  let services: any[] = [];
  try {
    services = await listServices(context);
  } catch (err) {
    console.error("listServices failed", err);
  }

  let therapists: any[] = [];
  try {
    therapists = await listTherapistsAdmin(context);
  } catch (err) {
    console.error("listTherapistsAdmin failed", err);
  }

  const totalActiveServices = (services ?? []).filter((s: any) => s.is_active !== false).length;
  const totalTherapists = (therapists ?? []).length;

  const recent = (bookings ?? []).slice(0, 10);

  return (
    <SectionWrapper>
      <div className="space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
            <p className="text-sm text-slate-600">Overview and quick actions</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/services" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">Add Service</Link>
            <Link href="/admin/therapists" className="rounded-full bg-white border px-4 py-2 text-sm font-medium">Add Therapist</Link>
            <Link href="/admin/messages" className="rounded-full bg-white border px-4 py-2 text-sm font-medium">View Messages</Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Bookings this month</p>
            <p className="text-2xl font-semibold text-slate-900">{metrics.bookingsThisMonth ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Today (confirmed)</p>
            <p className="text-2xl font-semibold text-slate-900">{metrics.upcomingToday ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Unread messages</p>
            <p className="text-2xl font-semibold text-slate-900">{metrics.unreadMessages ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Active services / therapists</p>
            <p className="text-2xl font-semibold text-slate-900">{totalActiveServices} / {totalTherapists}</p>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Recent bookings</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-600 mt-2">No recent bookings.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2">Reference</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b: any) => (
                    <tr key={b.id} className="border-t">
                      <td className="px-4 py-3">{b.reference_code ?? b.id}</td>
                      <td className="px-4 py-3">{b.customer_name ?? b.customer_email ?? '—'}</td>
                      <td className="px-4 py-3">{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3"><Badge status={b.status ?? 'pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SectionWrapper>
  );
}
import { requireAdmin } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";
import { getAdminMetrics as getAdminMetricsService } from "@/lib/application/admin.service";
import { SectionWrapper } from "@/components/layout/SectionWrapper";

type Metrics = {
  bookingsThisMonth: number;
  upcomingToday: number;
  unreadMessages: number;
  bookingsLast7Days: Array<{ date: string; count: number }>;
};

async function getAdminMetrics(context: { userId: string; role: string }): Promise<Metrics> {
  try {
    return await getAdminMetricsService(context);
  } catch (error) {
    logger.error("Unexpected error while loading admin metrics", error);
    return {
      bookingsThisMonth: 0,
      upcomingToday: 0,
      unreadMessages: 0,
      bookingsLast7Days: [],
    };
  }
}

export default async function AdminDashboardPage() {
  const current = await requireAdmin();
  if (!current) return null;

  const metrics = await getAdminMetrics({ userId: current.user.id, role: current.profile.role });

  return (
    <SectionWrapper>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
        <p className="text-sm text-slate-700">High-level overview of today's bookings and recent activity.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bookings this month</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.bookingsThisMonth}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming today</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.upcomingToday}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unread messages</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.unreadMessages}</p>
        </div>
      </section>

      {/* chart area */}
      <section>
        <h2 className="text-lg font-medium text-slate-900">Bookings last 7 days</h2>
        <div className="mt-3 flex items-end gap-2 h-32">
          {metrics.bookingsLast7Days.map((b) => {
            const max = Math.max(...metrics.bookingsLast7Days.map((x) => x.count));
            const height = max > 0 ? (b.count / max) * 100 : 0;
            const label = new Date(b.date).toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div key={b.date} className="flex flex-col items-center">
                <div className="w-6 bg-sky-600 transition-all" style={{ height: `${height}%` }} />
                <span className="text-xs text-slate-600 mt-1">{label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </SectionWrapper>
  );
}

