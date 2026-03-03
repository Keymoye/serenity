import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { logger } from "@/lib/utils/logger";
import { getAdminMetrics as getAdminMetricsService } from "@/lib/application/admin.service";

type Metrics = {
  bookingsThisMonth: number;
  upcomingToday: number;
  unreadMessages: number;
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
    };
  }
}

export default async function AdminDashboardPage() {
  const current = await getCurrentUser();
  if (!current || current.profile.role !== "admin") {
    return null;
  }

  const metrics = await getAdminMetrics({
    userId: current.user.id,
    role: current.profile.role,
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Admin dashboard
        </h1>
        <p className="text-sm text-slate-700">
          High-level overview of today&apos;s bookings and recent activity.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Bookings this month
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {metrics.bookingsThisMonth}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Upcoming today
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {metrics.upcomingToday}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Unread messages
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {metrics.unreadMessages}
          </p>
        </div>
      </section>
    </div>
  );
}

