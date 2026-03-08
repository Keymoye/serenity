"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

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
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await apiFetch("/api/admin/messages");
      setMessages((body ?? []) as MessageRow[]);
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const toggleRead = async (msg: MessageRow) => {
    setToggling(msg.id);
    try {
      await apiFetch("/api/admin/messages", {
        method: "PUT",
        body: JSON.stringify({ id: msg.id, is_read: !msg.is_read }),
      });
      await loadMessages();
    } catch {
      setError("Failed to update message status");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-700">View and track inquiries from your contact form.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="px-4 py-4 text-center"><Spinner /></p>
        ) : error ? (
          <p className="px-4 py-4 text-sm text-red-600">{error}</p>
        ) : messages.length === 0 ? (
          <div className="px-4 py-4 text-sm text-slate-600">No messages received yet.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {messages.map((msg) => (
              <li key={msg.id} className="flex flex-col gap-2 px-4 py-3 text-sm text-slate-800 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{msg.full_name}</span>
                    <span className="text-xs text-slate-500">&lt;{msg.email}&gt;</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-700">{msg.subject}</p>
                  <p className="mt-1 text-xs text-slate-700 line-clamp-3">{msg.message}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{new Date(msg.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${msg.is_read ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{msg.is_read ? "Read" : "New"}</span>
                  <button type="button" onClick={() => toggleRead(msg)} disabled={toggling === msg.id} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    {toggling === msg.id ? <Spinner /> : `Mark as ${msg.is_read ? "unread" : "read"}`}
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
