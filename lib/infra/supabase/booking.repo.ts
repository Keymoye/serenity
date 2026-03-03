import type { Booking } from "../../domain/booking.types";
import { getSupabaseUserClient } from "./userClient";
import { getSupabaseAdminClient } from "./adminClient";

export interface BookingRepository {
  listBookings(): Promise<Booking[]>;
  listAdminBookingRows(): Promise<
    Array<{
      id: string;
      customer_name: string;
      status: string;
      created_at: string | null;
    }>
  >;
  countBookingsSince(sinceIso: string): Promise<number>;
  countConfirmedBookingsWithSlotBetween(startIso: string, endIso: string): Promise<number>;
  listCustomerBookingRows(profileId: string): Promise<
    Array<{
      id: string;
      status: string;
      reference_code: string | null;
      notes: string | null;
      time_slots: { start_time: string }[] | null;
      services: { name: string }[] | null;
      therapists: { name: string }[] | null;
    }>
  >;
  findBookingIdByTimeSlotId(timeSlotId: string): Promise<string | null>;
  createBooking(payload: Omit<Booking, "id" | "created_at">): Promise<Booking>;
  updateBooking(
    id: string,
    payload: Partial<Omit<Booking, "id" | "created_at">>,
  ): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
}

export function createBookingRepository(): BookingRepository {
  return {
    async listBookings() {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },

    async listAdminBookingRows() {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, created_at, profiles(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      type Raw = {
        id: string;
        status: string | null;
        created_at: string | null;
        profiles: { name: string | null }[] | null;
      };

      const rows = (data ?? []) as unknown as Raw[];
      return rows.map((r) => ({
        id: r.id,
        customer_name: r.profiles?.[0]?.name ?? "—",
        status: r.status ?? "pending",
        created_at: r.created_at,
      }));
    },

    async countBookingsSince(sinceIso: string) {
      const supabase = await getSupabaseAdminClient();
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceIso);
      if (error) throw error;
      return count ?? 0;
    },

    async countConfirmedBookingsWithSlotBetween(startIso: string, endIso: string) {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("id, time_slots(start_time), status")
        .eq("status", "confirmed")
        .gte("time_slots.start_time", startIso)
        .lte("time_slots.start_time", endIso);
      if (error) throw error;

      type Row = { id: string; time_slots?: { start_time?: string } };
      const rows = (data ?? []) as unknown as Row[];
      return rows.filter((r) => Boolean(r.time_slots && r.time_slots.start_time)).length;
    },

    async listCustomerBookingRows(profileId: string) {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, reference_code, notes, time_slots(start_time), services(name), therapists(name)",
        )
        .eq("customer_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },

    async findBookingIdByTimeSlotId(timeSlotId: string) {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("time_slot_id", timeSlotId)
        .maybeSingle();
      if (error) throw error;
      return (data?.id as string | undefined) ?? null;
    },

    async createBooking(
      payload: Omit<Booking, "id" | "created_at">,
    ): Promise<Booking> {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as Booking;
    },

    async updateBooking(
      id: string,
      payload: Partial<Omit<Booking, "id" | "created_at">>,
    ): Promise<Booking> {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Booking;
    },

    async deleteBooking(id: string): Promise<void> {
      const supabase = await getSupabaseAdminClient();
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

