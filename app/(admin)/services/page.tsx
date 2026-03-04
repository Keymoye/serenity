"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { pushToast } from "@/components/ui/Toast";
import ServiceForm from "@/components/admin/ServiceForm";

export default function AdminServicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/services');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!mounted) return;
        setItems(body ?? []);
      } catch (err) {
        console.error(err);
        setError('Failed to load services');
        pushToast('error', 'Failed to load services');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setItems(body ?? []);
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to refresh services');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => { setDeletingId(id); setConfirmOpen(true); };

  const doDelete = async () => {
    if (!deletingId) return setConfirmOpen(false);
    const id = deletingId;
    setConfirmOpen(false);
    try {
      const res = await fetch(`/api/admin/services?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((p) => p.id !== id));
      pushToast('success', 'Service removed');
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to remove service');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: id, is_active: !current }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)));
      pushToast('success', 'Service status updated');
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to update service');
    } finally {
      setTogglingId(null);
    }
  };

  const openCreate = () => { setFormInitial(null); setShowForm(true); };
  const openEdit = (s: any) => { setFormInitial(s); setShowForm(true); };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Services</h1>
        <p className="text-sm text-slate-700">Manage services.</p>
      </header>

      <section>
        <div className="mb-3">
          <button onClick={openCreate} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">Add Service</button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState title="No services" message="No services found. Add one to get started." ctaLabel="Add service" onCta={() => openCreate()} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Duration</th>
                  <th className="px-3 py-2 text-left">Price</th>
                  <th className="px-3 py-2 text-left">Active</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.category ?? '—'}</td>
                    <td className="px-3 py-2">{s.duration_minutes ?? '—'}</td>
                    <td className="px-3 py-2">{s.price ?? '—'}</td>
                    <td className="px-3 py-2">
                      <button disabled={togglingId === s.id} onClick={() => toggleActive(s.id, Boolean(s.is_active))} className={`rounded px-2 py-1 text-sm ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {togglingId === s.id ? '...' : s.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="text-slate-600">Edit</button>
                        <button onClick={() => confirmDelete(s.id)} className="text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog open={confirmOpen} title="Delete service" description="Are you sure you want to delete this service?" onCancel={() => setConfirmOpen(false)} onConfirm={doDelete} />

        {showForm && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <div className="ml-auto w-full max-w-md bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{formInitial ? 'Edit Service' : 'Add Service'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-600">Close</button>
              </div>
              <div className="mt-4">
                <ServiceForm initial={formInitial} onSaved={() => { setShowForm(false); void refresh(); }} />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
