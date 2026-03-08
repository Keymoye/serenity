import { logger } from "@/lib/utils/logger";
import { listPublicTherapists } from "@/lib/application/therapist.service";
import { PageHero } from "@/components/layout/PageHero";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { Avatar } from "@/components/ui/Avatar";
import { getPublicSiteSettings } from "@/lib/application/siteSettings.service";

type Therapist = {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
};

async function getTherapists(): Promise<Therapist[]> {
  try {
    const rows = await listPublicTherapists();
    return (rows ?? []) as unknown as Therapist[];
  } catch (error) {
    logger.error("Unexpected error while loading therapists", error);
    return [];
  }
}

export default async function AboutPage() {
  const therapists = await getTherapists();
  const settings = await getPublicSiteSettings();

  return (
    <div>
      <PageHero
        title="Our story"
        subtitle={settings.about_story}
        imageSrc={settings.about_image_url || undefined}
      />

      <SectionWrapper>
        <section className="space-y-4">
          <p className="text-sm text-stone-700">We blend time‑honored traditions with evidence‑informed wellness practices, offering a range of treatments that support relaxation, recovery, and long‑term wellbeing. Our therapists bring years of experience across modalities including deep tissue massage, lymphatic drainage, facials, and mindfulness‑based rituals.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Meet the team</h2>
          {therapists.length === 0 ? (
            <p className="text-sm text-slate-600">Our therapist roster is being finalized. Profiles will appear here once configured in admin panel.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {therapists.map((therapist) => (
                <article key={therapist.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar src={therapist.photo_url} name={therapist.name} size="lg" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{therapist.name}</h3>
                      {therapist.title && (<p className="text-xs text-stone-600">{therapist.title}</p>)}
                    </div>
                  </div>
                  {therapist.bio_short && (<p className="text-xs text-stone-700">{therapist.bio_short}</p>)}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Certifications & values</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Licensed massage therapists and estheticians.</li>
            <li>Trauma‑informed, consent‑based treatment approach.</li>
            <li>Fragrance‑light environment with hypoallergenic options.</li>
            <li>Eco‑conscious products and laundering practices.</li>
          </ul>
        </section>
      </SectionWrapper>
    </div>
  );
}

