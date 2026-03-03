import React from "react";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import { listTimeSlotsAdmin } from "@/lib/application/admin.service";
import { logger } from "@/lib/utils/logger";
import type { TimeSlot } from "@/lib/domain/timeSlot.types";

export default async function ScheduleAdminPage() {
  const current = await requireAdmin();
  let items: TimeSlot[] = [];
  try {
    items = await listTimeSlotsAdmin({ userId: current.user.id, role: current.profile.role });
  } catch (error) {
    logger.error("Failed to load time slots", error);
  }
  return (
    <div>
      <h1>Schedule (Admin)</h1>
      <section>
        <h2>Existing</h2>
        <ul>
          {items.map((s) => (
            <li key={s.id}>
              <strong>{s.therapist_id}</strong> — {s.start_time}–{s.end_time}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
