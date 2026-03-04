import { requireCustomer } from "@/lib/services/authService";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { logger } from "@/lib/utils/logger";
import { listCustomerBookings } from "@/lib/application/booking.service";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import CancelBookingButton from "@/components/booking/CancelBookingButton";

type BookingRow = {
  id: string;
  status: string;
  reference_code: string | null;
  notes: string | null;
  time_slots: { start_time: string }[] | null;
  services: { name: string }[] | null;
  therapists: { name: string }[] | null;
};

async function getCustomerBookings(profileId: string, userId?: string): Promise<BookingRow[]> {
  try {
    const rows = await listCustomerBookings({
      userId: userId ?? undefined,
      customerProfileId: profileId,
    });
    return (rows ?? []) as unknown as BookingRow[];
  } catch (error) {
    logger.error("Unexpected error while loading customer bookings", error, {
      profileId,
    });
    return [];
  }
}

export default async function DashboardPage() {
  const current = await requireCustomer();
  if (!current) return null;

  const bookings = await getCustomerBookings(current.profile.id, current.user?.id);

  const now = new Date();
  const upcoming: BookingRow[] = [];
  const past: BookingRow[] = [];

  for (const booking of bookings) {
    const start = booking.time_slots?.[0]?.start_time
      ? new Date(booking.time_slots[0].start_time)
      : null;
    if (start && start >= now) {
      upcoming.push(booking);
    } else {
      past.push(booking);
    }
  }

  const renderStatusBadge = (status: string) => <Badge status={status === 'confirmed' ? 'confirmed' : status === 'pending' ? 'pending' : status === 'cancelled' ? 'cancelled' : 'available'} />;

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
          const start = booking.time_slots?.[0]?.start_time
            ? new Date(booking.time_slots[0].start_time)
            : null;

          return (
            <li
              key={booking.id}
              className="flex flex-col gap-1 px-4 py-3 text-sm text-slate-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {booking.services?.[0]?.name ?? "Service"}
                </p>
                <p className="text-xs text-slate-600">
                  {booking.therapists?.[0]?.name
                    ? `With ${booking.therapists[0].name}`
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
                {/* client island for cancellation */}
                <CancelBookingButton id={booking.id} />
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // Statistics
  const total = bookings.length;
  const upcomingCount = upcoming.length;
  const lastVisit = past
    .filter((b) => b.time_slots?.[0]?.start_time)
    .map((b) => new Date(b.time_slots![0].start_time))
    .sort((a, z) => +z - +a)[0];

  if (total === 0) {
    return (
      <SectionWrapper>
        <div className="space-y-6">
          <PageHero title={`Welcome back, ${current.profile?.name?.split(" ")[0] ?? "guest"}`} subtitle="Book your first treatment and start relaxing." ctaLabel="Book now" ctaHref="/book" />

          <EmptyState title="No bookings yet" message="You don’t have any bookings. When you do, they’ll appear here." ctaLabel="Book now" onCta={() => { window.location.href = '/book'; }} />
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {current.profile?.name?.split(" ")[0] ?? 'Guest'}</h1>
          <p className="text-sm text-slate-700">Manage your bookings and appointments.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Total bookings</p>
            <p className="text-2xl font-semibold text-slate-900">{total}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Upcoming</p>
            <p className="text-2xl font-semibold text-slate-900">{upcomingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Last visit</p>
            <p className="text-2xl font-semibold text-slate-900">{lastVisit ? lastVisit.toLocaleDateString() : '—'}</p>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Upcoming appointments</h2>
          {renderList(upcoming)}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Past visits</h2>
          <details className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm text-slate-700">Show recent visits</summary>
            <div className="mt-3">{renderList(past.slice(0,5))}</div>
          </details>
        </section>

        <div className="mt-6 rounded-2xl bg-brand-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-spa-charcoal">Ready for your next session?</h3>
          <p className="text-sm text-stone-700">Book a treatment with our therapists today.</p>
          <div className="mt-3">
            <Link href="/book" className="inline-flex items-center rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600">Book now</Link>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

