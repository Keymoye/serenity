import type { ScheduleItem } from "../../db/schedule";
import { getSupabaseServerClient } from "./client";

export interface ScheduleRepository {
  listSchedule(): Promise<ScheduleItem[]>;
  createSchedule(payload: ScheduleItem): Promise<ScheduleItem>;
  updateSchedule(
    id: string,
    payload: Partial<ScheduleItem>,
  ): Promise<ScheduleItem>;
  deleteSchedule(id: string): Promise<void>;
}

export function createScheduleRepository(): ScheduleRepository {
  return {
    async listSchedule() {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScheduleItem[];
    },

    async createSchedule(payload: ScheduleItem): Promise<ScheduleItem> {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("schedules")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as ScheduleItem;
    },

    async updateSchedule(
      id: string,
      payload: Partial<ScheduleItem>,
    ): Promise<ScheduleItem> {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("schedules")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as ScheduleItem;
    },

    async deleteSchedule(id: string): Promise<void> {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

