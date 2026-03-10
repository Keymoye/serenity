// tests/infra.repo.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// helper builder for fake supabase chain
function makeChain(result: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "select", "eq", "or", "update", "insert", "maybeSingle", "single", "order", "limit", "delete"];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  // final step needs to resolve to the result when awaited
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  chain.single = vi.fn().mockResolvedValue(result);
  return chain;
}

// Mock using the relative paths that repositories use
vi.mock("@/lib/infra/supabase/userClient");
vi.mock("@/lib/infra/supabase/adminClient");

import { getSupabaseAdminClient } from "@/lib/infra/supabase/adminClient";
import { createTimeSlotRepository } from "@/lib/infra/supabase/timeSlot.repo";
import { createBookingRepository } from "@/lib/infra/supabase/booking.repo";
import { createServiceRepository } from "@/lib/infra/supabase/service.repo";

describe("infrastructure repositories - query composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("timeSlotRepo.lockSlot calls try_lock_slot rpc", async () => {
  const fake = makeChain({ data: null, error: null });
  fake.rpc = vi.fn().mockResolvedValue({ data: true, error: null });
  (getSupabaseAdminClient as unknown).mockResolvedValue(fake);
  const repo = createTimeSlotRepository();

  const res = await repo.lockSlot("ts1", "lockUntil", "nowIso");
  expect(res).toBe(true);

  expect(fake.rpc).toHaveBeenCalledWith("try_lock_slot", {
    slot: "ts1",
    lock_until: "lockUntil",
    now_ts: "nowIso",
  });
});

  it("timeSlotRepo.tryMarkAsBooked updates only available slot", async () => {
    const fake = makeChain({ data: [{ id: "1" }], error: null });
    (getSupabaseAdminClient as unknown).mockResolvedValue(fake);
    const repo = createTimeSlotRepository();

    const success = await repo.tryMarkAsBooked("ts1");
    expect(success).toBe(true);
    expect(fake.from).toHaveBeenCalledWith("time_slots");
    expect(fake.update).toHaveBeenCalledWith({ is_available: false });
    expect(fake.eq).toHaveBeenCalledWith("id", "ts1");
    expect(fake.eq).toHaveBeenCalledWith("is_available", true);
  });

  it("bookingRepo.createBooking inserts record and selects single", async () => {
    const fake = makeChain({ data: { id: "b1" }, error: null });
    (getSupabaseAdminClient as unknown).mockResolvedValue(fake);
    const repo = createBookingRepository();

    const booking = await repo.createBooking({ customer_id: "c1" } as unknown);
    expect(booking).toEqual({ id: "b1" });
    expect(fake.from).toHaveBeenCalledWith("bookings");
    expect(fake.insert).toHaveBeenCalledWith({ customer_id: "c1" });
    expect(fake.select).toHaveBeenCalled();
    expect(fake.single).toHaveBeenCalled();
  });

  it("serviceRepo.isTherapistAssignedToService queries join table", async () => {
    const fake = makeChain({ data: { id: "row" }, error: null });
    (getSupabaseAdminClient as unknown).mockResolvedValue(fake);
    const repo = createServiceRepository();

    const assigned = await repo.isTherapistAssignedToService("svc", "ther");
    expect(assigned).toBe(true);
    expect(fake.from).toHaveBeenCalledWith("therapist_service");
    expect(fake.select).toHaveBeenCalledWith("id");
    expect(fake.eq).toHaveBeenCalledWith("service_id", "svc");
    expect(fake.eq).toHaveBeenCalledWith("therapist_id", "ther");
    expect(fake.maybeSingle).toHaveBeenCalled();
  });
});
