import React from "react";
import { listTherapists } from "@/lib/db/therapists";
import TherapistForm from "@/components/admin/TherapistForm";

export default async function TherapistsAdminPage() {
  const therapists = await listTherapists();
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
              <strong>{t.name}</strong> — {t.bio}
              <div>
                <TherapistForm initial={t} />
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
