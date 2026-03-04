"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface CurrentUser {
  user?: { email?: string };
  profile?: { name?: string | null };
}

export default function AdminSidebar({ current }: { current?: CurrentUser }) {
  const pathname = usePathname() ?? "/admin";
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/therapists", label: "Therapists" },
    { href: "/admin/schedule", label: "Schedule" },
    { href: "/admin/messages", label: "Messages" },
  ];

  return (
    <aside className="z-40">
      <div className={`fixed inset-y-0 left-0 w-64 transform bg-white border-r border-slate-200 transition-transform duration-200 ${open ? 'translate-x-0' : ' -translate-x-0 md:translate-x-0'}`}>
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="px-4 py-4">
              <Link href="/admin" className="text-lg font-semibold">Admin</Link>
            </div>

            <nav className="px-2 py-4">
              {nav.map((n) => {
                const active = pathname === n.href || pathname.startsWith(n.href + "/");
                return (
                  <Link key={n.href} href={n.href} className={`block rounded-md px-3 py-2 text-sm ${active ? 'bg-slate-100 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="text-sm text-slate-900">{current?.profile?.name ?? 'Admin'}</div>
            <div className="text-xs text-slate-600">{current?.user?.email ?? ''}</div>
            <div className="mt-3">
              <a href="/api/auth/logout" className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs">Logout</a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile toggle */}
      <button onClick={() => setOpen((s) => !s)} className="md:hidden fixed left-2 top-4 z-50 inline-flex items-center rounded bg-white p-2 shadow">
        <span className="sr-only">Toggle admin menu</span>
        ☰
      </button>
    </aside>
  );
}
