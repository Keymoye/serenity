// tests/domain.test.ts
import { describe, it, expect } from "vitest";

import {
  bookingConfirmSchema,
} from "@/lib/domain/booking.types";
import {
  contactFormSchema,
  adminServiceSchema,
} from "@/lib/utils/validation";
import {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  InternalError,
} from "@/lib/domain/errors";

describe("domain layer – pure rules & schemas", () => {
  //
  // 1. validation schemas
  //
  describe("bookingConfirmSchema", () => {
    it("accepts a minimal valid payload", () => {
      const good = {
        serviceId: "svc_1",
        therapistId: "ther_1",
        timeSlotId: "slot_1",
      };
      expect(bookingConfirmSchema.parse(good)).toEqual(good);
    });

    it("rejects if any required field is missing or empty", () => {
      const cases = [
        {},
        { serviceId: "", therapistId: "x", timeSlotId: "x" },
        { serviceId: "x", therapistId: "", timeSlotId: "x" },
        { serviceId: "x", therapistId: "x", timeSlotId: "" },
      ];
      cases.forEach((c) => {
        expect(() => bookingConfirmSchema.parse(c)).toThrow();
      });
    });

    it("allows `notes` when present and enforces max length", () => {
      const ok = {
        serviceId: "s",
        therapistId: "t",
        timeSlotId: "u",
        notes: "hello",
      };
      expect(bookingConfirmSchema.parse(ok).notes).toBe("hello");

      const long = { ...ok, notes: "a".repeat(1001) };
      expect(() => bookingConfirmSchema.parse(long)).toThrow(/1000/);
    });
  });

  describe("contactFormSchema", () => {
    it("validates required strings and length bounds", () => {
      const good = {
        fullName: "Jane Doe",
        email: "jane@example.com",
        subject: "Hello",
        message: "This is a valid message.",
      };
      expect(contactFormSchema.parse(good)).toMatchObject(good);
    });

    it("fails on invalid email or too‑short message", () => {
      expect(() =>
        contactFormSchema.parse({ fullName: "A", email: "bad", subject: "x", message: "short" })
      ).toThrow();
    });
  });

  describe("adminServiceSchema", () => {
    it("allows a reasonable service record", () => {
      const svc = {
        name: "Massage",
        duration_minutes: 60,
        price: 100,
      };
      expect(adminServiceSchema.parse(svc)).toMatchObject(svc);
    });

    it("rejects out‑of‑range numbers", () => {
      expect(() =>
        adminServiceSchema.parse({ name: "x", duration_minutes: 1, price: -5 })
      ).toThrow();
    });
  });

  //
  // 2. error‑class behaviour
  //
  describe("DomainError classes", () => {
    it("DomainError stores code, message, details and sets name", () => {
      const e = new DomainError("CODE", "msg", { foo: "bar" });
      expect(e.code).toBe("CODE");
      expect(e.message).toBe("msg");
      expect(e.details).toEqual({ foo: "bar" });
      expect(e.name).toBe("DomainError");
    });

    it("specialised errors carry expected codes/names", () => {
      expect(new ValidationError("v").code).toBe("VALIDATION_ERROR");
      expect(new NotFoundError("n").name).toBe("NotFoundError");
      expect(new ConflictError("C", "m").code).toBe("C");
      expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
      expect(new InternalError().code).toBe("INTERNAL_ERROR");
    });

    it("details propagate through subclasses", () => {
      const d = { x: 1 };
      const e = new ValidationError("bad", d);
      expect(e.details).toBe(d);
    });
  });
});
