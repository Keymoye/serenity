import { getSupabaseAdminClient } from "./adminClient";

type ScheduleItem = {
  id: string;
  date: string;
  title?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

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
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScheduleItem[];
    },

    async createSchedule(payload: ScheduleItem): Promise<ScheduleItem> {
      const supabase = await getSupabaseAdminClient();
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
      const supabase = await getSupabaseAdminClient();
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
      const supabase = await getSupabaseAdminClient();
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

