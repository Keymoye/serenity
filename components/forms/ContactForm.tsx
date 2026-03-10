"use client";

import { useState } from "react";
import {
  contactFormSchema,
  type ContactFormInput,
} from "@/lib/utils/validation";
import { postJson, useApi } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

const INITIAL_VALUES: ContactFormInput = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const { loading, error, call, setError } = useApi();
  const [values, setValues] = useState<ContactFormInput>(INITIAL_VALUES);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange =
    (field: keyof ContactFormInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = event.target.value;
      setValues((prev) => ({ ...prev, [field]: v }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message ?? "Invalid input.";
      setError(firstError);
      return;
    }

    const res = await call(() => postJson("/api/contact", parsed.data));
    if (res === null) return; // error already handled

    setValues(INITIAL_VALUES);
    setSuccess(
      "Thank you for reaching out. We’ve received your message and will get back to you shortly."
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
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
            value={values.fullName}
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
            value={values.email}
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
          value={values.phone ?? ""}
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
          value={values.subject}
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
          value={values.message}
          onChange={handleChange("message")}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {loading ? (
          <>
            <Spinner size={4} /> Sending...
          </>
        ) : (
          "Send message"
        )}
      </button>
    </form>
  );
}

