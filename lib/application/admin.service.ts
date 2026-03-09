import type { Service, ServiceImage, ServiceImageAddInput } from "../domain/service.types";
import type { Therapist } from "../domain/therapist.types";
import type { TimeSlot } from "../domain/timeSlot.types";
import type { AdminServiceInput, AdminTherapistInput, AdminBookingStatusInput } from "../domain/admin.types";
import { ValidationError, UnauthorizedError } from "../domain/errors";
import { createServiceRepository } from "../infra/supabase/service.repo";
import { createTherapistRepository } from "../infra/supabase/therapist.repo";
import { createBookingRepository } from "../infra/supabase/booking.repo";
import { createTimeSlotRepository, type TimeSlotRepository } from "../infra/supabase/timeSlot.repo";
import { createMessageRepository, type MessageRepository } from "../infra/supabase/message.repo";
import type { ServiceRepository } from "../infra/supabase/service.repo";
import type { TherapistRepository } from "../infra/supabase/therapist.repo";
import type { BookingRepository } from "../infra/supabase/booking.repo";

export interface AdminContext {
  userId: string;
  role: "admin" | "customer" | "guest" | string;
}

export interface AdminDependencies {
  serviceRepo: ServiceRepository;
  therapistRepo: TherapistRepository;
  bookingRepo: BookingRepository;
  timeSlotRepo: TimeSlotRepository;
  messageRepo: MessageRepository;
}

function createDefaultDeps(): AdminDependencies {
  return {
    serviceRepo: createServiceRepository(),
    therapistRepo: createTherapistRepository(),
    bookingRepo: createBookingRepository(),
    timeSlotRepo: createTimeSlotRepository(),
    messageRepo: createMessageRepository(),
  };
}

function assertAdmin(context: AdminContext) {
  if (context.role !== "admin") {
    throw new UnauthorizedError("Admin access required", { role: context.role });
  }
}

// Services

export async function listServices(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Service[]> {
  assertAdmin(context);
  return deps.serviceRepo.listAllServices();
}

export async function createServiceAdmin(
  input: AdminServiceInput,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Service> {
  assertAdmin(context);
  if (!input.name) {
    throw new ValidationError("Name is required.");
  }
  return deps.serviceRepo.createService({
    name: input.name,
    category: input.category || null,
    duration_minutes: input.duration_minutes ?? null,
    price: input.price ?? null,
    description: input.description || null,
    is_active: input.is_active ?? true,
  });
}

export async function updateServiceAdmin(
  id: string,
  input: AdminServiceInput,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Service> {
  assertAdmin(context);
  if (!id) {
    throw new ValidationError("Service id is required.");
  }
  return deps.serviceRepo.updateService(id, {
    name: input.name,
    category: input.category || null,
    duration_minutes: input.duration_minutes ?? null,
    price: input.price ?? null,
    description: input.description || null,
    is_active: input.is_active ?? true,
  });
}

export async function deleteServiceAdmin(
  id: string,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<void> {
  assertAdmin(context);
  if (!id) {
    throw new ValidationError("Service id is required.");
  }
  await deps.serviceRepo.deleteService(id);
}

// Therapists

export async function listTherapistsAdmin(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Therapist[]> {
  assertAdmin(context);
  return deps.therapistRepo.listTherapists();
}

export async function createTherapistAdmin(
  input: AdminTherapistInput,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Therapist> {
  assertAdmin(context);
  if (!input.name) {
    throw new ValidationError("Name is required.");
  }
  return deps.therapistRepo.createTherapist({
    name: input.name,
    title: input.title || null,
    photo_url: input.photo_url || null,
    bio_short: input.bio_short || null,
    is_active: input.is_active ?? true,
  });
}

export async function updateTherapistAdmin(
  id: string,
  input: AdminTherapistInput,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Therapist> {
  assertAdmin(context);
  if (!id) {
    throw new ValidationError("Therapist id is required.");
  }
  return deps.therapistRepo.updateTherapist(id, {
    name: input.name,
    title: input.title || null,
    photo_url: input.photo_url || null,
    bio_short: input.bio_short || null,
    is_active: input.is_active ?? true,
  });
}

export async function deleteTherapistAdmin(
  id: string,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<void> {
  assertAdmin(context);
  if (!id) {
    throw new ValidationError("Therapist id is required.");
  }
  await deps.therapistRepo.deleteTherapist(id);
}

// Bookings

export async function listBookingsAdmin(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
) {
  assertAdmin(context);
  return deps.bookingRepo.listBookings();
}

export async function listAdminBookingRows(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
) {
  assertAdmin(context);
  return deps.bookingRepo.listAdminBookingRows();
}

export async function updateBookingStatusAdmin(
  input: AdminBookingStatusInput,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
) {
  assertAdmin(context);
  if (!input.bookingId) {
    throw new ValidationError("Booking id is required.");
  }
  return deps.bookingRepo.updateBooking(input.bookingId, {
    status: input.status,
  });
}

export async function deleteBookingAdmin(
  bookingId: string,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<void> {
  assertAdmin(context);
  if (!bookingId) {
    throw new ValidationError("Booking id is required.");
  }
  await deps.bookingRepo.deleteBooking(bookingId);
}

// Time slots

export async function listTimeSlotsAdmin(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<TimeSlot[]> {
  assertAdmin(context);
  return deps.timeSlotRepo.listTimeSlots();
}

export async function createTimeSlotAdmin(
  input: { therapistId: string; start_time: string; end_time: string },
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
) {
  assertAdmin(context);
  if (!input.therapistId || !input.start_time || !input.end_time) {
    throw new ValidationError("Invalid input.");
  }
  await deps.timeSlotRepo.createTimeSlot({
    therapist_id: input.therapistId,
    start_time: input.start_time,
    end_time: input.end_time,
  });
}

export async function deleteTimeSlotAdmin(
  id: string,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
) {
  assertAdmin(context);
  if (!id) {
    throw new ValidationError("Time slot id is required.");
  }
  await deps.timeSlotRepo.deleteTimeSlot(id);
}

// Messages

export async function listMessagesAdmin(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
) {
  assertAdmin(context);
  return deps.messageRepo.listMessages();
}

export async function toggleMessageReadAdmin(
  input: { messageId: string; isRead: boolean },
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
) {
  assertAdmin(context);
  if (!input.messageId) {
    throw new ValidationError("Message id is required.");
  }
  await deps.messageRepo.setMessageRead(input.messageId, input.isRead);
}

export type AdminMetrics = {
  bookingsThisMonth: number;
  upcomingToday: number;
  unreadMessages: number;
  bookingsLast7Days: Array<{ date: string; count: number }>;
};

/**
 * Fetches dashboard metrics for the admin panel.
 * Runs all DB queries in parallel for performance.
 *
 * @returns bookingsThisMonth, upcomingToday,
 *   unreadMessages, bookingsLast7Days chart data
 * @throws UnauthorizedError if not admin context
 */
export async function getAdminMetrics(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<AdminMetrics> {
  assertAdmin(context);
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  ).toISOString();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();

  // Run first 3 metrics in parallel
  const [
    bookingsThisMonth,
    unreadMessages,
    upcomingToday,
  ] = await Promise.all([
    deps.bookingRepo.countBookingsSince(startOfMonth),
    deps.messageRepo.countUnreadMessages(),
    deps.bookingRepo.countConfirmedBookingsWithSlotBetween(
      startOfToday,
      endOfToday,
    ),
  ]);

  // Run last 7 days queries in parallel
  const last7 = Array.from(
    { length: 7 },
    (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return deps.bookingRepo
        .countConfirmedBookingsWithSlotBetween(
          start.toISOString(),
          end.toISOString()
        ).then((count) => ({
          date: start.toISOString().slice(0, 10),
          count,
        }));
    }
  );
  const bookingsLast7Days = await Promise.all(last7);

  return { bookingsThisMonth, upcomingToday, unreadMessages, bookingsLast7Days };
}

export async function assignServicesToTherapistAdmin(
  therapistId: string,
  serviceIds: string[],
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<void> {
  assertAdmin(context);
  await deps.serviceRepo.assignServicesToTherapist(
    therapistId,
    serviceIds
  );
}

export async function assignTherapistsToServiceAdmin(
  serviceId: string,
  therapistIds: string[],
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<void> {
  assertAdmin(context);
  await deps.serviceRepo.assignTherapistsToService(
    serviceId,
    therapistIds
  );
}

export async function listAllServicesForAssignment(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Array<{ id: string; name: string; category: string | null }>> {
  assertAdmin(context);
  return deps.serviceRepo.listAllServicesAdmin();
}

export async function listAllTherapistsForAssignment(
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps(),
): Promise<Array<{ id: string; name: string; title: string | null }>> {
  assertAdmin(context);
  return deps.serviceRepo.listAllTherapistsAdmin();
}

export async function addServiceImageAdmin(
  input: ServiceImageAddInput,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps()
): Promise<ServiceImage> {
  assertAdmin(context);
  return deps.serviceRepo.addServiceImage(input)
}

export async function deleteServiceImageAdmin(
  id: string,
  serviceId: string,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps()
): Promise<void> {
  assertAdmin(context);
  return deps.serviceRepo.deleteServiceImage(id)
}

export async function listServiceImagesAdmin(
  serviceId: string,
  context: AdminContext,
  deps: AdminDependencies = createDefaultDeps()
): Promise<ServiceImage[]> {
  assertAdmin(context);
  return deps.serviceRepo.listServiceImages(serviceId)
}
