/**
 * Date formatting utilities for email templates and UI
 */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Format ISO date string to human-readable appointment date
 * e.g. "2026-03-10T14:30:00Z" → "Monday, March 10, 2026"
 */
export function formatAppointmentDate(isoString: string): string {
  const date = new Date(isoString);
  const dayName = DAYS[date.getUTCDay()];
  const monthName = MONTHS[date.getUTCMonth()];
  const dayOfMonth = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${dayName}, ${monthName} ${dayOfMonth}, ${year}`;
}

/**
 * Format ISO time string to human-readable appointment time
 * e.g. "2026-03-10T14:30:00Z" → "2:30 PM"
 */
export function formatAppointmentTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const meridiem = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${paddedMinutes} ${meridiem}`;
}
