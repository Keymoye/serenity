import React from "react";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import { listTimeSlotsAdmin, listTherapistsAdmin } from "@/lib/application/admin.service";
import { ScheduleViewer } from "@/components/admin/ScheduleViewer";
import { logger } from "@/lib/utils/logger";
import type { TimeSlot } from "@/lib/domain/timeSlot.types";
import type { Therapist } from "@/lib/domain/therapist.types";
import { TimeSlotForm } from "@/components/admin/TimeSlotForm";

export default async function ScheduleAdminPage() {
  const current = await requireAdmin();
  let items: TimeSlot[] = [];
  let therapists: Therapist[]= [];
  try {
    [items, therapists] = await Promise.all([
      listTimeSlotsAdmin({ userId: current.user.id, role: current.profile.role }),
      listTherapistsAdmin({ userId: current.user.id, role: current.profile.role }),
    ]);
  } catch (error) {
    logger.error("Failed to load time slots or therapists", error);
  }

  // (client component will handle grouping/filtering)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Schedule</h1>
      </header>

      <section>
        <TimeSlotForm />
      </section>

      <section>
        <ScheduleViewer slots={items} therapists={therapists} />
      </section>
    </div>
  );
}
