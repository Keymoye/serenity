export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { requireCurrentUser } from "@/lib/services/authService";
import { SpaNavbar } from "@/components/layout/SpaNavbar";
import { SpaFooter } from "@/components/layout/SpaFooter";

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
  const current = await requireCurrentUser().catch(() => null);
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-spa-cream text-slate-900`}>
        <SpaNavbar current={current} />

        <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">{children}</main>

        <SpaFooter />
      </body>
    </html>
  );
}

