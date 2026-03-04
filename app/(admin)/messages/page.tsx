"use client";

import React, { useEffect, useState } from "react";
type MessageRow = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean | null;
  created_at: string;
};
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { pushToast } from "@/components/ui/Toast";

export default function AdminMessagesPage() {
  const [items, setItems] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/messages');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!mounted) return;
        setItems(body ?? []);
      } catch (err) {
        console.error(err);
        setError('Failed to load messages');
        pushToast('error', 'Failed to load messages');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleRead = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch('/api/admin/messages', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_read: !current }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: !current } : m)));
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to update message');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = (id: string) => { setDeletingId(id); setConfirmOpen(true); };

  const doDelete = async () => {
    if (!deletingId) return setConfirmOpen(false);
    const id = deletingId;
    setConfirmOpen(false);
    try {
      const res = await fetch(`/api/admin/messages?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((m) => m.id !== id));
      pushToast('success', 'Message deleted');
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-700">Customer messages and contact requests.</p>
      </header>

      <section>
        {loading ? (
          <div className="space-y-2">
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState title="No messages" message="No messages available." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">From</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-left">Received</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((m) => (
                  <tr key={m.id} className={`${m.is_read ? '' : 'font-medium'}`}>
                    <td className="px-3 py-2">{m.full_name ?? '—'}</td>
                    <td className="px-3 py-2">{m.email ?? '—'}</td>
                    <td className="px-3 py-2">{m.subject ?? '—'}</td>
                    <td className="px-3 py-2">{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleRead(m.id, Boolean(m.is_read))} disabled={togglingId === m.id} className="text-sky-600">{m.is_read ? 'Mark unread' : 'Mark read'}</button>
                        <a href={`/admin/messages/${m.id}`} className="text-slate-600">View</a>
                        <button onClick={() => confirmDelete(m.id)} className="text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog open={confirmOpen} title="Delete message" description="Are you sure you want to delete this message?" onCancel={() => setConfirmOpen(false)} onConfirm={doDelete} />
      </section>
    </div>
  );
}
