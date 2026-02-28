"use client";

import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";

type MessageRow = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean | null;
  created_at: string;
};

export default function AdminMessagesPage() {
  const supabase = getBrowserSupabaseClient();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, full_name, email, subject, message, is_read, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to load admin messages", error);
        return;
      }

      setMessages((data ?? []) as MessageRow[]);
    } catch (error) {
      logger.error("Unexpected error while loading admin messages", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const toggleRead = async (msg: MessageRow) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: !msg.is_read })
        .eq("id", msg.id);

      if (error) {
        logger.error("Failed to toggle message read state", error, {
          messageId: msg.id,
        });
        return;
      }

      await loadMessages();
    } catch (error) {
      logger.error("Unexpected error toggling message read state", error, {
        messageId: msg.id,
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Messages
        </h1>
        <p className="text-sm text-slate-700">
          View and track inquiries from your contact form.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="px-4 py-4 text-sm text-slate-600">
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-600">
            No messages received yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className="flex flex-col gap-2 px-4 py-3 text-sm text-slate-800 md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {msg.full_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      &lt;{msg.email}&gt;
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {msg.subject}
                  </p>
                  <p className="mt-1 text-xs text-slate-700 line-clamp-3">
                    {msg.message}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      msg.is_read
                        ? "bg-slate-100 text-slate-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {msg.is_read ? "Read" : "New"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRead(msg)}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Mark as {msg.is_read ? "unread" : "read"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

