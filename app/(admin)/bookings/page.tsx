import React from "react";
import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { listAdminBookingRows } from "@/lib/application/admin.service";

export default async function BookingsAdminPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const bookings = await listAdminBookingRows({
    userId: current.user.id,
    role: current.profile.role,
  });
  return (
    <div>
      <h1>Bookings (Admin)</h1>
      <section>
        <h2>Existing</h2>
        <ul>
          {bookings.map((b) => (
            <li key={b.id}>
              <strong>{b.customer_name}</strong> — {b.created_at ?? "—"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
