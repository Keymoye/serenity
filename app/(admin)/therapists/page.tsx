import React from "react";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import { listTherapistsAdmin } from "@/lib/application/admin.service";
import { logger } from "@/lib/utils/logger";
import type { Therapist } from "@/lib/domain/therapist.types";
import TherapistForm from "@/components/admin/TherapistForm";
import TherapistsList from "@/components/admin/TherapistsList";

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
        <TherapistsList initialTherapists={therapists} />
      </section>
    </div>
  );
}
