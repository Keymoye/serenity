import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/authService";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const current = await requireAdmin();
  if (!current) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar current={current} />
      <div className="ml-0 md:ml-64">
        <header className="border-b border-slate-200 bg-white/50 px-4 py-3">
          <div className="mx-auto max-w-6xl">
            <AdminBreadcrumb />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
