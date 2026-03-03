import React from "react";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import { listTherapistsAdmin } from "@/lib/application/admin.service";
import { logger } from "@/lib/utils/logger";
import type { Therapist, TherapistInput } from "@/lib/domain/therapist.types";
import TherapistForm from "@/components/admin/TherapistForm";

export default async function TherapistsAdminPage() {
  const current = await requireAdmin();
  let therapists: Therapist[] = [];
  try {
    therapists = await listTherapistsAdmin({ userId: current.user.id, role: current.profile.role });
  } catch (error) {
    logger.error("Failed to load therapists", error);
  }
  return (
    <div>
      <h1>Therapists</h1>
      <section>
        <h2>Create</h2>
        <TherapistForm />
      </section>

      <section>
        <h2>Existing</h2>
        <ul>
          {therapists.map((t) => (
            <li key={t.id}>
              <strong>{t.name}</strong> — {t.bio_short || t.title}
              <div>
                <TherapistForm initial={t as TherapistInput} />
                <button
                  onClick={async () => {
                    if (!confirm("Delete therapist?")) return;
                    await fetch(`/api/admin/therapists?id=${t.id}`, { method: "DELETE" });
                    location.reload();
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
