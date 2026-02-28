import React from "react";
import { listSchedule } from "@/lib/db/schedule";

export default async function ScheduleAdminPage() {
  const items = await listSchedule();
  return (
    <div>
      <h1>Schedule (Admin)</h1>
      <section>
        <h2>Existing</h2>
        <ul>
          {items.map((s) => (
            <li key={s.id}>
              <strong>{s.therapist_id}</strong> — {s.date} {s.start_time}–{s.end_time}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
