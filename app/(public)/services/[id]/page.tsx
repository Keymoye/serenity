import { notFound } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import { MapEmbed } from "@/components/MapEmbed";
import { getPublicServiceDetail } from "@/lib/application/service.service";

type ServiceDetailPageProps = {
  params: { id: string };
};

type ServiceDetail = {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  description: string | null;
  thumbnail_url: string | null;
};

type ServiceImage = {
  id: string;
  image_url: string;
  sort_order: number | null;
};

type Therapist = {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
};

async function getServiceDetail(
  id: string
): Promise<{
  service: ServiceDetail | null;
  images: ServiceImage[];
  therapists: Therapist[];
}> {
  try {
    const result = await getPublicServiceDetail({ id });
    return {
      service: result.service as unknown as ServiceDetail | null,
      images: result.images as unknown as ServiceImage[],
      therapists: result.therapists as unknown as Therapist[],
    };
  } catch (error) {
    logger.error("Unexpected error while loading service detail", error, { id });
    return { service: null, images: [], therapists: [] };
  }
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { id } = await params;
  const { service, images, therapists } = await getServiceDetail(id);

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            {service.category || "Signature treatment"}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
            {service.name}
          </h1>
          <p className="flex flex-wrap gap-3 text-sm text-slate-700">
            {service.duration_minutes && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {service.duration_minutes} minutes
              </span>
            )}
            {service.price != null && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                ${service.price.toFixed(2)}
              </span>
            )}
          </p>
          <p className="max-w-xl text-sm text-slate-700">
            {service.description ??
              "A deeply restorative treatment designed to calm the nervous system, release tension, and leave you feeling centered and renewed."}
          </p>
          <a
            href={`/book?serviceId=${encodeURIComponent(service.id)}`}
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
          >
            Book this service
          </a>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="aspect-video w-full rounded-xl bg-slate-100" />
          <p className="text-xs text-slate-600">
            This area can showcase a hero image or short gallery of the
            treatment room. Configure the{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
              service_images
            </code>{" "}
            table to manage these assets.
          </p>
        </div>
      </section>

      {/* Gallery + Therapists */}
      <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Gallery
          </h2>
          {images.length === 0 ? (
            <p className="text-sm text-slate-600">
              We&apos;re preparing imagery for this treatment. Check back
              soon.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="aspect-[4/3] rounded-xl bg-slate-100"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Qualified therapists
          </h2>
          {therapists.length === 0 ? (
            <p className="text-sm text-slate-600">
              Our therapist roster for this treatment will appear here once
              configured in the admin panel.
            </p>
          ) : (
            <ul className="space-y-3">
              {therapists.map((therapist) => (
                <li
                  key={therapist.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {therapist.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {therapist.name}
                    </p>
                    {therapist.title && (
                      <p className="text-xs text-slate-600">
                        {therapist.title}
                      </p>
                    )}
                    {therapist.bio_short && (
                      <p className="mt-1 text-xs text-slate-600">
                        {therapist.bio_short}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Location / info snippet */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Preparing for your visit
          </h2>
          <p className="text-sm text-slate-700">
            Please arrive 10–15 minutes before your scheduled time to unwind
            with herbal tea and complete a brief consultation. Our team will
            tailor the treatment to your preferences and any areas of focus.
          </p>
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
    </div>
  );
}

