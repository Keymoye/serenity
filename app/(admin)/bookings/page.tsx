import React from "react";
import { listBookings } from "@/lib/db/bookings";

export default async function BookingsAdminPage() {
  const bookings = await listBookings();
  return (
    <div>
      <h1>Bookings (Admin)</h1>
      <section>
        <h2>Existing</h2>
        <ul>
          {bookings.map((b) => (
            <li key={b.id}>
              <strong>{b.customer_name}</strong> — {b.date} {b.time}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
