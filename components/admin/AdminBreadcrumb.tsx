"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminBreadcrumb() {
  const pathname = usePathname() ?? "/admin";
  const parts = pathname.split("/").filter(Boolean);

  const crumbs = parts.map((p, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = p === "admin" ? "Admin" : p.charAt(0).toUpperCase() + p.slice(1);
    return { href, label };
  });

  return (
    <nav className="text-sm text-slate-600">
      {crumbs.map((c, i) => (
        <span key={c.href}>
          <Link href={c.href} className="hover:underline">{c.label}</Link>
          {i < crumbs.length - 1 && <span className="mx-2">/</span>}
        </span>
      ))}
    </nav>
  );
}
