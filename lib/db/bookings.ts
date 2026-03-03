import type { Booking } from "../domain/booking.types";
import { createBookingRepository } from "../infra/supabase/booking.repo";

const bookingRepo = createBookingRepository();

export type { Booking };

export async function listBookings() {
  return bookingRepo.listBookings();
}

export async function createBooking(payload: Booking) {
  return bookingRepo.createBooking(payload);
}

export async function updateBooking(id: string, payload: Partial<Booking>) {
  return bookingRepo.updateBooking(id, payload);
}

export async function deleteBooking(id: string) {
  await bookingRepo.deleteBooking(id);
  return true;
}

