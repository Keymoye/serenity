"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" 
           strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" 
              rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/admin/therapists",
    label: "Therapists",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 
                 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    href: "/admin/schedule",
    label: "Schedule",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
    ),
  },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 
                 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

function NavLinks({ pathname, setMobileOpen }: { pathname: string; setMobileOpen: (open: boolean) => void }) {
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 p-3 space-y-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(item.href) ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"}`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile header bar */}
      <div className="md:hidden flex items-center 
                      justify-between px-4 py-3 
                      bg-white border-b border-stone-200">
        <span className="font-semibold text-stone-800">
          Admin
        </span>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-stone-600 
                     hover:text-stone-900"
          aria-label="Open menu"
        >
          <svg width="22" height="22" 
               viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col 
                        w-56 min-h-screen bg-white 
                        border-r border-stone-200 
                        flex-shrink-0">
        <div className="p-4 border-b border-stone-100">
          <span className="font-semibold text-stone-800">
            Admin Panel
          </span>
        </div>
        <NavLinks pathname={pathname} setMobileOpen={setMobileOpen} />
        <div className="p-3 border-t border-stone-100">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 
                       py-2.5 text-sm font-medium 
                       text-stone-500 hover:text-stone-700 
                       transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 
                     md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed top-0 left-0 z-50 
                        h-full w-64 bg-white 
                        shadow-xl flex flex-col 
                        md:hidden">
          <div className="flex items-center 
                          justify-between p-4 
                          border-b border-stone-100">
            <span className="font-semibold 
                             text-stone-800">
              Admin Panel
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-stone-400 
                         hover:text-stone-600"
            >
              <svg width="20" height="20"
                   viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <NavLinks pathname={pathname} setMobileOpen={setMobileOpen} />
          <div className="p-3 border-t border-stone-100">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 
                         py-2.5 text-sm font-medium 
                         text-stone-500 hover:text-stone-700"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
