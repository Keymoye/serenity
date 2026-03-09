/** Pagination limits */
export const ADMIN_LIST_LIMIT = 200
export const ADMIN_BOOKING_LIMIT = 500
export const CUSTOMER_BOOKING_LIMIT = 50

/** Auth & roles */
export const ADMIN_ROLE = "admin" as const
export const CUSTOMER_ROLE = "customer" as const

/** Booking statuses */
export const BOOKING_STATUS = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  CANCELLED: "cancelled",
} as const

/** Booking rules */
export const LOCK_TIMEOUT_MS = 10 * 60 * 1000
export const LATE_CANCELLATION_HOURS = 24
export const MIN_PASSWORD_LENGTH = 8

/** Rate limiting */
export const AUTH_RATE_LIMIT_REQUESTS = 10
export const AUTH_RATE_LIMIT_WINDOW = "15 m"

/** File upload */
export const MAX_GALLERY_IMAGES = 8
