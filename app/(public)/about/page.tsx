import { getServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

type Therapist = {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
};

async function getTherapists(): Promise<Therapist[]> {
  try {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from("therapists")
      .select("id, name, title, photo_url, bio_short, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      logger.error("Failed to load therapists for about page", error);
      return [];
    }

    return (data ?? []) as Therapist[];
  } catch (error) {
    logger.error("Unexpected error while loading therapists", error);
    return [];
  }
}

export default async function AboutPage() {
  const therapists = await getTherapists();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Our story
        </h1>
        <p className="text-sm text-slate-700">
          Serenity Spa was founded with a simple belief: that true rest is not
          a luxury, but a necessity. Our space is designed as a calm,
          grounding refuge from a busy world, where every detail—from the
          music and lighting to the scents in the air—supports your nervous
          system in returning to balance.
        </p>
        <p className="text-sm text-slate-700">
          We blend time‑honored traditions with evidence‑informed wellness
          practices, offering a range of treatments that support relaxation,
          recovery, and long‑term wellbeing. Our therapists bring years of
          experience across modalities including deep tissue massage, lymphatic
          drainage, facials, and mindfulness‑based rituals.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Meet the team
        </h2>
        {therapists.length === 0 ? (
          <p className="text-sm text-slate-600">
            Our therapist roster is being finalized. Profiles will appear
            here once configured in the admin panel.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {therapists.map((therapist) => (
              <article
                key={therapist.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {therapist.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {therapist.name}
                    </h3>
                    {therapist.title && (
                      <p className="text-xs text-slate-600">
                        {therapist.title}
                      </p>
                    )}
                  </div>
                </div>
                {therapist.bio_short && (
                  <p className="text-xs text-slate-700">
                    {therapist.bio_short}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Certifications & values
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Licensed massage therapists and estheticians.</li>
          <li>Trauma‑informed, consent‑based treatment approach.</li>
          <li>Fragrance‑light environment with hypoallergenic options.</li>
          <li>Eco‑conscious products and laundering practices.</li>
        </ul>
      </section>
    </div>
  );
}

