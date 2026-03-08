"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogoutButton } from "./LogoutButton"

interface MobileMenuProps {
  isLoggedIn: boolean
  isAdmin: boolean
}

export function MobileMenu({ 
  isLoggedIn, 
  isAdmin 
}: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-stone-900 
                   hover:text-stone-900 
                   transition-colors"
        aria-label="Toggle menu"
      >
        {open ? (
          // X icon
          <svg width="24" height="24" 
               viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          // Hamburger icon
          <svg width="24" height="24" 
               viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed top-0 right-0 z-50 
                        h-full w-72 bg-white shadow-xl 
                        flex flex-col">
          {/* Header */}
          <div className="flex items-center 
                          justify-between p-4 
                          border-b border-stone-100">
            <span className="font-semibold 
                             text-stone-800">
              Menu
            </span>
            <button
              onClick={() => setOpen(false)}
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

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === link.href ? "bg-stone-100 text-stone-900" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth section */}
          <div className="p-4 border-t border-stone-100 
                          space-y-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block w-full px-4 py-3 
                             text-center text-sm 
                             font-medium text-stone-700 
                             hover:bg-stone-50 rounded-xl 
                             transition-colors"
                >
                  My Bookings
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="block w-full px-4 py-3 
                               text-center text-sm 
                               font-medium text-stone-700 
                               hover:bg-stone-50 rounded-xl 
                               transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="block w-full px-4 py-3 
                             text-center text-sm 
                             font-medium text-stone-700 
                             border border-stone-200 
                             rounded-xl hover:bg-stone-50 
                             transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="block w-full px-4 py-3 
                             text-center text-sm 
                             font-medium bg-stone-800 
                             text-white rounded-xl 
                             hover:bg-stone-700 
                             transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
