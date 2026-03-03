import { getPublicServiceDetail, getTherapistDetail } from "@/lib/application/service.service";
import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { logger } from "@/lib/utils/logger";
import Image from "next/image";

type TherapistPageProps = { params: { id: string } };

export default async function TherapistPage({ params }: TherapistPageProps) {
  const { id } = params;
  const current = await getCurrentUser();
  let detail;

  try {
    detail = await getTherapistDetail({ therapistId: id });
  } catch (error) {
    logger.error("failed loading therapist detail", error);
  }

  if (!detail) {
    return <p className="text-center text-sm text-red-600">Therapist not found.</p>;
  }

  const { therapist, services } = detail;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        {therapist.photo_url && (
          <Image
            src={therapist.photo_url}
            alt={therapist.name}
            className="h-40 w-40 rounded-full object-cover"
          />
        )}
        <h1 className="text-3xl font-bold text-slate-900">
          {therapist.name}
          {therapist.title && <span className="text-lg font-medium text-slate-600">, {therapist.title}</span>}
        </h1>
        {therapist.bio_short && (
          <p className="text-sm text-slate-700">{therapist.bio_short}</p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Services offered</h2>
        {services.length === 0 ? (
          <p className="text-sm text-slate-600">No services listed.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {services.map((svc) => (
              <li key={svc.id} className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-lg font-medium text-slate-800">{svc.name}</h3>
                {svc.duration_minutes && (
                  <p className="text-sm text-slate-600">{svc.duration_minutes} minutes</p>
                )}
                {svc.price != null && (
                  <p className="text-sm text-slate-600">${svc.price.toFixed(2)}</p>
                )}
                <a
                  href={`/book?serviceId=${encodeURIComponent(svc.id)}&therapistId=${encodeURIComponent(id)}`}
                  className="mt-2 inline-block rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
                >
                  Book now
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
