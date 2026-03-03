import type { TimeSlot } from "../../domain/timeSlot.types";
import { getSupabaseServerClient } from "./client";

export interface TimeSlotRepository {
  findById(id: string): Promise<TimeSlot | null>;
  findForTherapistOnDate(therapistId: string, startOfDayIso: string, endOfDayIso: string): Promise<TimeSlot[]>;
  listTimeSlots(): Promise<TimeSlot[]>;
  createTimeSlot(payload: { therapist_id: string; start_time: string; end_time: string }): Promise<void>;
  lockSlot(timeSlotId: string, lockUntilIso: string, nowIso: string): Promise<boolean>;
  tryMarkAsBooked(timeSlotId: string): Promise<boolean>;
  setAvailable(timeSlotId: string): Promise<void>;
}

export function createTimeSlotRepository(): TimeSlotRepository {
  return {
    async findById(id) {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("time_slots")
        .select("id, therapist_id, start_time, end_time, is_available, locked_until")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as TimeSlot | null) ?? null;
    },

    async findForTherapistOnDate(therapistId, startOfDayIso, endOfDayIso) {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("time_slots")
        .select("id, therapist_id, start_time, end_time, is_available, locked_until")
        .eq("therapist_id", therapistId)
        .gte("start_time", startOfDayIso)
        .lte("start_time", endOfDayIso)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TimeSlot[];
    },

    async listTimeSlots() {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("time_slots")
        .select("id, therapist_id, start_time, end_time, is_available, locked_until")
        .order("start_time", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TimeSlot[];
    },

    async createTimeSlot(payload) {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase.from("time_slots").insert(payload);
      if (error) throw error;
    },

    async lockSlot(timeSlotId, lockUntilIso, nowIso) {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("time_slots")
        .update({
          locked_until: lockUntilIso,
        })
        .eq("id", timeSlotId)
        .eq("is_available", true)
        .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },

    async tryMarkAsBooked(timeSlotId) {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("time_slots")
        .update({ is_available: false })
        .eq("id", timeSlotId)
        .eq("is_available", true)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },

    async setAvailable(timeSlotId) {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase
        .from("time_slots")
        .update({ is_available: true })
        .eq("id", timeSlotId);
      if (error) throw error;
    },
  };
}

