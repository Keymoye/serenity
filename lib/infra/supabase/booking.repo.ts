import type { Booking } from "../../domain/booking.types";
import { getSupabaseUserClient } from "./userClient";
import { getSupabaseAdminClient } from "./adminClient";
import { ADMIN_BOOKING_LIMIT, CUSTOMER_BOOKING_LIMIT, BOOKING_STATUS } from "../../config/constants";

export interface BookingRepository {
  listBookings(): Promise<Booking[]>;
  listAdminBookingRows(): Promise<
    Array<{
      id: string;
      reference_code: string | null;
      customer_name: string | null;
      service_name: string | null;
      therapist_name: string | null;
      slot_start: string | null;
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
  findBookingById(bookingId: string): Promise<Booking | null>;
  findBookingIdByTimeSlotId(timeSlotId: string): Promise<string | null>;
  createBooking(payload: Omit<Booking, "id" | "created_at">): Promise<Booking>;
  updateBooking(
    id: string,
    payload: Partial<Omit<Booking, "id" | "created_at">>,
  ): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
  cancelCustomerBooking(bookingId: string, customerId: string): Promise<Booking | null>;
}

export function createBookingRepository(): BookingRepository {
  return {
    async listBookings() {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(ADMIN_BOOKING_LIMIT); // TODO: replace with cursor pagination when bookings exceed 500
      if (error) throw error;
      return (data ?? []) as Booking[];
    },

    async listAdminBookingRows() {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          reference_code,
          status,
          created_at,
          profiles!customer_id(name),
          services!service_id(name),
          therapists!therapist_id(name),
          time_slots!time_slot_id(start_time)
        `)
        .order("created_at", { ascending: false })
        .limit(ADMIN_BOOKING_LIMIT); // TODO: replace with cursor pagination when bookings exceed 500
      if (error) throw error;

      type Raw = {
        id: string;
        reference_code: string | null;
        status: string | null;
        created_at: string | null;
        profiles: { name: string | null } | null;
        services: { name: string | null } | null;
        therapists: { name: string | null } | null;
        time_slots: { start_time: string } | null;
      };

      const rows = (data ?? []) as unknown as Raw[];
      return rows.map((r) => ({
        id: r.id,
        reference_code: r.reference_code,
        customer_name: r.profiles?.name ?? null,
        service_name: r.services?.name ?? null,
        therapist_name: r.therapists?.name ?? null,
        slot_start: r.time_slots?.start_time ?? null,
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

      // Step 1: get time_slot IDs in range
      // NOTE: confirm column name is start_time or starts_at from Supabase dashboard
      const { data: slots, error: slotsError } =
        await supabase
          .from("time_slots")
          .select("id")
          .gte("start_time", startIso)
          .lte("start_time", endIso);

      if (slotsError) throw slotsError;
      if (!slots || slots.length === 0) return 0;

      const slotIds = slots.map((s) => s.id);

      // Step 2: count confirmed bookings with those slot IDs
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", BOOKING_STATUS.CONFIRMED)
        .in("time_slot_id", slotIds);

      if (error) throw error;
      return count ?? 0;
    },

    async listCustomerBookingRows(profileId: string) {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, reference_code, notes, time_slots(start_time), services(name), therapists(name)",
        )
        .eq("customer_id", profileId)
        .order("created_at", { ascending: false })
        .limit(CUSTOMER_BOOKING_LIMIT); // shows most recent 50 bookings per customer
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        status: string;
        reference_code: string | null;
        notes: string | null;
        time_slots: { start_time: string }[] | null;
        services: { name: string }[] | null;
        therapists: { name: string }[] | null;
      }>;
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

    async findBookingById(bookingId: string) {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return (data as Booking | null) ?? null;
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

    async cancelCustomerBooking(bookingId: string, customerId: string): Promise<Booking | null> {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: BOOKING_STATUS.CANCELLED })
        .eq("id", bookingId)
        .eq("customer_id", customerId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data as Booking | null) ?? null;
    },
  };
}

