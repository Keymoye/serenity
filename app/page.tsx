import { logger } from "@/lib/utils/logger";
import { ServiceCard, type ServiceSummary } from "@/components/ServiceCard";
import { MapEmbed } from "@/components/MapEmbed";
import Link from "next/link";
import { listFeaturedServices } from "@/lib/application/service.service";
import { PageHero } from "@/components/layout/PageHero";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { getPublicSiteSettings } from "@/lib/application/siteSettings.service";

async function getFeaturedServices(): Promise<ServiceSummary[]> {
  try {
    const rows = await listFeaturedServices();
    return (rows ?? []) as unknown as ServiceSummary[];
  } catch (error) {
    logger.error("Unexpected error while loading featured services", error);
    return [];
  }
}

export default async function Home() {
  const featuredServices = await getFeaturedServices();
  const settings = await getPublicSiteSettings();

  return (
    <div className="space-y-12">
      <PageHero
        title={`Unwind, restore, and recharge at ${settings.spa_name}.`}
        subtitle={settings.tagline}
        ctaLabel="Book now"
        ctaHref="/book"
        imageSrc={settings.hero_image_url || undefined}
      />

      <SectionWrapper>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Featured services</h2>
            <p className="text-xs text-slate-600">Our most-loved treatments, curated by our therapists.</p>
          </div>
          <Link href="/services" className="text-xs font-medium text-sky-700 hover:underline">View all services</Link>
        </div>

        {featuredServices.length === 0 ? (
          <p className="text-sm text-slate-600">We’re curating our signature treatments. Check back soon or browse all services.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} href={`/services/${service.id}`} />
            ))}
          </div>
        )}
      </SectionWrapper>

      <SectionWrapper variant="muted">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">About {settings.spa_name}</h2>
            <p className="text-sm text-slate-700">{settings.about_story}</p>
            <Link href="/about" className="inline-flex items-center text-sm font-medium text-sky-700 hover:underline">Read our story</Link>
          </div>

          <MapEmbed
            coordinates={{ lat: parseFloat(settings.location_lat), lng: parseFloat(settings.location_lng) }}
            address={settings.address}
            openingHours={settings.opening_hours}
          />
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Guest experiences</h2>
          <p className="text-sm text-slate-700">A few words from guests who have made {settings.spa_name} part of their self-care routine.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">“From the moment I walked in, I felt calmer. The online booking is so convenient.”<p className="mt-2 text-xs text-stone-500">— Daniel</p></div>
            <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">“The therapists listened to exactly what I needed. I left feeling renewed.”<p className="mt-2 text-xs text-stone-500">— Aisha</p></div>
            <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">“Beautiful space, calming atmosphere, and easy to manage appointments online.”<p className="mt-2 text-xs text-stone-500">— Luis</p></div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}

