import { getPublicServiceDetail, getTherapistDetail } from "@/lib/application/service.service";
import { logger } from "@/lib/utils/logger";
import Image from "next/image";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { PageHero } from "@/components/layout/PageHero";

type TherapistPageProps = { params: Promise<{ id: string }> };

export default async function TherapistPage({ params }: TherapistPageProps) {
  const { id } = await await params;
  let detail;

  try {
    detail = await getTherapistDetail({ therapistId: id });
  } catch (error) {
    logger.error("failed loading therapist detail", error);
  }

  if (!detail || !detail.therapist) {
    return <p className="text-center text-sm text-red-600">Therapist not found.</p>;
  }

  const { therapist, services } = detail;

  return (
    <div>
      <PageHero title={therapist.name} subtitle={therapist.bio_short ?? undefined} imageSrc={therapist.photo_url ?? "/images/therapist-placeholder.jpg"} />

      <SectionWrapper>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Services offered</h2>
          {services.length === 0 ? (
            <p className="text-sm text-slate-600">No services listed.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {services.map((svc) => (
                <li key={svc.id} className="rounded-lg border border-slate-200 p-4 bg-white">
                  <h3 className="text-lg font-medium text-slate-800">{svc.name}</h3>
                  {svc.duration_minutes && (<p className="text-sm text-slate-600">{svc.duration_minutes} minutes</p>)}
                  {svc.price != null && (<p className="text-sm text-slate-600">${svc.price.toFixed(2)}</p>)}
                  <a href={`/book?serviceId=${encodeURIComponent(svc.id)}&therapistId=${encodeURIComponent(id)}`} className="mt-2 inline-block rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700">Book now</a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </SectionWrapper>
    </div>
  );
}
