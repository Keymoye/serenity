import { getAdminMetrics } from "@/lib/application/admin.service";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import { logger } from "@/lib/utils/logger";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const current = await requireAdmin();
  // requireAdmin throws/redirects if not admin
  // no null check needed

  let metrics;
  try {
    metrics = await getAdminMetrics({
      userId: current.user.id,
      role: current.profile.role
    });
  } catch (err) {
    logger.error(
      'Failed to load admin metrics', err,
      { userId: current.user.id }
    );
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">
          Failed to load dashboard data.
          Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow"> 
          <div className="text-sm text-gray-500">Bookings This Month</div>
          <div className="text-2xl font-semibold">{metrics.bookingsThisMonth}</div>
        </div>
        <div className="p-4 bg-white rounded shadow"> 
          <div className="text-sm text-gray-500">Upcoming Today</div>
          <div className="text-2xl font-semibold">{metrics.upcomingToday}</div>
        </div>
        <div className="p-4 bg-white rounded shadow"> 
          <div className="text-sm text-gray-500">Unread Messages</div>
          <div className="text-2xl font-semibold">{metrics.unreadMessages}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/admin/bookings" className="p-4 bg-white rounded shadow hover:shadow-md">View Bookings</Link>
        <Link href="/admin/therapists" className="p-4 bg-white rounded shadow hover:shadow-md">Manage Therapists</Link>
        <Link href="/admin/services" className="p-4 bg-white rounded shadow hover:shadow-md">Manage Services</Link>
      </div>
    </div>
  );
}
