import { ContactForm } from "@/components/forms/ContactForm";
import { MapEmbed } from "@/components/MapEmbed";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { getPublicSiteSettings } from "@/lib/application/siteSettings.service";

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <SectionWrapper>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Contact us</h1>
            <p className="text-sm text-slate-700">Have a question about treatments, group bookings, or special requests? Send us a note and our team will respond within one business day.</p>
            {settings.phone && (
              <p className="text-sm text-slate-700">
                Phone: <a href={`tel:${settings.phone}`} className="text-sky-700 hover:underline">{settings.phone}</a>
              </p>
            )}
            {settings.email && (
              <p className="text-sm text-slate-700">
                Email: <a href={`mailto:${settings.email}`} className="text-sky-700 hover:underline">{settings.email}</a>
              </p>
            )}
          </header>
          <ContactForm />
        </section>

        <section>
          <MapEmbed
            coordinates={{ lat: parseFloat(settings.location_lat), lng: parseFloat(settings.location_lng) }}
            address={settings.address}
            openingHours={settings.opening_hours}
          />
          <div className="mt-4 space-y-2">
            {settings.instagram_url && (
              <a href={settings.instagram_url} className="text-sm text-sky-700 hover:underline">Instagram</a>
            )}
            {settings.facebook_url && (
              <a href={settings.facebook_url} className="text-sm text-sky-700 hover:underline">Facebook</a>
            )}
            {settings.twitter_url && (
              <a href={settings.twitter_url} className="text-sm text-sky-700 hover:underline">Twitter</a>
            )}
          </div>
        </section>
      </div>
    </SectionWrapper>
  );
}

