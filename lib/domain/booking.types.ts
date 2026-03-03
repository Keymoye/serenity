import { z } from "zod";
import {
  bookingConfirmSchema as baseBookingConfirmSchema,
  type BookingConfirmInput as BaseBookingConfirmInput,
} from "../utils/validation";

export type BookingStatus = "confirmed" | "cancelled" | "pending";

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  therapist_id: string | null;
  time_slot_id: string;
  status: BookingStatus;
  reference_code: string;
  notes: string | null;
  created_at: string;
}

export interface BookingSummary {
  id: string;
  service_id: string;
  therapist_id: string | null;
  time_slot_id: string;
  status: BookingStatus;
  reference_code: string;
  created_at: string;
}

export const bookingConfirmSchema = baseBookingConfirmSchema;

export type BookingConfirmInput = BaseBookingConfirmInput &
  z.infer<typeof bookingConfirmSchema>;

