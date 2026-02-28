import { ContactForm } from "@/components/forms/ContactForm";
import { MapEmbed } from "@/components/MapEmbed";

export default function ContactPage() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="space-y-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Contact us
          </h1>
          <p className="text-sm text-slate-700">
            Have a question about treatments, group bookings, or special
            requests? Send us a note and our team will respond within one
            business day.
          </p>
        </header>
        <ContactForm />
      </section>

      <section>
        <MapEmbed
          coordinates={{ lat: 37.7749, lng: -122.4194 }}
          address="123 Tranquility Lane, Wellness City"
          openingHours={[
            "Mon–Fri · 9:00–19:00",
            "Sat–Sun · 10:00–18:00",
          ]}
        />
      </section>
    </div>
  );
}

