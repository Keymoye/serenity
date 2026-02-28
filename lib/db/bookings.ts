import { getServerSupabaseClient } from "../supabase/server";

export type Booking = {
  id?: string;
  service_id: string;
  therapist_id?: string | null;
  date: string;
  time: string;
  customer_name: string;
  status?: string;
  created_at?: string;
};

export async function listBookings() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function createBooking(payload: Booking) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("bookings").insert(payload).select().single();
  if (error) throw error;
  return data as Booking;
}

export async function updateBooking(id: string, payload: Partial<Booking>) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("bookings").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as Booking;
}

export async function deleteBooking(id: string) {
  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw error;
  return true;
}
