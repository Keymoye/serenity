"use client";

import { useState } from "react";
import {
  contactFormSchema,
  type ContactFormInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type FormState = {
  values: ContactFormInput;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
};

const INITIAL_VALUES: ContactFormInput = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [state, setState] = useState<FormState>({
    values: INITIAL_VALUES,
    error: null,
    success: null,
    isSubmitting: false,
  });

  const handleChange =
    (field: keyof ContactFormInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
      }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
      isSubmitting: true,
    }));

    const parsed = contactFormSchema.safeParse(state.values);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Invalid input.";
      setState((prev) => ({
        ...prev,
        error: firstError,
        isSubmitting: false,
      }));
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error("Contact form submission failed", null, {
          status: response.status,
          body,
        });

        if (body.code === "RATE_LIMIT") {
          setState((prev) => ({
            ...prev,
            error:
              "You have reached the maximum number of submissions. Please try again later.",
            isSubmitting: false,
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          error: body.error || "Unable to send your message.",
          isSubmitting: false,
        }));
        return;
      }

      setState({
        values: INITIAL_VALUES,
        error: null,
        success:
          "Thank you for reaching out. We’ve received your message and will get back to you shortly.",
        isSubmitting: false,
      });
    } catch (error) {
      logger.error("Unexpected error during contact form submission", error);
      setState((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again.",
        isSubmitting: false,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="fullName"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={state.values.fullName}
            onChange={handleChange("fullName")}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={state.values.email}
            onChange={handleChange("email")}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700"
        >
          Phone (optional)
        </label>
        <input
          id="phone"
          type="tel"
          value={state.values.phone ?? ""}
          onChange={handleChange("phone")}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <div>
        <label
          htmlFor="subject"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700"
        >
          Subject
        </label>
        <input
          id="subject"
          type="text"
          value={state.values.subject}
          onChange={handleChange("subject")}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={state.values.message}
          onChange={handleChange("message")}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={state.isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {state.isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

