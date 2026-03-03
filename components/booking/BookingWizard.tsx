"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPicker } from "./CalendarPicker";
import { logger } from "@/lib/utils/logger";
import type { BookingConfirmInput } from "@/lib/utils/validation";
import { apiFetch, postJson } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

type WizardStep = 0 | 1 | 2 | 3;

type Service = {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
};

type Therapist = {
  id: string;
  name: string;
  title: string | null;
};

type TimeSlot = {
  id: string;
  start_time: string;
  end_time: string;
};

interface BookingWizardProps {
  initialServiceId?: string;
  initialTherapistId?: string;
}

export function BookingWizard({ initialServiceId }: BookingWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(0);
  const [services, setServices] = useState<Service[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialServiceId ?? null
  );
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(
    null
  );
  const [initialTherapistSet, setInitialTherapistSet] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(
    null
  );
  const [notes, setNotes] = useState<string>("");

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services once.
  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      setError(null);
      try {
        const data = await apiFetch<Service[]>("/api/services");
        setServices(data);
      } catch (err: unknown) {
        logger.error("Unexpected error while loading booking services", err);
        setError(err instanceof Error ? err.message : String(err) || "Unable to load services. Please try again.");
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  // Load therapists when service changes.
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
        // if caller passed initialTherapistId and matches
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
        logger.error("Unexpected error while loading therapists", err, {
          selectedServiceId,
        });
        setError(err instanceof Error ? err.message : String(err) || "Unable to load therapists. Please try again.");
      } finally {
        setLoadingTherapists(false);
      }
    };

    loadTherapists();
  }, [selectedServiceId]);

  // Load available time slots whenever service/therapist/date changes.
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedServiceId || !selectedTherapistId || !selectedDate) {
        setSlots([]);
        return;
      }

      setLoadingSlots(true);
      setError(null);
      try {
        const payload = {
          serviceId: selectedServiceId,
          therapistId: selectedTherapistId,
          date: selectedDate,
        };

        const data = await postJson<{ slots: TimeSlot[] }>(
          "/api/booking/availability",
          payload
        );

        setSlots(data.slots);
      } catch (err: unknown) {
        logger.error("Unexpected error while loading availability", err);
        setError(err instanceof Error ? err.message : String(err) || "Unable to load availability. Please try again.");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedServiceId, selectedTherapistId, selectedDate]);

  const currentService = services.find((s) => s.id === selectedServiceId) ?? null;
  const currentTherapist =
    therapists.find((t) => t.id === selectedTherapistId) ?? null;
  const currentSlot = slots.find((s) => s.id === selectedTimeSlotId) ?? null;

  const goNext = () => {
    setError(null);
    setStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev));
  };

  const goBack = () => {
    setError(null);
    setStep((prev) => (prev > 0 ? ((prev - 1) as WizardStep) : prev));
  };

  const selectService = (id: string) => {
    setSelectedServiceId(id);
    setSelectedTherapistId(null);
    setSelectedTimeSlotId(null);
  };

  const handleSelectSlot = async (slotId: string) => {
    setError(null);
    setSelectedTimeSlotId(null);

    try {
      await postJson("/api/booking/lock", { timeSlotId: slotId });
      setSelectedTimeSlotId(slotId);
    } catch (err: unknown) {
      logger.warn("Lock API failed", err);

      // Best-effort message extraction
      const bodyCode = (err as { body?: { code?: unknown } } | null)?.body?.code;
      if (bodyCode === "SLOT_TAKEN") {
        setError("This time slot was just taken. Please choose another slot.");
      } else {
        setError(err instanceof Error ? err.message : String(err) || "Unable to lock this time slot. Please try again.");
      }

      // Refresh slots.
      const event = new Event("refreshSlots");
      window.dispatchEvent(event);
    }
  };

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
      logger.error("Unexpected error during booking confirmation", err);
      setError(err instanceof Error ? err.message : String(err) || "Unable to confirm booking. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* progress indicator */}
      <div className="mb-6">
        <div className="flex items-center">
          {['Service','Therapist','Date & time','Review'].map((label, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors duration-200
                  ${step === i
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600'}`
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-200 ${
                    step > i ? 'bg-sky-600' : 'bg-slate-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-600">
          <span>Service</span>
          <span>Therapist</span>
          <span>Date & time</span>
          <span>Review</span>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step content with fade */}
      <div key={step} className="transition-opacity duration-300">
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Choose a service
          </h2>
          {loadingServices ? (
            <div className="flex items-center gap-2">
              <Spinner size={5} />
              <span className="text-sm text-slate-600">Loading services...</span>
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
                    <span className="mt-1 text-xs text-slate-600">
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

      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Choose a therapist
          </h2>
          {loadingTherapists ? (
            <div className="flex items-center gap-2">
              <Spinner size={5} />
              <span className="text-sm text-slate-600">Loading therapists...</span>
            </div>
          ) : therapists.length === 0 ? (
            <p className="text-sm text-slate-600">
              There are no therapists assigned to this service yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
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
                    <span className="font-medium text-slate-900">
                      {therapist.name}
                    </span>
                    {therapist.title && (
                      <span className="mt-1 text-xs text-slate-600">
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

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Choose a date
            </h2>
            <div className="flex flex-col items-start space-y-2">
            <CalendarPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().slice(0,10))}
              className="text-xs text-slate-600 hover:underline"
            >
              Today
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
                <span className="text-sm text-slate-600">Loading availability...</span>
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-slate-600">
                No available slots for this date. Try another day.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedTimeSlotId === slot.id;
                  const start = new Date(slot.start_time);
                  const label = start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSelectSlot(slot.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
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
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Review your booking
          </h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Service:</span>{" "}
              {currentService ? currentService.name : "Not selected"}
            </p>
            <p>
              <span className="font-semibold">Therapist:</span>{" "}
              {currentTherapist ? currentTherapist.name : "Not selected"}
            </p>
            <p>
              <span className="font-semibold">Date:</span>{" "}
              {selectedDate || "Not selected"}
            </p>
            <p>
              <span className="font-semibold">Time:</span>{" "}
              {currentSlot
                ? new Date(currentSlot.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Not selected"}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-xs font-medium uppercase tracking-wide text-slate-700"
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

      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner size={4} /> Confirming...
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

