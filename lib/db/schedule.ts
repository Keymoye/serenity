import { getServerSupabaseClient } from "../supabase/server";

export type ScheduleItem = {
  id?: string;
  therapist_id: string;
  date: string; // ISO date
  start_time: string;
  end_time: string;
  capacity?: number;
};

export async function listSchedule() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("schedules").select("*").order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScheduleItem[];
}

export async function createSchedule(payload: ScheduleItem) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("schedules").insert(payload).select().single();
  if (error) throw error;
  return data as ScheduleItem;
}

export async function updateSchedule(id: string, payload: Partial<ScheduleItem>) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("schedules").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as ScheduleItem;
}

export async function deleteSchedule(id: string) {
  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;
  return true;
}
