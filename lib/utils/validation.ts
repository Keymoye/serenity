import { z } from "zod";

// ---------- Auth Schemas ----------

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "Password must contain at least one letter and one number."
      ),
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(100, "Name must be at most 100 characters."),
    phone: z
      .string()
      .trim()
      .max(32, "Phone number is too long.")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;

export const resetPasswordConfirmSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "Password must contain at least one letter and one number."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordConfirmInput = z.infer<
  typeof resetPasswordConfirmSchema
>;

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),
  phone: z
    .string()
    .trim()
    .max(32, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().nullable().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ---------- Public / Contact Schemas ----------

export const contactFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(32, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters.")
    .max(120, "Subject must be at most 120 characters."),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(2000, "Message must be at most 2000 characters."),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ---------- Booking Schemas ----------

export const bookingConfirmSchema = z.object({
  serviceId: z.string().min(1, "Service is required."),
  therapistId: z.string().min(1, "Therapist is required."),
  timeSlotId: z.string().min(1, "Time slot is required."),
  notes: z
    .string()
    .max(1000, "Notes must be at most 1000 characters.")
    .optional()
    .or(z.literal("")),
});

export type BookingConfirmInput = z.infer<typeof bookingConfirmSchema>;

// ---------- Admin Schemas ----------

export const adminServiceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be at most 120 characters."),
  category: z
    .string()
    .max(80, "Category must be at most 80 characters.")
    .optional()
    .or(z.literal("")),
  duration_minutes: z
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes.")
    .max(600, "Duration must be at most 600 minutes."),
  price: z
    .number()
    .min(0, "Price cannot be negative.")
    .max(10000, "Price seems too high."),
  is_active: z.boolean().optional(),
  therapistIds: z.array(z.string().uuid()).optional(),
  description: z.string().nullable().optional(),
});

export type AdminServiceInput = z.infer<typeof adminServiceSchema>;

export const adminTherapistSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be at most 120 characters."),
  title: z
    .string()
    .max(120, "Title must be at most 120 characters.")
    .optional()
    .or(z.literal("")),
  photo_url: z
    .string()
    .url("Please provide a valid URL.")
    .optional()
    .or(z.literal("")),
  bio_short: z
    .string()
    .max(500, "Bio must be at most 500 characters.")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export type AdminTherapistInput = z.infer<typeof adminTherapistSchema>;

export const adminTimeSlotCreateSchema = z.object({
  therapistId: z.string().min(1, "Therapist is required."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
});

export type AdminTimeSlotCreateInput = z.infer<
  typeof adminTimeSlotCreateSchema
>;

export const adminBookingStatusSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required."),
  status: z.enum(["confirmed", "cancelled", "pending"]),
});

export type AdminBookingStatusInput = z.infer<typeof adminBookingStatusSchema>;

