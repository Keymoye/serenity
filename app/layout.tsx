import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/services/authService";
import { LogoutButton } from "@/components/layout/LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Serenity Spa Booking",
  description: "Online spa booking platform built with Next.js and Supabase.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const current = await getCurrentUser();
  const isAuthenticated = Boolean(current);
  const isAdmin = current?.profile.role === "admin";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight">
                Serenity Spa
              </span>
            </a>

            <nav className="hidden items-center gap-4 text-sm text-slate-700 md:flex">
              <a href="/" className="hover:text-sky-700">
                Home
              </a>
              <a href="/services" className="hover:text-sky-700">
                Services
              </a>
              <a href="/about" className="hover:text-sky-700">
                About
              </a>
              <a href="/contact" className="hover:text-sky-700">
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-2 text-xs md:text-sm">
              {isAuthenticated ? (
                <>
                  <a
                    href="/dashboard"
                    className="hidden rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 md:inline-block"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/profile"
                    className="hidden rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 md:inline-block"
                  >
                    Profile
                  </a>
                  {isAdmin && (
                    <a
                      href="/admin"
                      className="hidden rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 md:inline-block"
                    >
                      Admin
                    </a>
                  )}
                  <LogoutButton />
                </>
              ) : (
                <>
                  <a
                    href="/auth/login"
                    className="rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100"
                  >
                    Login
                  </a>
                  <a
                    href="/auth/register"
                    className="hidden rounded-full bg-sky-600 px-3 py-1 font-medium text-white shadow-sm hover:bg-sky-700 md:inline-block"
                  >
                    Sign up
                  </a>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Serenity Spa. All rights reserved.
            </p>
            <p>
              123 Tranquility Lane, Wellness City ·{" "}
              <a
                href="mailto:hello@serenityspa.example"
                className="font-medium text-sky-700 hover:underline"
              >
                hello@serenityspa.example
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

