import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  confirmBooking,
  getAvailability,
  listCustomerBookings,
  lockSlot,
} from "@/lib/application/booking.service";
import { ConflictError, ValidationError } from "@/lib/domain/errors";

function createDeps(overrides: Partial<any> = {}): any {
  return {
    timeSlotRepo: {
      findForTherapistOnDate: vi.fn().mockResolvedValue([]),
      lockSlot: vi.fn().mockResolvedValue(true),
      tryMarkAsBooked: vi.fn().mockResolvedValue(true),
      setAvailable: vi.fn().mockResolvedValue(undefined),
      // stubs for newer TimeSlotRepository surface
      findById: vi.fn(),
      listTimeSlots: vi.fn(),
      createTimeSlot: vi.fn(),
      deleteTimeSlot: vi.fn(),
    },
    bookingRepo: {
      createBooking: vi.fn().mockResolvedValue({ id: "b1" }),
      listCustomerBookingRows: vi.fn().mockResolvedValue([]),
    },
    serviceRepo: {
      isTherapistAssignedToService: vi.fn().mockResolvedValue(true),
    },
    ...overrides,
  };
}

describe("booking.service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lockSlot throws ValidationError when missing timeSlotId", async () => {
    const deps = createDeps();
    await expect(
      lockSlot({ timeSlotId: "" }, { userId: "u1", customerProfileId: "p1" }, deps),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("lockSlot throws ConflictError SLOT_TAKEN when repo can't lock", async () => {
    const deps = createDeps({
      timeSlotRepo: {
        ...createDeps().timeSlotRepo,
        lockSlot: vi.fn().mockResolvedValue(false),
      },
    });

    await expect(
      lockSlot(
        { timeSlotId: "ts1" },
        { userId: "u1", customerProfileId: "p1" },
        deps,
      ),
    ).rejects.toMatchObject({ code: "SLOT_TAKEN" });
  });

  it("confirmBooking gates with atomic slot update", async () => {
    const deps = createDeps({
      timeSlotRepo: {
        ...createDeps().timeSlotRepo,
        tryMarkAsBooked: vi.fn().mockResolvedValue(false),
      },
    });

    await expect(
      confirmBooking(
        { serviceId: "s1", therapistId: "t1", timeSlotId: "ts1", notes: "" },
        { userId: "u1", customerProfileId: "p1" },
        deps,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("confirmBooking rolls back slot availability when insert fails", async () => {
    const deps = createDeps({
      bookingRepo: {
        ...createDeps().bookingRepo,
        createBooking: vi.fn().mockRejectedValue(new Error("db down")),
      },
    });

    await expect(
      confirmBooking(
        { serviceId: "s1", therapistId: "t1", timeSlotId: "ts1", notes: "" },
        { userId: "u1", customerProfileId: "p1" },
        deps,
      ),
    ).rejects.toMatchObject({ code: "INSERT_FAILED" });

    expect(deps.timeSlotRepo.setAvailable).toHaveBeenCalledWith("ts1");
  });

  it("getAvailability filters by availability and lock expiry", async () => {
    const deps = createDeps({
      serviceRepo: {
        isTherapistAssignedToService: vi.fn().mockResolvedValue(true),
      },
      timeSlotRepo: {
        ...createDeps().timeSlotRepo,
        findForTherapistOnDate: vi.fn().mockResolvedValue([
          {
            id: "a",
            therapist_id: "t1",
            start_time: "2026-03-03T10:00:00.000Z",
            end_time: "2026-03-03T11:00:00.000Z",
            is_available: true,
            locked_until: null,
          },
          {
            id: "b",
            therapist_id: "t1",
            start_time: "2026-03-03T11:00:00.000Z",
            end_time: "2026-03-03T12:00:00.000Z",
            is_available: true,
            locked_until: "2026-03-03T12:30:00.000Z",
          },
          {
            id: "c",
            therapist_id: "t1",
            start_time: "2026-03-03T12:00:00.000Z",
            end_time: "2026-03-03T13:00:00.000Z",
            is_available: false,
            locked_until: null,
          },
        ]),
      },
    });

    const slots = await getAvailability(
      { serviceId: "s1", therapistId: "t1", date: "2026-03-03" },
      deps,
    );

    // slot b is locked into the future (not bookable); slot c is not available
    expect(slots.map((s) => s.id)).toEqual(["a"]);
  });

  it("getAvailability throws THERAPIST_NOT_ASSIGNED when therapist not linked", async () => {
    const deps = createDeps({
      serviceRepo: {
        isTherapistAssignedToService: vi.fn().mockResolvedValue(false),
      },
    });

    await expect(
      getAvailability({ serviceId: "s1", therapistId: "t1", date: "2026-03-03" }, deps),
    ).rejects.toMatchObject({ code: "THERAPIST_NOT_ASSIGNED" });
  });

  it("listCustomerBookings calls repository with profile id", async () => {
    const deps = createDeps();
    await listCustomerBookings({ userId: "u1", customerProfileId: "p1" }, deps);
    expect(deps.bookingRepo.listCustomerBookingRows).toHaveBeenCalledWith("p1");
  });
});

