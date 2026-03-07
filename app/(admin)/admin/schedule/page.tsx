"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/utils/api";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { pushToast } from "@/components/ui/Toast";
import type { TimeSlot } from "@/lib/domain/timeSlot.types";

interface Therapist {
  id: string;
  name: string;
}

export default function AdminSchedulePage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [therapistFilter, setTherapistFilter] = useState("all");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [therapistIdForm, setTherapistIdForm] = useState("");
  const [dateForm, setDateForm] = useState("");
  const [startTimeForm, setStartTimeForm] = useState("");
  const [endTimeForm, setEndTimeForm] = useState("");
  const [repeatForm, setRepeatForm] = useState("none");
  const [repeatUntilForm, setRepeatUntilForm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Load therapists and slots
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [thData, slData] = await Promise.all([
          apiFetch<Therapist[]>("/api/admin/therapists"),
          apiFetch<TimeSlot[]>("/api/admin/time-slots"),
        ]);
        setTherapists(thData ?? []);
        setSlots(slData ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load schedule");
        pushToast("error", "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter slots
  const filtered = React.useMemo(() => {
    return slots.filter((s) => {
      const startTime = new Date(s.start_time);
      if (fromDate && startTime < new Date(fromDate)) return false;
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (startTime > endOfDay) return false;
      }

      if (statusFilter === "available" && !s.is_available) return false;
      if (statusFilter === "booked" && s.is_available) return false;
      if (statusFilter === "locked" && !s.locked_until) return false;

      if (therapistFilter !== "all" && s.therapist_id !== therapistFilter) return false;

      return true;
    });
  }, [slots, fromDate, toDate, statusFilter, therapistFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setTherapistIdForm("");
    setDateForm("");
    setStartTimeForm("");
    setEndTimeForm("");
    setRepeatForm("none");
    setRepeatUntilForm("");
    setShowModal(true);
  };

  const openEditModal = (slot: TimeSlot) => {
    const startDate = new Date(slot.start_time);
    const startTime = startDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    const dateStr = startDate.toISOString().split("T")[0];
    const endDate = new Date(slot.end_time);
    const endTime = endDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

    setEditingId(slot.id);
    setTherapistIdForm(slot.therapist_id);
    setDateForm(dateStr);
    setStartTimeForm(startTime);
    setEndTimeForm(endTime);
    setRepeatForm("none");
    setRepeatUntilForm("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!therapistIdForm || !dateForm || !startTimeForm || !endTimeForm) {
      pushToast("error", "Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = `${dateForm}T${startTimeForm}`;
      const endDateTime = `${dateForm}T${endTimeForm}`;

      if (editingId) {
        // For simplicity, delete old and create new (or implement update in API)
        await apiFetch("/api/admin/time-slots", {
          method: "DELETE",
          body: JSON.stringify({ id: editingId }),
        });
      }

      await apiFetch("/api/admin/time-slots", {
        method: "POST",
        body: JSON.stringify({
          therapist_id: therapistIdForm,
          start_time: new Date(startDateTime).toISOString(),
          end_time: new Date(endDateTime).toISOString(),
        }),
      });

      setShowModal(false);
      const updated = await apiFetch<TimeSlot[]>("/api/admin/time-slots");
      setSlots(updated ?? []);
      pushToast("success", editingId ? "Slot updated" : "Slot created");
    } catch (err) {
      console.error(err);
      pushToast("error", "Failed to save slot");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setConfirmDeleteOpen(false);
    try {
      await apiFetch("/api/admin/time-slots", {
        method: "DELETE",
        body: JSON.stringify({ id: deletingId }),
      });
      setSlots((prev) => prev.filter((s) => s.id !== deletingId));
      pushToast("success", "Slot deleted");
    } catch (err) {
      console.error(err);
      pushToast("error", "Failed to delete slot");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatus = (slot: TimeSlot) => {
    if (slot.locked_until && new Date(slot.locked_until) > new Date()) return "locked";
    return slot.is_available ? "available" : "booked";
  };

  const getTherapistName = (therapistId: string) => {
    return therapists.find((t) => t.id === therapistId)?.name ?? therapistId;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Schedule</h1>
          <p className="text-sm text-slate-700">Manage therapist time slots.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          New Time Slot
        </button>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="locked">Locked</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Therapist</label>
            <select
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
              setStatusFilter("all");
              setTherapistFilter("all");
            }}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Clear filters
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No time slots" message="No slots match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Therapist</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-left">End</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{getTherapistName(slot.therapist_id)}</td>
                  <td className="px-4 py-3">{new Date(slot.start_time).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{new Date(slot.start_time).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-3">{new Date(slot.end_time).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-3">
                    <Badge
                      status={getStatus(slot) === "available" ? "confirmed" : getStatus(slot) === "booked" ? "pending" : "cancelled"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(slot)}
                      disabled={getStatus(slot) === "booked"}
                      title={getStatus(slot) === "booked" ? "Cannot edit booked slot" : ""}
                      className="text-sky-600 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(slot.id);
                        setConfirmDeleteOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit Time Slot" : "Create Time Slot"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Therapist *</label>
                <select
                  value={therapistIdForm}
                  onChange={(e) => setTherapistIdForm(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                >
                  <option value="">Select therapist</option>
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={dateForm}
                  onChange={(e) => setDateForm(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={startTimeForm}
                    onChange={(e) => setStartTimeForm(e.target.value)}
                    required
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={endTimeForm}
                    onChange={(e) => setEndTimeForm(e.target.value)}
                    required
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Repeat</label>
                <select
                  value={repeatForm}
                  onChange={(e) => setRepeatForm(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {(repeatForm === "daily" || repeatForm === "weekly") && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Repeat Until</label>
                  <input
                    type="date"
                    value={repeatUntilForm}
                    onChange={(e) => setRepeatUntilForm(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete time slot"
        description="Are you sure you want to delete this time slot?"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
