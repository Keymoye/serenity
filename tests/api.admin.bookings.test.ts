// tests/api.admin.bookings.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/bookings/route";

vi.mock("@/lib/infra/supabase/currentUser", () => {
  return { getCurrentUser: vi.fn() };
});
vi.mock("@/lib/application/admin.service", () => {
  return { listAdminBookingRows: vi.fn() };
});

import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { listAdminBookingRows } from "@/lib/application/admin.service";

function makeRequest(url: string) {
  return new Request(url, {
    method: "GET",
  });
}

describe("API layer – admin bookings GET with filters", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost"));
    expect(res.status).toBe(401);
  });

  it("applies date filters and pagination correctly", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "u" }, profile: { role: "admin" } });
    const sample = [
      { id: "1", customer_name: "A", status: "pending", created_at: "2026-03-01T00:00:00Z" },
      { id: "2", customer_name: "B", status: "pending", created_at: "2026-03-05T00:00:00Z" },
      { id: "3", customer_name: "C", status: "pending", created_at: "2026-03-10T00:00:00Z" },
    ];
    (listAdminBookingRows as ReturnType<typeof vi.fn>).mockResolvedValue(sample);

    // filter startDate -> should include rows with date >= 2026-03-05
    let res = await GET(makeRequest("http://localhost?startDate=2026-03-05"));
    expect(res.status).toBe(200);
    let json = await res.json();
    expect(json).toEqual([sample[1], sample[2]]);

    // filter endDate -> <= 2026-03-05
    res = await GET(makeRequest("http://localhost?endDate=2026-03-05"));
    json = await res.json();
    expect(json).toEqual([sample[0], sample[1]]);

    // pagination with limit/offset works after filtering
    res = await GET(makeRequest("http://localhost?startDate=2026-03-01&limit=1&offset=1"));
    json = await res.json();
    // first filter leaves all three, then slice offset 1 limit1 -> second item
    expect(json).toEqual([sample[1]]);
  });
});
