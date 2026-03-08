import { notFound } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import { MapEmbed } from "@/components/MapEmbed";
import { getPublicServiceDetail } from "@/lib/application/service.service";
import { PageHero } from "@/components/layout/PageHero";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { Avatar } from "@/components/ui/Avatar";

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
    <div>
      <PageHero
        title={service.name}
        subtitle={service.description ?? "A deeply restorative treatment designed to calm the nervous system, release tension, and leave you feeling centered and renewed."}
        ctaLabel="Book this service"
        ctaHref={`/book?serviceId=${encodeURIComponent(service.id)}`}
        imageSrc={
          images[0]?.image_url
          ?? service?.thumbnail_url
          ?? undefined
        }
      />

      <SectionWrapper>
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{service.category || "Signature treatment"}</p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              {service.duration_minutes && (<span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">{service.duration_minutes} minutes</span>)}
              {service.price != null && (<span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">${service.price.toFixed(2)}</span>)}
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Gallery</h2>
            {images.length === 0 ? (
              <p className="text-sm text-slate-600">We&apos;re preparing imagery for this treatment. Check back soon.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <div key={img.id} className="aspect-[4/3] overflow-hidden rounded-xl bg-stone-100">
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Qualified therapists</h2>
            {therapists.length === 0 ? (
              <p className="text-sm text-slate-600">Our therapist roster for this treatment will appear here once configured in the admin panel.</p>
            ) : (
              <ul className="space-y-3">
                {therapists.map((therapist) => (
                  <li key={therapist.id} className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm text-stone-700">
                    <Avatar
                      src={therapist.photo_url ?? null}
                      name={therapist.name}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{therapist.name}</p>
                      {therapist.title && (<p className="text-xs text-stone-600">{therapist.title}</p>)}
                      {therapist.bio_short && (<p className="mt-1 text-xs text-stone-600">{therapist.bio_short}</p>)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper variant="muted">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Preparing for your visit</h2>
            <p className="text-sm text-slate-700">Please arrive 10–15 minutes before your scheduled time to unwind with herbal tea and complete a brief consultation. Our team will tailor the treatment to your preferences and any areas of focus.</p>
          </div>
          <MapEmbed
            coordinates={{ lat: 37.7749, lng: -122.4194 }}
            address="123 Tranquility Lane, Wellness City"
            openingHours={["Mon–Fri · 9:00–19:00", "Sat–Sun · 10:00–18:00"]}
          />
        </div>
      </SectionWrapper>
    </div>
  );
}

