import type { Booking, BookingConfirmInput } from "../domain/booking.types";
import type { TimeSlot } from "../domain/timeSlot.types";
import {
  ConflictError,
  InternalError,
  NotFoundError,
  ValidationError,
} from "../domain/errors";
import { logger } from "@/lib/utils/logger";
import { LOCK_TIMEOUT_MS, LATE_CANCELLATION_HOURS, MIN_PASSWORD_LENGTH, BOOKING_STATUS } from "../config/constants";
import {
  sendBookingConfirmation,
  sendAdminNewBookingNotification,
  sendCancellationConfirmation,
  sendAdminLateCancellationAlert,
} from "@/lib/utils/emailService";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/utils/dateUtils";
import type { TimeSlotRepository } from "../infra/supabase/timeSlot.repo";
import type { BookingRepository } from "../infra/supabase/booking.repo";
import type { ServiceRepository } from "../infra/supabase/service.repo";
import type { ProfileRepository } from "../infra/supabase/profile.repo";
import type { TherapistRepository } from "../infra/supabase/therapist.repo";
import { createTimeSlotRepository } from "../infra/supabase/timeSlot.repo";
import { createBookingRepository } from "../infra/supabase/booking.repo";
import { createServiceRepository } from "../infra/supabase/service.repo";
import { createProfileRepository } from "../infra/supabase/profile.repo";
import { createTherapistRepository } from "../infra/supabase/therapist.repo";

export interface BookingContext {
  userId: string;
  customerProfileId: string;
  // optional correlation ID for logging/debugging
  correlationId?: string;
}

export interface BookingDependencies {
  timeSlotRepo: TimeSlotRepository;
  bookingRepo: BookingRepository;
  serviceRepo: ServiceRepository;
  profileRepo: ProfileRepository;
  therapistRepo: TherapistRepository;
}

function createDefaultDeps(): BookingDependencies {
  return {
    timeSlotRepo: createTimeSlotRepository(),
    bookingRepo: createBookingRepository(),
    serviceRepo: createServiceRepository(),
    profileRepo: createProfileRepository(),
    therapistRepo: createTherapistRepository(),
  };
}

/**
 * Returns available time slots for a given
 * therapist and service on a specific date.
 *
 * Filters out:
 * - Already booked slots
 * - Locked slots (within lock window)
 * - Past slots
 *
 * @param input - therapistId, serviceId, date
 * @returns Array of available TimeSlot objects
 */
export async function getAvailability(
  {
    serviceId,
    therapistId,
    date,
  }: { serviceId: string; therapistId?: string; date: string },
  deps: BookingDependencies = createDefaultDeps(),
): Promise<Pick<TimeSlot, "id" | "start_time" | "end_time">[]> {
  if (!serviceId || !date) {
    throw new ValidationError("Missing parameters.", { serviceId, therapistId, date });
  }
  
  if (!therapistId) {
    throw new ValidationError("Therapist is required.", { therapistId }, "THERAPIST_REQUIRED");
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

  const lockUntil = new Date(Date.now() + LOCK_TIMEOUT_MS).toISOString();
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

/**
 * Confirms a booking by atomically marking
 * the time slot as booked and creating the
 * booking record.
 *
 * Uses an optimistic lock pattern:
 * 1. Atomically flips slot availability
 *    (prevents double booking)
 * 2. Creates booking record
 * 3. On insert failure, attempts to reopen
 *    the slot (best-effort rollback)
 * 4. Sends confirmation email
 *
 * @throws ConflictError if slot already booked
 * @throws InternalError if DB write fails
 */
export async function confirmBooking(
  payload: BookingConfirmInput,
  context: BookingContext,
  deps: BookingDependencies = createDefaultDeps(),
): Promise<{ booking: Booking; referenceCode: string }> {
  if (!payload.timeSlotId) {
    throw new ValidationError("Time slot is required", payload);
  }

  const referenceCode = generateReferenceCode();

  // Pre-fetch display data for emails (non-fatal, provide fallbacks)
  let serviceName = "your service";
  try {
    const svc = await deps.serviceRepo.getPublicServiceDetail(payload.serviceId);
    if (svc && svc.service) serviceName = svc.service.name;
  } catch (_) {}

  let therapistName: string | null = null;
  try {
    if (payload.therapistId) {
      const th = await deps.therapistRepo.findById(payload.therapistId);
      if (th) therapistName = th.name;
    }
  } catch (_) {}

  let slotStartTime = "";
  try {
    const slot = await deps.timeSlotRepo.findById(payload.timeSlotId);
    if (slot) slotStartTime = slot.start_time;
  } catch (_) {}

  let customerEmail = "";
  let customerName = "Valued Customer";
  try {
    const profile = await deps.profileRepo.findById(context.userId);
    if (profile) {
      customerName = profile.name ?? "Valued Customer";
      // email not stored on profile; leave empty string
    }
  } catch (_) {}

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
    });
  } catch (error) {
    // Best-effort rollback: reopen the slot if booking insert fails.
    try {
      await deps.timeSlotRepo.setAvailable(payload.timeSlotId);
    } catch (rollbackError) {
      logger.error(
        "CRITICAL: slot rollback failed after booking insert failure. " +
        "Slot is stuck as unavailable and requires manual reconciliation.",
        rollbackError,
        { timeSlotId: payload.timeSlotId }
      )
    }
    throw new InternalError("INSERT_FAILED", "Unable to confirm booking.", {
      timeSlotId: payload.timeSlotId,
      error,
    });
  }

  // send emails (best-effort)
  const emailResult = await sendBookingConfirmation({
    to: customerEmail,
    customerName,
    referenceCode: booking.reference_code,
    serviceName,
    therapistName,
    appointmentDate: formatAppointmentDate(slotStartTime),
    appointmentTime: formatAppointmentTime(slotStartTime),
    notes: payload.notes ?? null,
    cancellationUrl: `${process.env.SPA_WEBSITE ?? ""}/dashboard`,
  });
  if (!emailResult.success) {
    logger.warn("Booking confirmation email failed", {
      bookingId: booking.id,
      error: emailResult.error,
      correlationId: context.correlationId,
    });
  }

  const adminResult = await sendAdminNewBookingNotification({
    referenceCode: booking.reference_code,
    customerName,
    customerEmail,
    serviceName,
    therapistName,
    appointmentDate: formatAppointmentDate(slotStartTime),
    appointmentTime: formatAppointmentTime(slotStartTime),
    notes: payload.notes ?? null,
  });
  if (!adminResult.success) {
    logger.warn("Admin booking notification failed", {
      bookingId: booking.id,
      error: adminResult.error,
      correlationId: context.correlationId,
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

/**
 * Cancels a confirmed booking.
 * Reopens the associated time slot so it
 * can be booked again.
 *
 * @throws NotFoundError if booking not found
 * @throws ConflictError if already cancelled
 * @throws ForbiddenError if cancellation is
 *   within LATE_CANCELLATION_HOURS
 */
export async function cancelBooking(
  { bookingId }: { bookingId: string },
  context: BookingContext,
  deps: BookingDependencies = createDefaultDeps(),
): Promise<Booking> {
  if (!bookingId || typeof bookingId !== "string") {
    throw new ValidationError("Booking ID is required.");
  }

  let booking: Booking | null;
  try {
    booking = await deps.bookingRepo.findBookingById(bookingId);
  } catch (error) {
    throw new InternalError("FETCH_FAILED", "Unable to fetch booking.", {
      bookingId,
      error,
    });
  }

  if (!booking) {
    throw new NotFoundError("Booking not found.");
  }

  if (booking.customer_id !== context.customerProfileId) {
    throw new NotFoundError("Booking not found.");
  }

  if (booking.status === "cancelled") {
    throw new ConflictError("ALREADY_CANCELLED", "Booking is already cancelled.");
  }

  let cancelled: Booking | null;
  try {
    cancelled = await deps.bookingRepo.cancelCustomerBooking(bookingId, context.customerProfileId);
  } catch (error) {
    throw new InternalError("CANCEL_FAILED", "Unable to cancel booking.", {
      bookingId,
      error,
    });
  }

  if (!cancelled) {
    throw new NotFoundError("Booking not found.");
  }

  if (booking.time_slot_id) {
    try {
      await deps.timeSlotRepo.reopenTimeSlot(booking.time_slot_id);
    } catch (_error) {
    }
  }

  // pre-fetch data for emails (best-effort, non-fatal)
  let serviceName = "your service";
  try {
    const svc = await deps.serviceRepo.getPublicServiceDetail(booking.service_id);
    if (svc && svc.service) serviceName = svc.service.name;
  } catch (_) {}

  let therapistName: string | null = null;
  try {
    if (booking.therapist_id) {
      const th = await deps.therapistRepo.findById(booking.therapist_id);
      if (th) therapistName = th.name;
    }
  } catch (_) {}

  let slotStartTime = "";
  try {
    const slot = await deps.timeSlotRepo.findById(booking.time_slot_id);
    if (slot) slotStartTime = slot.start_time;
  } catch (_) {}

  let customerEmail = "";
  let customerName = "Valued Customer";
  try {
    const profile = await deps.profileRepo.findById(context.userId);
    if (profile) {
      customerName = profile.name ?? "Valued Customer";
      // email not stored on profile; leave blank
    }
  } catch (_) {}

  // always send cancellation confirmation
  const cancelEmailResult = await sendCancellationConfirmation({
    to: customerEmail,
    customerName,
    referenceCode: cancelled.reference_code,
    serviceName,
    therapistName,
    appointmentDate: formatAppointmentDate(slotStartTime),
    appointmentTime: formatAppointmentTime(slotStartTime),
  });
  if (!cancelEmailResult.success) {
    logger.warn("Cancellation confirmation email failed", {
      bookingId: cancelled.id,
      error: cancelEmailResult.error,
      correlationId: context.correlationId,
    });
  }

  // potentially send late-cancellation admin alert
  if (slotStartTime) {
    const hoursUntil =
      (new Date(slotStartTime).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil >= 0 && hoursUntil < LATE_CANCELLATION_HOURS) {
      const alertResult = await sendAdminLateCancellationAlert({
        referenceCode: cancelled.reference_code,
        customerName,
        serviceName,
        therapistName,
        appointmentDate: formatAppointmentDate(slotStartTime),
        appointmentTime: formatAppointmentTime(slotStartTime),
        hoursUntilAppointment: Math.round(hoursUntil),
      });
      if (!alertResult.success) {
        logger.warn("Admin late cancellation alert failed", {
          bookingId: cancelled.id,
          error: alertResult.error,
          correlationId: context.correlationId,
        });
      }
    }
  }

  return cancelled;
}

