import { getCurrentUser } from "@/lib/infra/supabase/currentUser";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();

  if (!current || current.profile.role !== "admin") {
    // middleware should already guard /admin, so this is defensive.
    return null;
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-6 py-6">
      <aside className="hidden w-56 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:block">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {current.profile.name ?? current.user.email ?? "Admin"}
          </p>
        </div>
        <nav className="space-y-1 text-sm">
          <a
            href="/admin"
            className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </a>
          <a
            href="/admin/services"
            className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            Services
          </a>
          <a
            href="/admin/therapists"
            className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            Therapists
          </a>
          <a
            href="/admin/schedule"
            className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            Schedule
          </a>
          <a
            href="/admin/bookings"
            className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            Bookings
          </a>
          <a
            href="/admin/messages"
            className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            Messages
          </a>
        </nav>
      </aside>
      <section className="flex-1 space-y-4">{children}</section>
    </div>
  );
}

