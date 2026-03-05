Last updated: March 5, 2026 | Auto-generated from source

# Data Models & Schemas

All TypeScript interfaces and Zod schemas used by the application are defined in `lib/domain/` and `lib/utils/validation.ts`.
This file groups them by domain concept and lists field names, types, and optionality.

---

## Booking

### Interfaces
```ts
export type BookingStatus = "confirmed" | "cancelled" | "pending";

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  therapist_id: string | null;
  time_slot_id: string;
  status: BookingStatus;
  reference_code: string;
  notes: string | null;
  created_at: string;
}

export interface BookingSummary {
  id: string;
  service_id: string;
  therapist_id: string | null;
  time_slot_id: string;
  status: BookingStatus;
  reference_code: string;
  created_at: string;
}
```

### Zod Schemas (validation.ts)
```ts
export const bookingConfirmSchema = z.object({
  serviceId: z.string().min(1),
  therapistId: z.string().min(1),
  timeSlotId: z.string().min(1),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
```

```ts
// input type alias exposed by domain/booking.types.ts
export type BookingConfirmInput = z.infer<typeof bookingConfirmSchema>;
```


## Therapist

### Interface
```ts
export interface Therapist {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
  is_active: boolean | null;
  created_at: string | null;
}
```

No dedicated Zod schema; used indirectly via admin schemas.

## Service

### Interface
```ts
export interface Service {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  thumbnail_url?: string | null;
  description?: string | null;
  is_active: boolean | null;
  is_featured?: boolean | null;
  updated_at: string | null;
}
```

## TimeSlot

### Interface
```ts
export interface TimeSlot {
  id: string;
  therapist_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  locked_until: string | null;
}
```

## Admin types

### Interface / Zod schema aliases
The admin types re-export and extend validation schemas from `utils/validation.ts`.

- `adminServiceSchema`, `adminTherapistSchema`, `adminTimeSlotCreateSchema`, `adminBookingStatusSchema` (see below)
- Update schemas extend original schemas with an `id: string` field.

## Zod Schemas (full listing)

### Authentication
```ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/),
  confirmPassword: z.string(),
  name: z.string().min(2).max(100),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
}).refine((d) => d.password === d.confirmPassword,{ message: "Passwords do not match.", path: ["confirmPassword"] });

export const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordConfirmSchema = z.object({
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });
```

```ts
// corresponding TypeScript input aliases
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;
```

### Profile
```ts
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
});
```

```ts
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
```

### Contact / Public
```ts
export const contactFormSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(2000),
});
```

```ts
export type ContactFormInput = z.infer<typeof contactFormSchema>;
```

### Booking
```ts
export const bookingConfirmSchema = z.object({
  serviceId: z.string().min(1),
  therapistId: z.string().min(1),
  timeSlotId: z.string().min(1),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
```

### Admin
```ts
export const adminServiceSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().max(80).optional().or(z.literal("")),
  duration_minutes: z.number().int().min(15).max(600),
  price: z.number().min(0).max(10000),
  is_active: z.boolean().optional(),
});

export const adminTherapistSchema = z.object({
  name: z.string().min(2).max(120),
  title: z.string().max(120).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
  bio_short: z.string().max(500).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const adminTimeSlotCreateSchema = z.object({
  therapistId: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
});

export const adminBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["confirmed","cancelled","pending"]),
});
```

```ts
export type AdminServiceInput = z.infer<typeof adminServiceSchema>;
export type AdminTherapistInput = z.infer<typeof adminTherapistSchema>;
export type AdminTimeSlotCreateInput = z.infer<typeof adminTimeSlotCreateSchema>;
export type AdminBookingStatusInput = z.infer<typeof adminBookingStatusSchema>;
```

> The `lib/domain/admin.types.ts` file re‑exports these schemas and provides `adminServiceUpdateSchema` / `adminTherapistUpdateSchema` which extend with an `id` field.
