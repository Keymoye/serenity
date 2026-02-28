import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";

type Metrics = {
  bookingsThisMonth: number;
  upcomingToday: number;
  unreadMessages: number;
};

async function getAdminMetrics(): Promise<Metrics> {
  try {
    const supabase = await getServerSupabaseClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString();
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).toISOString();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    ).toISOString();

    const [
      { count: bookingsThisMonthCount, error: bookingsError },
      { data: todaysBookings, error: upcomingError },
      { count: unreadMessagesCount, error: messagesError },
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth),
      supabase
        .from("bookings")
        .select("id, time_slots(start_time), status")
        .eq("status", "confirmed")
        .gte("time_slots.start_time", startOfToday)
        .lte("time_slots.start_time", endOfToday),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false),
    ]);

    if (bookingsError) {
      logger.error("Failed to load bookingsThisMonth metric", bookingsError);
    }

    if (upcomingError) {
      logger.error("Failed to load upcomingToday metric", upcomingError);
    }

    if (messagesError) {
      logger.error("Failed to load unreadMessages metric", messagesError);
    }

    type BookingRow = { time_slots?: { start_time?: string } };
    const upcomingToday =
      ((todaysBookings ?? []) as BookingRow[]).filter(
        (b) => Boolean(b.time_slots && b.time_slots.start_time)
      ).length ?? 0;

    return {
      bookingsThisMonth: bookingsThisMonthCount ?? 0,
      upcomingToday,
      unreadMessages: unreadMessagesCount ?? 0,
    };
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

  const metrics = await getAdminMetrics();

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

