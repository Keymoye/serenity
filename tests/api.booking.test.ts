// tests/api.booking.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST as availabilityPOST } from "@/app/api/booking/availability/route";
import { POST as lockPOST } from "@/app/api/booking/lock/route";
import { POST as confirmPOST } from "@/app/api/booking/confirm/route";
import { NextResponse } from "next/server";
import { ValidationError, ConflictError } from "@/lib/domain/errors";

// mocks
vi.mock("@/lib/infra/supabase/currentUser", () => {
  return { getCurrentUser: vi.fn() };
});

vi.mock("@/lib/application/booking.service", () => {
  return {
    getAvailability: vi.fn(),
    lockSlot: vi.fn(),
    confirmBooking: vi.fn(),
  };
});

import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { getAvailability, lockSlot, confirmBooking } from "@/lib/application/booking.service";

function makeRequest(body: any) {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API layer – booking routes with mocked services", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- availability ---
  describe("POST /api/booking/availability", () => {
    it("returns slots when service succeeds", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue({ user: { id: "u1" }, profile: { id: "p1" } });
      (getAvailability as vi.Mock<any>).mockResolvedValue([{ id: "1" }]);

      const res = await availabilityPOST(makeRequest({ serviceId: "s", therapistId: "t", date: "2026-03-03" }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ slots: [{ id: "1" }] });
    });

    it("returns 401 when user is unauthorized", async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);
      const res = await availabilityPOST(makeRequest({}));
      expect(res.status).toBe(401);
    });

    it("maps service ValidationError to 400", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue({ user: { id: "u" }, profile: { id: "p" } });
      (getAvailability as vi.Mock<any>).mockRejectedValue(new ValidationError("bad"));
      const res = await availabilityPOST(makeRequest({ serviceId: "", therapistId: "" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });

  // --- lock ---
  describe("POST /api/booking/lock", () => {
    it("responds success when lockSlot resolves", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue({ user: { id: "u" }, profile: { id: "p" } });
      (lockSlot as vi.Mock<any>).mockResolvedValue(undefined);
      const res = await lockPOST(makeRequest({ timeSlotId: "ts1" }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ success: true });
    });

    it("maps service ConflictError to 409", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue({ user: { id: "u" }, profile: { id: "p" } });
      (lockSlot as vi.Mock<any>).mockRejectedValue(new ConflictError("SLOT_TAKEN"));
      const res = await lockPOST(makeRequest({ timeSlotId: "ts1" }));
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("SLOT_TAKEN");
    });

    it("returns 401 when unauthenticated", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue(null);
      const res = await lockPOST(makeRequest({ timeSlotId: "ts1" }));
      expect(res.status).toBe(401);
    });
  });

  // --- confirm ---
  describe("POST /api/booking/confirm", () => {
    it("validates body and returns booking when service succeeds", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue({ user: { id: "u" }, profile: { id: "p" } });
      (confirmBooking as vi.Mock<any>).mockResolvedValue({ booking: { id: "b" }, referenceCode: "XYZ" });
      const res = await confirmPOST(makeRequest({ serviceId: "s", therapistId: "t", timeSlotId: "ts" }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.booking).toEqual({ id: "b" });
      expect(json.referenceCode).toBe("XYZ");
    });

    it("returns 400 when body fails Zod validation", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue({ user: { id: "u" }, profile: { id: "p" } });
      const res = await confirmPOST(makeRequest({ serviceId: "" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    it("maps service error to status", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue({ user: { id: "u" }, profile: { id: "p" } });
      (confirmBooking as vi.Mock<any>).mockRejectedValue(new ConflictError("SLOT_ALREADY_BOOKED"));
      const res = await confirmPOST(makeRequest({ serviceId: "s", therapistId: "t", timeSlotId: "ts" }));
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("SLOT_ALREADY_BOOKED");
    });

    it("returns 401 when unauthenticated", async () => {
      (getCurrentUser as vi.Mock<any>).mockResolvedValue(null);
      const res = await confirmPOST(makeRequest({ serviceId: "s" }));
      expect(res.status).toBe(401);
    });
  });
});
