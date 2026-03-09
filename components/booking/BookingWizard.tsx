"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPicker } from "./CalendarPicker";
import { logger } from "@/lib/utils/logger";
import type { BookingConfirmInput } from "@/lib/utils/validation";
import { apiFetch, postJson } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";
import { pushToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 0 | 1 | 2 | 3;

type Service = {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  first_image_url: string | null;
};

type Therapist = {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
};

type TimeSlot = {
  id: string;
  start_time: string;
  end_time: string;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingWizardProps {
  /** Pre-select a service when the wizard mounts. */
  initialServiceId?: string;
  /** Pre-select a therapist once their service's therapist list is loaded. */
  initialTherapistId?: string;
}

// ─── Step labels ─────────────────────────────────────────────────────────────

const STEP_LABELS = ["Service", "Therapist", "Date & time", "Review"] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function BookingWizard({
  initialServiceId,
  initialTherapistId,
}: BookingWizardProps) {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<WizardStep>(0);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialServiceId ?? null
  );
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(
    null
  );
  const [initialTherapistSet, setInitialTherapistSet] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(
    null
  );
  const [notes, setNotes] = useState("");

  // Loading / error
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockExpiry, setLockExpiry] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const currentService =
    services.find((s) => s.id === selectedServiceId) ?? null;
  const currentTherapist =
    therapists.find((t) => t.id === selectedTherapistId) ?? null;
  const currentSlot =
    slots.find((s) => s.id === selectedTimeSlotId) ?? null;

  // ── Data fetching ────────────────────────────────────────────────────────────

  /** Load active services on mount via API layer. */
  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      setError(null);
      try {
        const data = await apiFetch<Service[]>("/api/services");
        setServices(data);
      } catch (err: unknown) {
        logger.error("Failed to load booking services", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load services. Please try again."
        );
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  /** Reload therapists whenever the selected service changes. */
  useEffect(() => {
    if (!selectedServiceId) {
      setTherapists([]);
      return;
    }

    const loadTherapists = async () => {
      setLoadingTherapists(true);
      setError(null);
      try {
        const therapistsList = await apiFetch<Therapist[]>(
          `/api/services/${encodeURIComponent(selectedServiceId)}/therapists`
        );
        setTherapists(therapistsList);

        // Honor initialTherapistId on first load if it matches this service.
        if (
          initialTherapistId &&
          !initialTherapistSet &&
          therapistsList.some((t) => t.id === initialTherapistId)
        ) {
          setSelectedTherapistId(initialTherapistId);
          setInitialTherapistSet(true);
        } else {
          setSelectedTherapistId(therapistsList[0]?.id ?? null);
        }
      } catch (err: unknown) {
        logger.error("Failed to load therapists for service", err, {
          selectedServiceId,
        });
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load therapists. Please try again."
        );
      } finally {
        setLoadingTherapists(false);
      }
    };

    loadTherapists();
  }, [selectedServiceId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Reload time slots whenever service / therapist / date changes. */
  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        const payload: Record<string, unknown> = { serviceId: selectedServiceId, date: selectedDate };
        if (selectedTherapistId && selectedTherapistId !== "ANY") payload.therapistId = selectedTherapistId;
        const data = await postJson<{ slots: TimeSlot[] }>("/api/booking/availability", payload);
        setSlots(data.slots);
      } catch (err: unknown) {
        logger.error("Failed to load availability", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load availability. Please try again."
        );
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedServiceId, selectedTherapistId, selectedDate]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goNext = () => {
    setError(null);
    setStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev));
  };

  const goBack = () => {
    setError(null);
    setStep((prev) => (prev > 0 ? ((prev - 1) as WizardStep) : prev));
  };

  // ── Selection helpers ────────────────────────────────────────────────────────

  const selectService = (id: string) => {
    setSelectedServiceId(id);
    setSelectedTherapistId(null);
    setSelectedTimeSlotId(null);
  };

  /** Lock a time slot via the API, then record the selection. */
  const handleSelectSlot = async (slotId: string) => {
    setError(null);
    setSelectedTimeSlotId(null);
    setLockExpiry(null);
    try {
      await postJson("/api/booking/lock", { timeSlotId: slotId });
      setSelectedTimeSlotId(slotId);
      const expiry = Date.now() + 15 * 60 * 1000;
      setLockExpiry(expiry);
      setRemainingSeconds(Math.ceil((expiry - Date.now()) / 1000));
      pushToast("success", "Time slot locked for 15 minutes");
    } catch (err: unknown) {
      logger.warn("Slot lock failed", { error: String(err) });

      const bodyCode = (err as { body?: { code?: unknown } } | null)?.body?.code;
      if (bodyCode === "SLOT_TAKEN") {
        pushToast("error", "This time slot was just taken. Please choose another slot.");
        setError("This time slot was just taken. Please choose another slot.");
      } else {
        const message = err instanceof Error ? err.message : "Unable to lock this time slot. Please try again.";
        pushToast("error", message);
        setError(message);
      }

      // Trigger slot refresh in any listening components.
      window.dispatchEvent(new Event("refreshSlots"));
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (!lockExpiry) {
      setRemainingSeconds(null);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((lockExpiry - Date.now()) / 1000));
      setRemainingSeconds(rem);
      if (rem <= 0) {
        // Clear lock, return user to slot picker, notify, and refresh availability
        setLockExpiry(null);
        setSelectedTimeSlotId(null);
        setStep(2);
        pushToast("error", "Your held slot expired — please choose a new time.");
        window.dispatchEvent(new Event("refreshSlots"));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockExpiry]);

  /** Confirm the booking via the API and redirect on success. */
  const handleConfirm = async () => {
    if (!selectedServiceId || !selectedTherapistId || !selectedTimeSlotId) {
      setError("Please complete all steps before confirming.");
      return;
    }

    const payload: BookingConfirmInput = {
      serviceId: selectedServiceId,
      therapistId: selectedTherapistId,
      timeSlotId: selectedTimeSlotId,
      notes,
    };

    setSubmitting(true);
    setError(null);

    try {
      await postJson("/api/booking/confirm", payload);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      logger.error("Booking confirmation failed", err);
      const bodyCode = (err as { body?: { code?: unknown } } | null)?.body?.code;
      if (bodyCode === "SLOT_TAKEN" || bodyCode === "SLOT_ALREADY_BOOKED") {
        setError("The selected time slot is no longer available. Please choose another slot.");
        pushToast("error", "The selected time slot is no longer available.");
        // return to slot picker
        setStep(2);
        setSelectedTimeSlotId(null);
        setLockExpiry(null);
        window.dispatchEvent(new Event("refreshSlots"));
      } else {
        const msg = err instanceof Error ? err.message : "Unable to confirm booking. Please try again.";
        setError(msg);
        pushToast("error", msg);
      }
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

      {/* ── Step indicator ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors duration-200 ${
                  step === i
                    ? "border-sky-600 bg-sky-600 text-white"
                    : step > i
                    ? "border-sky-600 bg-white text-sky-600"
                    : "border-slate-300 bg-white text-slate-500"
                }`}
              >
                {i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors duration-200 ${
                    step > i ? "bg-sky-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          {STEP_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Step content ───────────────────────────────────────────────────── */}
      <div key={step} className="transition-opacity duration-300">

        {/* Step 0 — Service selection */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Choose a service
            </h2>
            {loadingServices ? (
              <div className="flex items-center gap-2">
                <Spinner size={5} />
                <span className="text-sm text-slate-600">
                  Loading services…
                </span>
              </div>
            ) : services.length === 0 ? (
              <p className="text-sm text-slate-600">
                No services are currently available to book.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => selectService(service.id)}
                      className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "border-sky-600 bg-sky-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-medium text-slate-900">
                        {service.name}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        {service.duration_minutes
                          ? `${service.duration_minutes} minutes`
                          : "Custom duration"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Therapist selection */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Choose a therapist
            </h2>
            {loadingTherapists ? (
              <div className="flex items-center gap-2">
                <Spinner size={5} />
                <span className="text-sm text-slate-600">
                  Loading therapists…
                </span>
              </div>
            ) : therapists.length === 0 ? (
              <p className="text-sm text-slate-600">
                There are no therapists assigned to this service yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedTherapistId("ANY")}
                    className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left text-sm transition ${selectedTherapistId === "ANY" ? "border-sky-600 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <span className="font-medium text-slate-900">Any available</span>
                    <span className="mt-1 text-xs text-slate-500">Match any available therapist</span>
                  </button>
                </div>
                {therapists.map((therapist) => {
                  const isSelected = selectedTherapistId === therapist.id;
                  return (
                    <button
                      key={therapist.id}
                      type="button"
                      onClick={() => setSelectedTherapistId(therapist.id)}
                      className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "border-sky-600 bg-sky-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Avatar
                        src={therapist.photo_url}
                        name={therapist.name}
                        size="sm"
                      />
                      <span className="font-medium text-slate-900">
                        {therapist.name}
                      </span>
                      {therapist.title && (
                        <span className="mt-1 text-xs text-slate-500">
                          {therapist.title}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Date & time selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Choose a date
              </h2>
              <div className="flex flex-col items-start gap-2">
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(new Date().toISOString().slice(0, 10))
                  }
                  className="text-xs text-slate-500 hover:underline"
                >
                  Jump to today
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Available time slots
              </h3>
              {loadingSlots ? (
                <div className="flex items-center gap-2">
                  <Spinner size={5} />
                  <span className="text-sm text-slate-600">
                    Loading availability…
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No available slots for this date. Try another day.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedTimeSlotId === slot.id;
                    const label = new Date(slot.start_time).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    );
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleSelectSlot(slot.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          isSelected
                            ? "border-sky-600 bg-sky-50 text-sky-700"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedTimeSlotId && remainingSeconds !== null && (
                <p className="text-xs text-slate-600 mt-2">Locked for: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Review & confirm */}
        {step === 3 && (
          <div className="space-y-4">
            {remainingSeconds !== null && (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                Your slot is held for {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')} — complete your booking before it expires.
              </div>
            )}
            <h2 className="text-sm font-semibold text-slate-900">
              Review your booking
            </h2>

            <dl className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 [&_dt]:font-semibold">
              <div className="flex gap-1">
                <dt>Service:</dt>
                <dd>{currentService?.name ?? "Not selected"}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Therapist:</dt>
                <dd>{currentTherapist?.name ?? "Not selected"}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Date:</dt>
                <dd>{selectedDate || "Not selected"}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Time:</dt>
                <dd>
                  {currentSlot
                    ? new Date(currentSlot.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not selected"}
                </dd>
              </div>
            </dl>

            <div className="space-y-1">
              <label
                htmlFor="notes"
                className="block text-xs font-medium uppercase tracking-wide text-slate-600"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Add preferences or areas of focus for your therapist."
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation footer ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        <div className="flex items-center gap-2">
          {step < 3 && (
            <button
              type="button"
              onClick={goNext}
              disabled={
                (step === 0 && !selectedServiceId) ||
                (step === 1 && !selectedTherapistId) ||
                (step === 2 && !selectedTimeSlotId)
              }
              className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              Next
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submitting ? (
                <>
                  <Spinner size={4} />
                  Confirming…
                </>
              ) : (
                "Confirm booking"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
