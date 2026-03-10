# Booking Flow
> Last updated: Batch 9 (March 2026)

## Overview
The booking flow is a 4-step wizard that guides customers through selecting a service, choosing a therapist, picking a date/time, and confirming their appointment. The system uses optimistic slot locking to prevent double-booking while providing a smooth user experience.

## Wizard flow diagram
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Step 1  │───▶│  Step 2  │───▶│  Step 3  │───▶│  Step 4  │
│ Service  │    │Therapist │    │Date/Time │    │ Confirm  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
│                │
lock fails       confirm fails
│                │
▼                ▼
show error        show error
re-fetch          stay on
availability      step 4

## Wizard steps

### Step 1: Select Service
**Component:** `BookingWizard` step 1  
**API call:** `GET /api/services`  
**Data passed to next step:** `serviceId`

**What renders:**
- Grid of `ServiceCard` components
- Each card shows: service image, name, duration, price, category
- Featured services highlighted
- Loading skeleton while fetching

**Validation:**
- Service must be active (`is_active = true`)
- No additional validation required

**API response:**
```typescript
interface Service {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  first_image_url: string | null;
  is_active: boolean | null;
}
```

### Step 2: Select Therapist
**Component:** `BookingWizard` step 2  
**API call:** `GET /api/services/[id]/therapists`  
**Data passed to next step:** `therapistId`

**What renders:**
- Therapist cards with photos, names, titles, bios
- Only therapists who offer the selected service
- Loading state while fetching

**API response:**
```typescript
interface TherapistSummary {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
}
```

**Business logic:**
- Filters therapists by service availability
- Shows only active therapists (`is_active = true`)
- Handles case where no therapists available

### Step 3: Select Date & Time
**Component:** `BookingWizard` step 3 with `CalendarPicker`  
**API calls:** 
- `POST /api/booking/availability` - Get available slots
- `POST /api/booking/lock` - Lock selected slot  
**Data passed to next step:** `timeSlotId`

**What renders:**
- `CalendarPicker` component showing current month
- Available time slots for selected date
- Loading states for date changes and slot fetching
- Error handling for no availability

**Availability request:**
```typescript
// POST /api/booking/availability
{
  serviceId: string;
  therapistId: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}
```

**Availability response:**
```typescript
interface TimeSlot {
  id: string;
  therapist_id: string;
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  is_available: boolean;
}
```

**Slot locking flow:**
1. User clicks available time slot
2. Immediate UI feedback (loading state)
3. `POST /api/booking/lock` with `timeSlotId`
4. If successful: slot reserved for 30 seconds
5. If failed: show error, allow retry
6. Proceed to confirmation step

**Lock request:**
```typescript
// POST /api/booking/lock
{
  timeSlotId: string;
}
```

**Lock response:**
```typescript
{
  success: boolean;
  message?: string;
}
```

### Step 4: Confirm Booking
**Component:** `BookingWizard` step 4  
**API call:** `POST /api/booking/confirm`  
**Data passed:** Complete booking object

**What renders:**
- Booking summary (service, therapist, date, time)
- Customer notes textarea (optional)
- Terms acceptance checkbox
- Confirm button with loading state

**Confirmation request:**
```typescript
// POST /api/booking/confirm
{
  serviceId: string;
  therapistId: string;
  timeSlotId: string;
  notes?: string;
}
```

**Confirmation response:**
```typescript
interface Booking {
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
```

**Success flow:**
1. Show success message
2. Send booking confirmation email
3. Send admin notification email
4. Redirect to `/dashboard` after 3 seconds

## Slot locking

### Purpose:
Prevent two customers from booking the same time slot simultaneously during the 30-second booking window.

### Sequence diagram:
Customer selects time slot
│
▼
POST /api/booking/lock { timeSlotId }
│
▼
lockSlot() — booking.service.ts
│
▼
LOCK_TIMEOUT_MS = 30 * 1000
lockUntil = now + 30 seconds
│
▼
try_lock_slot(slotId, lockUntil, now)
Postgres RPC — atomic UPDATE
┌───┴───┐
TRUE    FALSE
│        │
▼        ▼
slot locked  ConflictError → 409
30s countdown  re-fetch
starts         availability

### Implementation:
```sql
-- PostgreSQL function for atomic slot locking
create or replace function public.try_lock_slot(
  slot uuid, 
  lock_until timestamptz, 
  now timestamptz
) returns boolean as $$
declare
  updated record;
begin
  update time_slots
  set locked_until = lock_until
  where id = slot
    and is_available
    and (locked_until is null or locked_until < now)
  returning id into updated;

  return updated is not null;
end;
$$ language plpgsql stable;
```

### Lock duration:
- **Duration:** 30 seconds (`LOCK_TIMEOUT_MS = 30 * 1000`)
- **Expiry:** Slots automatically unlock when `locked_until < now()`
- **User experience:** 30 seconds to complete booking wizard

### Lock flow:
```typescript
// lib/application/booking.service.ts
export async function lockSlot(context: BookingContext, slotId: string): Promise<boolean> {
  const lockUntil = new Date(Date.now() + LOCK_TIMEOUT_MS);
  
  const success = await timeSlotRepo.lockSlot(slotId, lockUntil);
  
  if (!success) {
    throw new ConflictError("SLOT_UNAVAILABLE", "Slot is no longer available");
  }
  
  return true;
}
```

### Slot availability check:
```typescript
// Repository implementation
async lockSlot(slotId: string, lockUntil: Date): Promise<boolean> {
  const supabase = await getSupabaseUserClient();
  
  const { data, error } = await supabase.rpc('try_lock_slot', {
    slot: slotId,
    lock_until: lockUntil.toISOString(),
    now: new Date().toISOString()
  });
  
  if (error) throw error;
  return data;
}
```

### Race condition prevention:
- **Atomic update:** PostgreSQL function ensures single operation
- **Check condition:** Only locks if slot is available and not already locked
- **Immediate failure:** Returns false if slot already locked
- **No partial updates:** Either fully succeeds or fails

## Double-booking prevention

### Layered diagram:
┌────────────────────────────────────────┐
│  Layer 1 — Soft lock (30 seconds)      │
│  try_lock_slot RPC · atomic UPDATE     │
│  Stops concurrent slot selection       │
└───────────────────┬────────────────────┘
│ lock acquired
▼
┌────────────────────────────────────────┐
│  Layer 2 — Atomic mark-as-booked       │
│  UPDATE time_slots                     │
│  SET is_available = false              │
│  WHERE is_available = true             │
│  0 rows updated → ConflictError 409    │
└───────────────────┬────────────────────┘
│ slot marked
▼
┌────────────────────────────────────────┐
│  Layer 3 — Confirmed count check       │
│  countConfirmedBookingsWithSlot()      │
│  count > 0 → ConflictError 409         │
└────────────────────────────────────────┐

#### 1. Slot lock (30-second reservation)
- **Purpose:** Reserve slot during booking process
- **Duration:** 30 seconds
- **Mechanism:** `locked_until` timestamp in `time_slots` table
- **Behavior:** Slot appears unavailable to other users

#### 2. Unique database constraint
```sql
-- Prevents double booking at database level
create unique index idx_bookings_slot on bookings (time_slot_id);
```
- **Purpose:** Database-level constraint
- **Trigger:** On booking insertion
- **Behavior:** Throws error if slot already booked
- **Guarantee:** Impossible to book same slot twice

#### 3. Atomic booking confirmation
```typescript
// lib/application/booking.service.ts
export async function confirmBooking(input: BookingConfirmInput, context: BookingContext): Promise<Booking> {
  // 1. Verify slot is still locked by this user
  const slot = await timeSlotRepo.getById(input.timeSlotId);
  if (!slot.locked_until || slot.locked_until < new Date()) {
    throw new ConflictError("SLOT_EXPIRED", "Slot reservation expired");
  }
  
  // 2. Create booking (unique constraint prevents double booking)
  const booking = await bookingRepo.createBooking({
    customer_id: context.customerProfileId,
    service_id: input.serviceId,
    therapist_id: input.therapistId,
    time_slot_id: input.timeSlotId,
    status: 'confirmed',
    notes: input.notes,
  });
  
  // 3. Mark slot as permanently booked
  await timeSlotRepo.tryMarkAsBooked(input.timeSlotId);
  
  return booking;
}
```

### Atomic slot marking:
```typescript
// Repository implementation
async tryMarkAsBooked(slotId: string): Promise<void> {
  const supabase = await getSupabaseUserClient();
  
  const { error } = await supabase
    .from('time_slots')
    .update({ 
      is_available: false,
      locked_until: null 
    })
    .eq('id', slotId)
    .eq('is_available', true);  // Only update if still available
    
  if (error) throw error;
}
```

## Cancellation flow

### Customer cancellation process:

#### 1. Initiate cancellation
**Component:** `CancelBookingButton` on `/dashboard`  
**Trigger:** Customer clicks "Cancel" button  
**Behavior:** Shows confirmation dialog with booking details

#### 2. Confirmation dialog
**Component:** `ConfirmDialog`  
**Content:** "Are you sure you want to cancel this booking?"  
**Options:** Cancel booking / Keep booking

#### 3. Execute cancellation
**API call:** `DELETE /api/booking/[id]`  
**Service function:** `cancelBooking(bookingId, context)`

#### 4. Cancellation business logic
```typescript
// lib/application/booking.service.ts
export async function cancelBooking(bookingId: string, context: BookingContext): Promise<void> {
  // 1. Verify booking belongs to customer
  const booking = await bookingRepo.getById(bookingId);
  if (booking.customer_id !== context.customerProfileId) {
    throw new ForbiddenError("You can only cancel your own bookings");
  }
  
  // 2. Check cancellation window
  const appointmentStart = new Date(booking.time_slot.start_time);
  const hoursUntilAppointment = (appointmentStart.getTime() - Date.now()) / (1000 * 60 * 60);
  
  // 3. Update booking status
  await bookingRepo.updateStatus(bookingId, 'cancelled');
  
  // 4. Reopen time slot
  await timeSlotRepo.markAvailable(booking.time_slot_id);
  
  // 5. Send customer confirmation email
  await sendCancellationConfirmation({
    to: context.customerEmail,
    customerName: context.customerName,
    referenceCode: booking.reference_code,
    serviceName: booking.service.name,
    therapistName: booking.therapist?.name,
    appointmentDate: formatAppointmentDate(appointmentStart),
    appointmentTime: formatAppointmentTime(appointmentStart),
  });
  
  // 6. Send admin alert if late cancellation
  if (hoursUntilAppointment < LATE_CANCELLATION_HOURS) {
    await sendAdminLateCancellationAlert({
      referenceCode: booking.reference_code,
      customerName: context.customerName,
      serviceName: booking.service.name,
      therapistName: booking.therapist?.name,
      appointmentDate: formatAppointmentDate(appointmentStart),
      appointmentTime: formatAppointmentTime(appointmentStart),
      hoursUntilAppointment: Math.round(hoursUntilAppointment),
    });
  }
}
```

#### 6. Time slot reopening
```typescript
// Repository implementation
async markAvailable(slotId: string): Promise<void> {
  const supabase = await getSupabaseUserClient();
  
  const { error } = await supabase
    .from('time_slots')
    .update({ 
      is_available: true,
      locked_until: null 
    })
    .eq('id', slotId);
    
  if (error) throw error;
}
```

## Late cancellation

### Threshold:
- **Definition:** Cancellation within 24 hours of appointment
- **Constant:** `LATE_CANCELLATION_HOURS = 24`
- **Calculation:** `(appointment_time - current_time) < 24 hours`

### Late cancellation alert:
**Trigger:** Cancellation within 24-hour window  
**Recipient:** Admin email (`RESEND_ADMIN_EMAIL`)  
**Purpose:** Alert staff about potential revenue impact

### Alert content:
```typescript
interface LateCancellationAlert {
  referenceCode: string;
  customerName: string;
  serviceName: string;
  therapistName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  hoursUntilAppointment: number; // e.g., 2.5
}
```

### Alert email subject:
`"ALERT: Late Cancellation - {referenceCode}"`

### Business impact:
- **No penalty** for customer (system allows cancellation)
- **Staff notification** for scheduling adjustments
- **Slot availability** immediately restored for rebooking

## Email notifications

### Email sending pattern:
```typescript
// All emails are fire-and-forget
try {
  await sendBookingConfirmation(data);
} catch (error) {
  logger.error("Email failed", error);
  // Continue with booking - email failure doesn't block
}
```

### Notification matrix:
| Event | Recipient | Template | Trigger |
|-------|-----------|----------|---------|
| Booking confirmed | Customer | bookingConfirmationTemplate | `confirmBooking()` success |
| New booking | Admin | adminNewBookingTemplate | `confirmBooking()` success |
| Booking cancelled | Customer | cancellationConfirmationTemplate | `cancelBooking()` success |
| Late cancellation | Admin | adminLateCancellationTemplate | `cancelBooking()` with < 24h |

### Email timing:
- **Immediate:** All emails sent immediately after event
- **Async:** Email sending doesn't block user experience
- **Retry:** No automatic retry (manual follow-up if needed)
- **Logging:** All email attempts logged with reference codes

### Email content examples:

#### Booking confirmation to customer:
```
Subject: Booking Confirmed - ABC123

Hello Sarah Johnson,

Your booking has been confirmed:

Service: Swedish Massage (60 minutes)
Therapist: Alice Johnson (MT)
Date: Saturday, March 15, 2026
Time: 2:00 PM
Reference: ABC123

Notes: Please focus on neck and shoulders

Need to cancel? Use this link:
https://serenityspa.com/cancel?ref=ABC123

We look forward to seeing you!
```

#### Admin notification:
```
Subject: New Booking - ABC123

New booking received:

Customer: Sarah Johnson (sarah@example.com)
Service: Swedish Massage (60 minutes)
Therapist: Alice Johnson (MT)
Date: Saturday, March 15, 2026
Time: 2:00 PM
Reference: ABC123

Notes: Please focus on neck and shoulders
```

## Error handling

### Common booking errors:

#### Slot unavailable
```typescript
throw new ConflictError("SLOT_UNAVAILABLE", "This slot is no longer available");
```
**Response:** 409 Conflict
**UI:** "This time slot was just booked. Please select another time."

#### Slot expired
```typescript
throw new ConflictError("SLOT_EXPIRED", "Your reservation expired. Please select a new time.");
```
**Response:** 409 Conflict  
**UI:** "Your 30-second reservation expired. Please start over."

#### Service not found
```typescript
throw new NotFoundError("Service not available");
```
**Response:** 404 Not Found
**UI:** "This service is no longer available."

#### Therapist not available
```typescript
throw new NotFoundError("Therapist not available for this service");
```
**Response:** 404 Not Found
**UI:** "This therapist is not available for the selected service."

### Error recovery:
- **Slot unavailable:** Return to step 3, refresh availability
- **Slot expired:** Return to step 1, restart booking flow
- **Service/therapist issues:** Return to appropriate step with message
- **Network errors:** Retry with exponential backoff

## Performance considerations

### Database queries:
- **Availability check:** Optimized with therapist+time index
- **Slot locking:** Single atomic operation
- **Booking creation:** Uses unique constraint for safety

### Caching strategy:
- **Service list:** Cache for 5 minutes (rarely changes)
- **Therapist availability:** No cache (real-time required)
- **Time slots:** Cache per day for 1 minute

### Scalability:
- **Concurrent bookings:** Handled by slot locking
- **High availability:** Database-level constraints prevent issues
- **Load balancing:** Stateless API routes scale horizontally

## Testing scenarios

### Happy path:
1. Select service → Select therapist → Select time → Confirm → Success

### Edge cases:
1. **Slot taken during booking:** Handle gracefully, offer alternatives
2. **Session expires:** Detect and redirect to login
3. **Service becomes inactive:** Handle with appropriate error
4. **Therapist becomes unavailable:** Refresh therapist list

### Load testing:
- **Concurrent bookings:** Test with multiple users
- **Slot race conditions:** Verify locking prevents conflicts
- **Email failures:** Confirm bookings succeed without emails

## Analytics and monitoring

### Key metrics:
- **Booking conversion rate:** Step 1 → Step 4 completion
- **Slot lock expiry rate:** How many reservations expire
- **Cancellation rate:** Overall and by time window
- **Email delivery rate:** Success/failure by email type

### Monitoring alerts:
- **High slot expiry:** May indicate UX issues
- **Booking failures:** Database or service issues
- **Email failures:** Resend API or template issues
- **Late cancellations:** Scheduling patterns

### User experience tracking:
- **Time to complete booking:** Average wizard completion time
- **Drop-off points:** Which step sees most abandonment
- **Error rates:** By error type and step
- **Retry patterns:** How users recover from errors
