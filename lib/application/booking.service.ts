import type { Booking, BookingConfirmInput } from "../domain/booking.types";
import type { TimeSlot } from "../domain/timeSlot.types";
import {
  ConflictError,
  InternalError,
  ValidationError,
} from "../domain/errors";
import type { TimeSlotRepository } from "../infra/supabase/timeSlot.repo";
import type { BookingRepository } from "../infra/supabase/booking.repo";
import { createTimeSlotRepository } from "../infra/supabase/timeSlot.repo";
import { createBookingRepository } from "../infra/supabase/booking.repo";
import { createServiceRepository } from "../infra/supabase/service.repo";
import type { ServiceRepository } from "../infra/supabase/service.repo";

export interface BookingContext {
  userId: string;
  customerProfileId: string;
}

export interface BookingDependencies {
  timeSlotRepo: TimeSlotRepository;
  bookingRepo: BookingRepository;
  serviceRepo: ServiceRepository;
}

function createDefaultDeps(): BookingDependencies {
  return {
    timeSlotRepo: createTimeSlotRepository(),
    bookingRepo: createBookingRepository(),
    serviceRepo: createServiceRepository(),
  };
}

export async function getAvailability(
  {
    serviceId,
    therapistId,
    date,
  }: { serviceId: string; therapistId: string; date: string },
  deps: BookingDependencies = createDefaultDeps(),
): Promise<Pick<TimeSlot, "id" | "start_time" | "end_time">[]> {
  if (!serviceId || !therapistId || !date) {
    throw new ValidationError("Missing parameters.", { serviceId, therapistId, date });
  }
  let assigned: boolean;
  try {
    assigned = await deps.serviceRepo.isTherapistAssignedToService(
      serviceId,
      therapistId,
    );
  } catch (error) {
    throw new InternalError("LINK_CHECK_FAILED", "Unable to verify therapist.", {
      serviceId,
      therapistId,
      error,
    });
  }

  if (!assigned) {
    throw new ValidationError(
      "Therapist is not assigned to this service.",
      { serviceId, therapistId },
      "THERAPIST_NOT_ASSIGNED",
    );
  }

  const startOfDay = new Date(date + "T00:00:00.000Z").toISOString();
  const endOfDay = new Date(date + "T23:59:59.999Z").toISOString();

  const slots = await deps.timeSlotRepo.findForTherapistOnDate(
    therapistId,
    startOfDay,
    endOfDay,
  );

  const now = new Date();

  const bookableSlots =
    slots.filter((slot) => {
      const isAvailable = slot.is_available;
      const lockedUntil = slot.locked_until
        ? new Date(slot.locked_until)
        : null;
      const lockExpired =
        !lockedUntil || (lockedUntil && lockedUntil <= now);
      return isAvailable && lockExpired;
    }) ?? [];

  return bookableSlots.map((s) => ({
    id: s.id,
    start_time: s.start_time,
    end_time: s.end_time,
  }));
}

export async function lockSlot(
  { timeSlotId }: { timeSlotId: string },
  _context: BookingContext,
  deps: BookingDependencies = createDefaultDeps(),
): Promise<void> {
  if (!timeSlotId) {
    throw new ValidationError("Missing timeSlotId", { timeSlotId });
  }

  const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const locked = await deps.timeSlotRepo.lockSlot(timeSlotId, lockUntil, nowIso);

  if (!locked) {
    throw new ConflictError("SLOT_TAKEN", "This time slot is no longer available.", {
      timeSlotId,
    });
  }
}

function generateReferenceCode() {
  const now = new Date();
  const yyyy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SS-${yyyy}${mm}${dd}-${rand}`;
}

export async function confirmBooking(
  payload: BookingConfirmInput,
  context: BookingContext,
  deps: BookingDependencies = createDefaultDeps(),
): Promise<{ booking: Booking; referenceCode: string }> {
  if (!payload.timeSlotId) {
    throw new ValidationError("Time slot is required", payload);
  }

  const referenceCode = generateReferenceCode();

  // Atomic gate: only one confirmation can flip availability from true->false.
  let marked = false;
  try {
    marked = await deps.timeSlotRepo.tryMarkAsBooked(payload.timeSlotId);
  } catch (error) {
    throw new InternalError("SLOT_UPDATE_FAILED", "Unable to confirm booking.", {
      timeSlotId: payload.timeSlotId,
      error,
    });
  }

  if (!marked) {
    throw new ConflictError(
      "SLOT_ALREADY_BOOKED",
      "This time slot has already been booked.",
      { timeSlotId: payload.timeSlotId },
    );
  }

  let booking: Booking;
  try {
    booking = await deps.bookingRepo.createBooking({
      customer_id: context.customerProfileId,
      service_id: payload.serviceId,
      therapist_id: payload.therapistId,
      time_slot_id: payload.timeSlotId,
      status: "confirmed",
      reference_code: referenceCode,
      notes: payload.notes || null,
    } as unknown as Omit<Booking, "id" | "created_at">);
  } catch (error) {
    // Best-effort rollback: reopen the slot if booking insert fails.
    try {
      await deps.timeSlotRepo.setAvailable(payload.timeSlotId);
    } catch {
      // swallow rollback failure; slot remains unavailable and must be reconciled manually
    }
    throw new InternalError("INSERT_FAILED", "Unable to confirm booking.", {
      timeSlotId: payload.timeSlotId,
      error,
    });
  }

  return {
    booking,
    referenceCode,
  };
}

export async function listCustomerBookings(
  context: BookingContext,
  deps: BookingDependencies = createDefaultDeps(),
) {
  if (!context?.customerProfileId) {
    throw new ValidationError("Unauthorized.");
  }
  try {
    return await deps.bookingRepo.listCustomerBookingRows(context.customerProfileId);
  } catch (error) {
    throw new InternalError("BOOKINGS_FAILED", "Failed to load customer bookings", { error });
  }
}

