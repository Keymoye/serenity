import { getSupabaseUserClient } from "./userClient";
import { getSupabaseAdminClient } from "./adminClient";

export interface MessageRepository {
  countMessagesFromIpSince(ip: string, sinceIso: string): Promise<number>;
  insertContactMessage(payload: {
    full_name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    ip_address: string;
  }): Promise<void>;
  listMessages(): Promise<
    Array<{
      id: string;
      full_name: string;
      email: string;
      subject: string;
      message: string;
      is_read: boolean | null;
      created_at: string;
    }>
  >;
  setMessageRead(messageId: string, isRead: boolean): Promise<void>;
  countUnreadMessages(): Promise<number>;
}

export function createMessageRepository(): MessageRepository {
  return {
    async countMessagesFromIpSince(ip, sinceIso) {
      const supabase = await getSupabaseUserClient();
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", sinceIso);
      if (error) throw error;
      return count ?? 0;
    },

    async insertContactMessage(payload) {
      const supabase = await getSupabaseUserClient();
      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;
    },

    async listMessages() {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id, full_name, email, subject, message, is_read, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        full_name: string;
        email: string;
        subject: string;
        message: string;
        is_read: boolean;
        created_at: string;
      }>;
    },

    async setMessageRead(messageId, isRead) {
      const supabase = await getSupabaseAdminClient();
      const { error } = await supabase
        .from("messages")
        .update({ is_read: isRead })
        .eq("id", messageId);
      if (error) throw error;
    },

    async countUnreadMessages() {
      const supabase = await getSupabaseAdminClient();
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  };
}

