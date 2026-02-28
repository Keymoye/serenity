import { getServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { ServiceCard, type ServiceSummary } from "@/components/ServiceCard";
import { MapEmbed } from "@/components/MapEmbed";
import Link from "next/link";

async function getFeaturedServices(): Promise<ServiceSummary[]> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase
      .from("services")
      .select(
        "id, name, category, duration_minutes, price, thumbnail_url, is_featured, is_active"
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(6);

    if (error) {
      logger.error("Failed to load featured services", error);
      return [];
    }

    return (data ?? []) as ServiceSummary[];
  } catch (error) {
    logger.error("Unexpected error while loading featured services", error);
    return [];
  }
}

export default async function Home() {
  const featuredServices = await getFeaturedServices();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid gap-8 rounded-3xl bg-gradient-to-br from-sky-50 to-emerald-50 px-6 py-10 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:px-10 sm:py-14">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Boutique spa · Wellness & relaxation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Unwind, restore, and recharge at Serenity Spa.
          </h1>
          <p className="max-w-xl text-sm text-slate-700 sm:text-base">
            Book massages, facials, and tailored wellness rituals in just a
            few clicks. Real-time availability, expert therapists, and a
            peaceful escape in the heart of the city.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
            >
              Book now
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-800 hover:bg-white"
            >
              Explore services
            </Link>
          </div>
          <dl className="mt-4 grid gap-4 text-xs text-slate-700 sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-900">Opening hours</dt>
              <dd>Mon–Sun · 9:00–19:00</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Location</dt>
              <dd>123 Tranquility Lane, Wellness City</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Contact</dt>
              <dd>+1 (555) 123‑4567 · hello@serenityspa.example</dd>
            </div>
          </dl>
        </div>

        <div className="hidden items-center justify-center sm:flex">
          <div className="relative h-64 w-full max-w-xs overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(52,211,153,0.25),_transparent_55%)]" />
            <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Your spa day
              </p>
              <p className="text-sm text-slate-700">
                “The most relaxing massage I&apos;ve ever had. The booking
                process was effortless.”
              </p>
              <p className="text-xs text-slate-500">— Maya, regular guest</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Featured services
            </h2>
            <p className="text-xs text-slate-600">
              Our most-loved treatments, curated by our therapists.
            </p>
          </div>
          <Link href="/services" className="text-xs font-medium text-sky-700 hover:underline">
            View all services
          </Link>
        </div>

        {featuredServices.length === 0 ? (
          <p className="text-sm text-slate-600">
            We’re curating our signature treatments. Check back soon or browse
            all services.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                href={`/services/${service.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Map + About snippet */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            About Serenity Spa
          </h2>
          <p className="text-sm text-slate-700">
            Serenity Spa is a boutique wellness studio focused on restorative
            treatments, mindful rituals, and personalized care. Our experienced
            therapists blend traditional techniques with modern modalities to
            help you reset from the inside out.
          </p>
          <Link href="/about" className="inline-flex items-center text-sm font-medium text-sky-700 hover:underline">
            Read our story
          </Link>
        </div>

        <MapEmbed
          coordinates={{ lat: 37.7749, lng: -122.4194 }}
          address="123 Tranquility Lane, Wellness City"
          openingHours={[
            "Mon–Fri · 9:00–19:00",
            "Sat–Sun · 10:00–18:00",
          ]}
        />
      </section>

      {/* Testimonials placeholder */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Guest experiences
        </h2>
        <p className="text-sm text-slate-700">
          A few words from guests who have made Serenity Spa part of their
          self‑care routine.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            “From the moment I walked in, I felt calmer. The online booking is
            so convenient.”
            <p className="mt-2 text-xs text-slate-500">— Daniel</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            “The therapists listened to exactly what I needed. I left feeling
            renewed.”
            <p className="mt-2 text-xs text-slate-500">— Aisha</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            “Beautiful space, calming atmosphere, and easy to manage
            appointments online.”
            <p className="mt-2 text-xs text-slate-500">— Luis</p>
          </div>
        </div>
      </section>
    </div>
  );
}

