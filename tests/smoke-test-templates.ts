/**
 * Smoke test for email templates
 * Run with: npx tsx ./tests/smoke-test-templates.ts
 */

import {
  bookingConfirmationTemplate,
  adminNewBookingTemplate,
  adminLateCancellationTemplate,
  cancellationConfirmationTemplate,
} from "../lib/utils/emailTemplates";

const sampleBooking = {
  customerName: "Jane Smith",
  referenceCode: "BOOK-20260310-001",
  serviceName: "Full Body Massage",
  therapistName: "Maria Santos",
  appointmentDate: "Monday, March 10, 2026",
  appointmentTime: "2:30 PM",
  notes: "Prefer light pressure, sensitive to lavender",
  cancellationUrl: "https://yourspa.com/booking/BOOK-20260310-001/cancel",
};

const sampleAdmin = {
  referenceCode: "BOOK-20260310-001",
  customerName: "Jane Smith",
  customerEmail: "jane@example.com",
  serviceName: "Full Body Massage",
  therapistName: "Maria Santos",
  appointmentDate: "Monday, March 10, 2026",
  appointmentTime: "2:30 PM",
  notes: "Prefer light pressure, sensitive to lavender",
};

const sampleLateCancellation = {
  referenceCode: "BOOK-20260310-001",
  customerName: "Jane Smith",
  serviceName: "Full Body Massage",
  therapistName: "Maria Santos",
  appointmentDate: "Monday, March 10, 2026",
  appointmentTime: "2:30 PM",
  hoursUntilAppointment: 6,
};

const sampleCancellation = {
  customerName: "Jane Smith",
  referenceCode: "BOOK-20260310-001",
  serviceName: "Full Body Massage",
  therapistName: "Maria Santos",
  appointmentDate: "Monday, March 10, 2026",
  appointmentTime: "2:30 PM",
};

console.log("🧪 Smoke Testing Email Templates\n");

try {
  console.log("📧 Testing: bookingConfirmationTemplate");
  const booking = bookingConfirmationTemplate(sampleBooking);
  console.log(`   ✓ Rendered (${booking.length} characters)\n`);

  console.log("📧 Testing: adminNewBookingTemplate");
  const adminNew = adminNewBookingTemplate(sampleAdmin);
  console.log(`   ✓ Rendered (${adminNew.length} characters)\n`);

  console.log("📧 Testing: adminLateCancellationTemplate");
  const adminLate = adminLateCancellationTemplate(sampleLateCancellation);
  console.log(`   ✓ Rendered (${adminLate.length} characters)\n`);

  console.log("📧 Testing: cancellationConfirmationTemplate");
  const cancellation = cancellationConfirmationTemplate(sampleCancellation);
  console.log(`   ✓ Rendered (${cancellation.length} characters)\n`);

  console.log("✅ All templates rendered successfully!\n");
  console.log("Summary:");
  console.log(`  • bookingConfirmationTemplate: ${booking.length} chars`);
  console.log(`  • adminNewBookingTemplate: ${adminNew.length} chars`);
  console.log(`  • adminLateCancellationTemplate: ${adminLate.length} chars`);
  console.log(`  • cancellationConfirmationTemplate: ${cancellation.length} chars`);
} catch (error) {
  console.error("❌ Template rendering failed:", error);
  process.exit(1);
}
