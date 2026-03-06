/**
 * Email HTML template functions
 *
 * These are pure functions that generate HTML strings.
 * No external dependencies, no side effects, no Resend imports.
 * All styling is inline CSS (email clients strip <style> tags).
 * All colors use hex values (email clients don't support CSS variables).
 */

// Design constants (inline, no CSS variables)
const COLORS = {
  sageGreen: "#7aaa6e",
  sageLight: "#eef4eb",
  bgCream: "#f8faf5",
  textDark: "#1a1a1a",
  textGray: "#666666",
  borderLight: "#e0e0e0",
  amberWarning: "#fff8e1",
  amberBorder: "#f59e0b",
};

const FONTS = {
  header: "Georgia, Cormorant Garamond, serif",
  body: "system-ui, -apple-system, sans-serif",
  mono: "Courier New, monospace",
};

interface BaseEmailData {
  spaName?: string;
  spaAddress?: string;
  spaPhone?: string;
  spaWebsite?: string;
}

/**
 * Wraps content in a consistent HTML email shell
 * - Sage/cream background
 * - White card with sage green top border
 * - Spa name header, footer with contact info
 */
function baseTemplate(
  content: string,
  title: string,
  options: {
    backgroundColor?: string;
    borderColor?: string;
    spaName?: string;
    spaAddress?: string;
    spaPhone?: string;
    spaWebsite?: string;
  } = {},
): string {
  const bgColor = options.backgroundColor || COLORS.bgCream;
  const borderColor = options.borderColor || COLORS.sageGreen;
  const spaName = options.spaName || "Serenity Spa";
  const spaAddress = options.spaAddress || "123 Wellness Street, Your City";
  const spaPhone = options.spaPhone || "+1 (555) 000-0000";
  const spaWebsite = options.spaWebsite || "https://yourspa.com";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: ${FONTS.body}; line-height: 1.6; color: ${COLORS.textDark};">
  <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Main card -->
        <div style="background-color: white; border-top: 3px solid ${borderColor}; border-radius: 4px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header with spa name -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid ${COLORS.borderLight}; padding-bottom: 20px;">
            <h1 style="margin: 0; font-family: ${FONTS.header}; font-size: 28px; color: ${borderColor}; font-weight: 400;">${spaName}</h1>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 40px;">
            ${content}
          </div>

          <!-- Footer with contact info -->
          <div style="text-align: center; border-top: 1px solid ${COLORS.borderLight}; padding-top: 20px; margin-top: 40px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray};">
              ${spaAddress}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray};">
              ${spaPhone}
            </p>
            <p style="margin: 0; font-size: 12px; color: ${COLORS.textGray};">
              <a href="${spaWebsite}" style="color: ${borderColor}; text-decoration: none;">${spaWebsite}</a>
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Booking confirmation email to customer
 */
export function bookingConfirmationTemplate(
  data: {
    customerName: string;
    referenceCode: string;
    serviceName: string;
    therapistName: string | null;
    appointmentDate: string; // e.g. "Monday, March 10, 2026"
    appointmentTime: string; // e.g. "2:30 PM"
    notes: string | null;
    cancellationUrl: string;
  } & BaseEmailData,
): string {
  const content = `
    <div>
      <h2 style="margin: 0 0 20px 0; font-family: ${FONTS.header}; font-size: 24px; color: ${COLORS.sageGreen};">
        Your booking is confirmed ✓
      </h2>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.textDark};">
        Hi ${data.customerName},
      </p>
      
      <p style="margin: 0 0 25px 0; color: ${COLORS.textGray};">
        Thank you for booking with us! We're looking forward to seeing you.
      </p>

      <!-- Reference code box -->
      <div style="background-color: ${COLORS.sageLight}; padding: 16px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Booking Reference
        </p>
        <p style="margin: 0; font-family: ${FONTS.mono}; font-size: 18px; color: ${COLORS.textDark}; font-weight: 600;">
          ${data.referenceCode}
        </p>
      </div>

      <!-- Details table -->
      <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray}; width: 40%;">Service</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.serviceName}</td>
        </tr>
        ${
          data.therapistName
            ? `
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Therapist</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.therapistName}</td>
        </tr>
        `
            : ""
        }
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Date</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Time</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentTime}</td>
        </tr>
      </table>

      ${
        data.notes
          ? `
      <!-- Notes section -->
      <div style="background-color: ${COLORS.sageLight}; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Special Requests
        </p>
        <p style="margin: 0; color: ${COLORS.textDark};">${data.notes}</p>
      </div>
      `
          : ""
      }

      <p style="margin: 0 0 20px 0; color: ${COLORS.textGray};">
        If you need to reschedule or cancel, you can do so here:
      </p>

      <!-- Cancel link -->
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${data.cancellationUrl}" style="display: inline-block; padding: 12px 24px; background-color: ${COLORS.sageGreen}; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
          Manage Your Booking
        </a>
      </div>

      <p style="margin: 0; margin-top: 20px; font-size: 14px; color: ${COLORS.textGray};">
        We're excited to welcome you!
      </p>
    </div>
  `;

  return baseTemplate(content, "Booking Confirmation", {
    spaName: data.spaName,
    spaAddress: data.spaAddress,
    spaPhone: data.spaPhone,
    spaWebsite: data.spaWebsite,
  });
}

/**
 * Admin notification for new booking
 */
export function adminNewBookingTemplate(
  data: {
    referenceCode: string;
    customerName: string;
    customerEmail: string;
    serviceName: string;
    therapistName: string | null;
    appointmentDate: string;
    appointmentTime: string;
    notes: string | null;
  } & BaseEmailData,
): string {
  const content = `
    <div>
      <h2 style="margin: 0 0 20px 0; font-family: ${FONTS.header}; font-size: 24px; color: ${COLORS.sageGreen};">
        New Booking Received
      </h2>
      
      <p style="margin: 0 0 25px 0; color: ${COLORS.textGray};">
        A new booking has been confirmed. Details below:
      </p>

      <!-- Reference code box -->
      <div style="background-color: ${COLORS.sageLight}; padding: 16px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Reference Code
        </p>
        <p style="margin: 0; font-family: ${FONTS.mono}; font-size: 18px; color: ${COLORS.textDark}; font-weight: 600;">
          ${data.referenceCode}
        </p>
      </div>

      <!-- Customer info -->
      <div style="background-color: ${COLORS.sageLight}; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Customer
        </p>
        <p style="margin: 0 0 4px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.customerName}</p>
        <p style="margin: 0; color: ${COLORS.textDark};"><a href="mailto:${data.customerEmail}" style="color: ${COLORS.sageGreen}; text-decoration: none;">${data.customerEmail}</a></p>
      </div>

      <!-- Details table -->
      <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray}; width: 40%;">Service</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.serviceName}</td>
        </tr>
        ${
          data.therapistName
            ? `
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Therapist</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.therapistName}</td>
        </tr>
        `
            : ""
        }
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Date</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Time</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentTime}</td>
        </tr>
      </table>

      ${
        data.notes
          ? `
      <!-- Notes section -->
      <div style="background-color: ${COLORS.sageLight}; padding: 16px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Special Requests
        </p>
        <p style="margin: 0; color: ${COLORS.textDark};">${data.notes}</p>
      </div>
      `
          : ""
      }
    </div>
  `;

  return baseTemplate(content, "New Booking Notification", {
    spaName: data.spaName,
    spaAddress: data.spaAddress,
    spaPhone: data.spaPhone,
    spaWebsite: data.spaWebsite,
  });
}

/**
 * Admin alert for late cancellation (within 24 hours of appointment)
 */
export function adminLateCancellationTemplate(
  data: {
    referenceCode: string;
    customerName: string;
    serviceName: string;
    therapistName: string | null;
    appointmentDate: string;
    appointmentTime: string;
    hoursUntilAppointment: number;
  } & BaseEmailData,
): string {
  const content = `
    <div>
      <h2 style="margin: 0 0 20px 0; font-family: ${FONTS.header}; font-size: 24px; color: ${COLORS.amberBorder};">
        ⚠️ Late Cancellation Alert
      </h2>
      
      <p style="margin: 0 0 25px 0; color: ${COLORS.textDark}; font-weight: 500;">
        A booking has been cancelled with less than 24 hours notice.
      </p>

      <!-- Hours until appointment (prominent) -->
      <div style="background-color: ${COLORS.amberWarning}; border: 1px solid ${COLORS.amberBorder}; padding: 24px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Time Until Appointment
        </p>
        <p style="margin: 0; font-size: 32px; color: ${COLORS.amberBorder}; font-weight: bold;">
          ${data.hoursUntilAppointment} ${data.hoursUntilAppointment === 1 ? "hour" : "hours"}
        </p>
      </div>

      <!-- Reference code box -->
      <div style="background-color: ${COLORS.sageLight}; padding: 16px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Reference Code
        </p>
        <p style="margin: 0; font-family: ${FONTS.mono}; font-size: 18px; color: ${COLORS.textDark}; font-weight: 600;">
          ${data.referenceCode}
        </p>
      </div>

      <!-- Details table -->
      <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray}; width: 40%;">Customer</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.customerName}</td>
        </tr>
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Service</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.serviceName}</td>
        </tr>
        ${
          data.therapistName
            ? `
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Therapist</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.therapistName}</td>
        </tr>
        `
            : ""
        }
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Date</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Time</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentTime}</td>
        </tr>
      </table>

      <p style="margin: 0 0 15px 0; padding: 12px; background-color: ${COLORS.amberWarning}; border-radius: 4px; color: ${COLORS.textDark};">
        <strong>Suggestion:</strong> Consider reopening this slot immediately to allow other customers to book.
      </p>
    </div>
  `;

  return baseTemplate(content, "Late Cancellation Alert", {
    backgroundColor: COLORS.amberWarning,
    borderColor: COLORS.amberBorder,
    spaName: data.spaName,
    spaAddress: data.spaAddress,
    spaPhone: data.spaPhone,
    spaWebsite: data.spaWebsite,
  });
}

/**
 * Cancellation confirmation email to customer
 */
export function cancellationConfirmationTemplate(
  data: {
    customerName: string;
    referenceCode: string;
    serviceName: string;
    therapistName: string | null;
    appointmentDate: string;
    appointmentTime: string;
  } & BaseEmailData,
): string {
  const content = `
    <div>
      <h2 style="margin: 0 0 20px 0; font-family: ${FONTS.header}; font-size: 24px; color: ${COLORS.textDark};">
        Your booking has been cancelled
      </h2>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.textDark};">
        Hi ${data.customerName},
      </p>
      
      <p style="margin: 0 0 20px 0; color: ${COLORS.textGray};">
        Your booking has been successfully cancelled. The appointment slot has been released and is now available for other customers.
      </p>

      <!-- Reference code box -->
      <div style="background-color: ${COLORS.sageLight}; padding: 16px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.textGray}; text-transform: uppercase; letter-spacing: 1px;">
          Cancelled Booking
        </p>
        <p style="margin: 0; font-family: ${FONTS.mono}; font-size: 18px; color: ${COLORS.textDark}; font-weight: 600;">
          ${data.referenceCode}
        </p>
      </div>

      <!-- Details table -->
      <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray}; width: 40%;">Service</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.serviceName}</td>
        </tr>
        ${
          data.therapistName
            ? `
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Therapist</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.therapistName}</td>
        </tr>
        `
            : ""
        }
        <tr style="border-bottom: 1px solid ${COLORS.borderLight};">
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Date</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: ${COLORS.textGray};">Time</td>
          <td style="padding: 12px 0; color: ${COLORS.textDark}; font-weight: 500;">${data.appointmentTime}</td>
        </tr>
      </table>

      <p style="margin: 0 0 20px 0; color: ${COLORS.textGray};">
        If you'd like to rebook, we'd love to see you again!
      </p>

      <!-- Rebook link -->
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${data.spaWebsite}/book" style="display: inline-block; padding: 12px 24px; background-color: ${COLORS.sageGreen}; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
          View Available Services
        </a>
      </div>

      <p style="margin: 0; margin-top: 20px; font-size: 14px; color: ${COLORS.textGray};">
        Thank you for choosing ${data.spaName}. We hope to welcome you back soon.
      </p>
    </div>
  `;

  return baseTemplate(content, "Booking Cancelled", {
    spaName: data.spaName,
    spaAddress: data.spaAddress,
    spaPhone: data.spaPhone,
    spaWebsite: data.spaWebsite,
  });
}
