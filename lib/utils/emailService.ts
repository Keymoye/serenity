/**
 * Email Service
 *
 * This is the ONLY file that imports Resend.
 * All other code calls functions from this file — never imports Resend directly.
 *
 * Architecture principle:
 * - Lives in lib/utils/ because it's infrastructure shared across services
 * - Not in lib/infra/ because it's not a database repository pattern
 * - Not in lib/application/ because it has no business logic
 * - All application services call emailService, never Resend
 *
 * Error handling:
 * - All functions wrap in try/catch
 * - Never throw; always return EmailResult
 * - Email failure must NEVER crash a booking confirmation
 */

import { Resend } from "resend";
import { logger } from "./logger";
import {
  bookingConfirmationTemplate,
  adminNewBookingTemplate,
  adminLateCancellationTemplate,
  cancellationConfirmationTemplate,
} from "./emailTemplates";

export interface EmailResult {
  success: boolean;
  error?: string;
}

// Initialize Resend with API key from env
const getResendClient = (): Resend => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
};

const getFromEmail = (): string => {
  return process.env.RESEND_FROM_EMAIL ?? "bookings@serenity.spa";
};

const getAdminEmail = (): string => {
  return process.env.RESEND_ADMIN_EMAIL ?? "admin@serenity.spa";
};

// Spa config helpers
const getSpaConfig = () => ({
  spaName: process.env.SPA_NAME || "Serenity Spa",
  spaAddress: process.env.SPA_ADDRESS || "123 Wellness Street, Your City",
  spaPhone: process.env.SPA_PHONE || "+1 (555) 000-0000",
  spaWebsite: process.env.SPA_WEBSITE || "https://yourspa.com",
});

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(data: {
  to: string;
  customerName: string;
  referenceCode: string;
  serviceName: string;
  therapistName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  notes: string | null;
  cancellationUrl: string;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const spaConfig = getSpaConfig();

    const html = bookingConfirmationTemplate({
      ...data,
      ...spaConfig,
    });

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.to,
      subject: `Booking Confirmed - ${data.referenceCode}`,
      html,
    });

    if (result.error) {
      logger.error("Resend API error sending booking confirmation", result.error, {
        referenceCode: data.referenceCode,
        to: data.to,
      });
      return { success: false, error: result.error.message };
    }

    logger.info("Booking confirmation email sent", {
      referenceCode: data.referenceCode,
      to: data.to,
      messageId: result.data?.id,
    });

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to send booking confirmation email",
      error,
      { referenceCode: data.referenceCode, to: data.to },
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin notification for new booking
 */
export async function sendAdminNewBookingNotification(data: {
  referenceCode: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  therapistName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  notes: string | null;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const spaConfig = getSpaConfig();

    const html = adminNewBookingTemplate({
      ...data,
      ...spaConfig,
    });

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: getAdminEmail(),
      subject: `New Booking - ${data.referenceCode}`,
      html,
    });

    if (result.error) {
      logger.error("Resend API error sending admin notification", result.error, {
        referenceCode: data.referenceCode,
      });
      return { success: false, error: result.error.message };
    }

    logger.info("Admin new booking notification email sent", {
      referenceCode: data.referenceCode,
      messageId: result.data?.id,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send admin new booking notification", error, {
      referenceCode: data.referenceCode,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin alert for late cancellation (within 24 hours of appointment)
 */
export async function sendAdminLateCancellationAlert(data: {
  referenceCode: string;
  customerName: string;
  serviceName: string;
  therapistName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  hoursUntilAppointment: number;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const spaConfig = getSpaConfig();

    const html = adminLateCancellationTemplate({
      ...data,
      ...spaConfig,
    });

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: getAdminEmail(),
      subject: `ALERT: Late Cancellation - ${data.referenceCode}`,
      html,
    });

    if (result.error) {
      logger.error("Resend API error sending late cancellation alert", result.error, {
        referenceCode: data.referenceCode,
      });
      return { success: false, error: result.error.message };
    }

    logger.info("Admin late cancellation alert email sent", {
      referenceCode: data.referenceCode,
      hoursUntilAppointment: data.hoursUntilAppointment,
      messageId: result.data?.id,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send admin late cancellation alert", error, {
      referenceCode: data.referenceCode,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send cancellation confirmation email to customer
 */
export async function sendCancellationConfirmation(data: {
  to: string;
  customerName: string;
  referenceCode: string;
  serviceName: string;
  therapistName: string | null;
  appointmentDate: string;
  appointmentTime: string;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const spaConfig = getSpaConfig();

    const html = cancellationConfirmationTemplate({
      ...data,
      ...spaConfig,
    });

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.to,
      subject: `Booking Cancelled - ${data.referenceCode}`,
      html,
    });

    if (result.error) {
      logger.error("Resend API error sending cancellation confirmation", result.error, {
        referenceCode: data.referenceCode,
        to: data.to,
      });
      return { success: false, error: result.error.message };
    }

    logger.info("Cancellation confirmation email sent", {
      referenceCode: data.referenceCode,
      to: data.to,
      messageId: result.data?.id,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send cancellation confirmation email", error, {
      referenceCode: data.referenceCode,
      to: data.to,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
