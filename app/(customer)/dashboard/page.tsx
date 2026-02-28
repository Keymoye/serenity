import { getCurrentUser } from "@/lib/services/authService";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

type BookingRow = {
  id: string;
  status: string;
  reference_code: string | null;
  notes: string | null;
  time_slots: {
    start_time: string;
  } | null;
  services: {
    name: string;
  } | null;
  therapists: {
    name: string;
  } | null;
};

async function getCustomerBookings(profileId: string): Promise<BookingRow[]> {
  try {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, status, reference_code, notes, time_slots(start_time), services(name), therapists(name)"
      )
      .eq("customer_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to load customer bookings", error, { profileId });
      return [];
    }

    return (data ?? []) as BookingRow[];
  } catch (error) {
    logger.error("Unexpected error while loading customer bookings", error, {
      profileId,
    });
    return [];
  }
}

export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) {
    // Middleware protects this route; this is just a guard.
    return null;
  }

  const bookings = await getCustomerBookings(current.profile.id);

  const now = new Date();
  const upcoming: BookingRow[] = [];
  const past: BookingRow[] = [];

  for (const booking of bookings) {
    const start = booking.time_slots?.start_time
      ? new Date(booking.time_slots.start_time)
      : null;
    if (start && start >= now) {
      upcoming.push(booking);
    } else {
      past.push(booking);
    }
  }

  const renderStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "confirmed") {
      return (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          Confirmed
        </span>
      );
    }
    if (normalized === "cancelled") {
      return (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          Cancelled
        </span>
      );
    }
    if (normalized === "pending") {
      return (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          Pending
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        {status}
      </span>
    );
  };

  const renderList = (items: BookingRow[]) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-slate-600">
          No bookings in this section yet.
        </p>
      );
    }

    return (
      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {items.map((booking) => {
          const start = booking.time_slots?.start_time
            ? new Date(booking.time_slots.start_time)
            : null;

          return (
            <li
              key={booking.id}
              className="flex flex-col gap-1 px-4 py-3 text-sm text-slate-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {booking.services?.name ?? "Service"}
                </p>
                <p className="text-xs text-slate-600">
                  {booking.therapists?.name
                    ? `With ${booking.therapists.name}`
                    : "Therapist TBA"}
                </p>
                {start && (
                  <p className="text-xs text-slate-600">
                    {start.toLocaleDateString()} ·{" "}
                    {start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {booking.reference_code && (
                  <p className="text-xs text-slate-500">
                    Ref: {booking.reference_code}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {renderStatusBadge(booking.status)}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Your bookings
        </h1>
        <p className="text-sm text-slate-700">
          View upcoming treatments and your past visits.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Upcoming
        </h2>
        {renderList(upcoming)}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Past
        </h2>
        {renderList(past)}
      </section>
    </div>
  );
}

