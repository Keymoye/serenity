# Component Tree

## Public pages

### app/page.tsx (Landing page)
```
app/page.tsx (Server)
├── SpaNavbar (Client)
│   ├── Logo
│   ├── Navigation links
│   └── Auth buttons (Login/Register)
├── PageHero (Client)
│   ├── Hero title
│   ├── Hero description
│   ├── CTA button
│   └── Hero image
├── SectionWrapper (Server)
│   └── ServiceCard (×3 featured services)
│       ├── Service image
│       ├── Service name
│       ├── Service price
│       └── Book button
└── SpaFooter (Server)
    ├── Spa name
    ├── Address
    ├── Phone
    └── Website link
```

### app/(public)/services/page.tsx (Services listing)
```
app/(public)/services/page.tsx (Server)
├── SpaNavbar (Client)
├── PageHero (Client)
│   ├── "Our Services" title
│   ├── Services description
│   └── Background image
├── SectionWrapper (Server)
│   └── ServiceCard (×n services)
│       ├── Service image
│       ├── Service name
│       ├── Service category
│       ├── Service duration
│       ├── Service price
│       └── View details button
└── SpaFooter (Server)
```

### app/(public)/services/[id]/page.tsx (Service detail)
```
app/(public)/services/[id]/page.tsx (Server)
├── SpaNavbar (Client)
├── PageHero (Client)
│   ├── Service name
│   ├── Service description
│   ├── CTA "Book this service"
│   └── Service image (first image)
├── SectionWrapper (Server)
│   ├── Service details (name, category, duration, price)
│   ├── Gallery section
│   │   └── Image (×n service images)
│   │       ├── Next.js Image component
│   │       └── Fullscreen modal on click
│   └── Therapists section
│       └── TherapistCard (×n therapists)
│           ├── Avatar component
│           ├── Therapist name
│           ├── Therapist title
│           ├── Therapist bio
│           └── Book with therapist button
├── SectionWrapper (Server) - "Preparing for your visit"
│   ├── Preparation tips
│   └── MapEmbed component
└── SpaFooter (Server)
```

### app/(public)/book/page.tsx (Booking wizard)
```
app/(public)/book/page.tsx (Client)
├── SpaNavbar (Client)
├── BookingWizard (Client)
│   ├── Step indicator (1-4)
│   ├── Step 1: Service selection
│   │   └── ServiceCard (×n services)
│   │       ├── Service image
│   │       ├── Service name
│   │       ├── Service price
│   │       └── Select button
│   ├── Step 2: Therapist selection
│   │   └── TherapistCard (×n therapists)
│   │       ├── Avatar component
│   │       ├── Therapist name
│   │       ├── Therapist title
│   │       ├── Therapist bio
│   │       └── Select button
│   ├── Step 3: Date & time selection
│   │   ├── CalendarPicker (Client)
│   │   │   ├── Month navigation
│   │   │   ├── Calendar grid (days)
│   │   │   └── Time slots grid
│   │   │       └── Time slot buttons
│   │   └── Loading states
│   └── Step 4: Confirmation
│       ├── Booking summary
│       ├── Service details
│       ├── Therapist details
│       ├── Date & time
│       ├── Notes textarea
│       ├── Terms checkbox
│       └── Confirm button
└── SpaFooter (Server)
```

### app/(public)/therapists/[id]/page.tsx (Therapist detail)
```
app/(public)/therapists/[id]/page.tsx (Server)
├── SpaNavbar (Client)
├── PageHero (Client)
│   ├── Therapist name
│   ├── Therapist title
│   ├── Therapist bio
│   └── Therapist photo
├── SectionWrapper (Server)
│   ├── Therapist details
│   └── Services offered
│       └── ServiceCard (×n services)
│           ├── Service image
│           ├── Service name
│           ├── Service price
│           └── Book button
├── SectionWrapper (Server) - "Preparing for your visit"
│   ├── Preparation tips
│   └── MapEmbed component
└── SpaFooter (Server)
```

## Customer pages

### app/(customer)/dashboard/page.tsx
```
app/(customer)/dashboard/page.tsx (Client)
├── SpaNavbar (Client)
├── PageHero (Client)
│   ├── "Welcome back, {name}"
│   ├── Dashboard navigation
│   └── Quick stats
├── SectionWrapper (Server)
│   ├── Upcoming bookings
│   │   └── BookingCard (×n)
│   │       ├── Service name
│   │       ├── Therapist name
│   │       ├── Date & time
│   │       ├── Status Badge
│   │       ├── View button
│   │       └── CancelBookingButton
│   └── Past bookings
│       └── BookingCard (×n)
├── SectionWrapper (Server)
│   └── Quick actions
│       ├── Book new appointment
│       └── Update profile
└── SpaFooter (Server)
```

### app/(customer)/profile/page.tsx
```
app/(customer)/profile/page.tsx (Client)
├── SpaNavbar (Client)
├── PageHero (Client)
│   ├── "My Profile"
│   └── Profile management
├── SectionWrapper (Server)
│   ├── Profile form
│   │   ├── Input (Name)
│   │   ├── Input (Phone)
│   │   ├── Save button
│   │   └── Loading states
│   └── Password change
│       ├── Input (Current password)
│       ├── Input (New password)
│       ├── Input (Confirm password)
│       └── Update button
├── SectionWrapper (Server)
│   └── Avatar upload
│       └── ImageUpload component
│           ├── Current avatar
│           ├── Upload button
│           ├── Progress bar
│           └── Preview
└── SpaFooter (Server)
```

### app/(customer)/messages/page.tsx
```
app/(customer)/messages/page.tsx (Client)
├── SpaNavbar (Client)
├── PageHero (Client)
│   ├── "My Messages"
│   └── Communication history
├── SectionWrapper (Server)
│   └── Message list
│       └── MessageCard (×n)
│           ├── Subject
│           ├── Preview
│           ├── Date
│           ├── Read status
│           └── View button
└── SpaFooter (Server)
```

## Admin pages

### app/(admin)/admin/layout.tsx (Admin layout)
```
app/(admin)/admin/layout.tsx (Server)
├── AdminSidebar (Client)
│   ├── Logo
│   ├── Navigation menu
│   │   ├── Dashboard
│   │   ├── Bookings
│   │   ├── Services
│   │   ├── Therapists
│   │   ├── Schedule
│   │   ├── Messages
│   │   └── Settings
│   └── User menu
│       ├── Profile
│       └── Logout
└── {children} (Admin page content)
```

### app/(admin)/admin/bookings/page.tsx
```
app/(admin)/admin/bookings/page.tsx (Client)
├── AdminSidebar (Client)
├── PageHero (Client)
│   ├── "Bookings Management"
│   └── Booking statistics
├── SectionWrapper (Server)
│   ├── Booking filters
│   │   ├── Date range picker
│   │   ├── Status filter
│   │   └── Search input
│   └── Booking table
│       ├── Table headers
│       └── Booking rows (×n)
│           ├── Reference code
│           ├── Customer name
│           ├── Service name
│           ├── Therapist name
│           ├── Date & time
│           ├── Status Badge
│           ├── Status dropdown
│           ├── View button
│           └── Delete button
├── ConfirmDialog (Modal)
│   ├── "Delete booking?"
│   ├── Booking details
│   ├── Cancel button
│   └── Confirm button
└── Booking detail modal (if viewing)
    ├── Full booking details
    ├── Customer information
    ├── Service information
    └── Close button
```

### app/(admin)/admin/services/page.tsx
```
app/(admin)/admin/services/page.tsx (Client)
├── AdminSidebar (Client)
├── PageHero (Client)
│   ├── "Services Management"
│   └── Add service button
├── SectionWrapper (Server)
│   ├── Service filters
│   │   ├── Search input
│   │   ├── Category filter
│   │   └── Active toggle
│   └── Service table
│       ├── Table headers
│       └── Service rows (×n)
│           ├── Service image
│           ├── Service name
│           ├── Category
│           ├── Duration
│           ├── Price
│           ├── Status Badge
│           ├── Edit button
│           └── Delete button
├── ServiceForm (Modal)
│   ├── Form fields
│   │   ├── Input (Name)
│   │   ├── Input (Category)
│   │   ├── Input (Duration)
│   │   ├── Input (Price)
│   │   ├── Textarea (Description)
│   │   ├── Toggle (Active)
│   │   └── Toggle (Featured)
│   ├── Image upload section
│   │   └── ImageUpload component
│   ├── Gallery images
│   │   └── Image gallery (×n)
│   ├── Save button
│   └── Cancel button
└── ConfirmDialog (Modal)
    ├── "Delete service?"
    ├── Service details
    └── Confirm/Cancel buttons
```

### app/(admin)/admin/therapists/page.tsx
```
app/(admin)/admin/therapists/page.tsx (Client)
├── AdminSidebar (Client)
├── PageHero (Client)
│   ├── "Therapists Management"
│   └── Add therapist button
├── SectionWrapper (Server)
│   ├── Therapist filters
│   │   ├── Search input
│   │   └── Active toggle
│   └── Therapist table
│       ├── Table headers
│       └── Therapist rows (×n)
│           ├── Therapist photo
│           ├── Therapist name
│           ├── Title
│           ├── Status Badge
│           ├── Edit button
│           └── Delete button
├── TherapistForm (Modal)
│   ├── Form fields
│   │   ├── Input (Name)
│   │   ├── Input (Title)
│   │   ├── Textarea (Bio)
│   │   └── Toggle (Active)
│   ├── Photo upload
│   │   └── ImageUpload component
│   ├── Services assignment
│   │   └── Service checkboxes (×n)
│   ├── Save button
│   └── Cancel button
└── ConfirmDialog (Modal)
    ├── "Delete therapist?"
    ├── Therapist details
    └── Confirm/Cancel buttons
```

### app/(admin)/admin/schedule/page.tsx
```
app/(admin)/admin/schedule/page.tsx (Client)
├── AdminSidebar (Client)
├── PageHero (Client)
│   ├── "Schedule Management"
│   └── Add time slots button
├── SectionWrapper (Server)
│   ├── Calendar view
│   │   ├── Month navigation
│   │   └── Calendar grid
│   └── ScheduleViewer
│       ├── Therapist filter
│       ├── Date selector
│       └── Time slots grid
│           └── TimeSlotCard (×n)
│               ├── Time
│               ├── Duration
│               ├── Status Badge
│               ├── Edit button
│               └── Delete button
└── TimeSlotForm (Modal)
    ├── Date picker
    ├── Time picker (start)
    ├── Time picker (end)
    ├── Therapist selector
    ├── Save button
    └── Cancel button
```

### app/(admin)/admin/messages/page.tsx
```
app/(admin)/admin/messages/page.tsx (Client)
├── AdminSidebar (Client)
├── PageHero (Client)
│   ├── "Messages"
│   └── Message statistics
├── SectionWrapper (Server)
│   ├── Message filters
│   │   ├── Search input
│   │   ├── Read status filter
│   │   └── Date range
│   └── Message table
│       ├── Table headers
│       └── Message rows (×n)
│           ├── Sender name
│           ├── Email
│           ├── Subject
│           ├── Date
│           ├── Read status Badge
│           ├── View button
│           └── Mark as read button
└── MessageDetail modal
    ├── Full message content
    ├── Sender information
    ├── Reply options
    └── Close button
```

### app/(admin)/admin/settings/page.tsx
```
app/(admin)/admin/settings/page.tsx (Client)
├── AdminSidebar (Client)
├── PageHero (Client)
│   ├── "Settings"
│   └── Site configuration
├── SectionWrapper (Server)
│   ├── Site information
│   │   ├── Input (Spa name)
│   │   ├── Input (Address)
│   │   ├── Input (Phone)
│   │   ├── Input (Website)
│   │   ├── Input (Email)
│   │   └── Save button
│   ├── Hero image
│   │   └── ImageUpload component
│   └── Business hours
│       ├── Day selectors
│       ├── Time pickers
│       └── Save button
└── SectionWrapper (Server)
    ├── Email configuration
    │   ├── From email
    │   ├── Admin email
    │   └── Test email button
    └── Rate limiting settings
        ├── Request limit
        ├── Window duration
        └── Save button
```

## Component inventory

### Layout components

#### SpaNavbar
- **Type:** Client
- **Location:** `components/layout/SpaNavbar.tsx`
- **Purpose:** Main navigation header with authentication state
- **Props:** None (uses auth context)
- **Data fetching:** Reads current user from Supabase auth
- **Notes:** Responsive design, shows different options for logged-in vs anonymous users

#### AdminSidebar
- **Type:** Client
- **Location:** `components/layout/AdminSidebar.tsx`
- **Purpose:** Admin navigation sidebar with menu items
- **Props:** None (uses current path for active state)
- **Data fetching:** None
- **Notes:** Collapsible on mobile, highlights active page

#### PageHero
- **Type:** Client
- **Location:** `components/layout/PageHero.tsx`
- **Purpose:** Consistent hero section with title, subtitle, and CTA
- **Props:**
```typescript
interface Props {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageSrc?: string;
}
```
- **Data fetching:** None
- **Notes:** Uses Next.js Image component for hero images

#### SectionWrapper
- **Type:** Server
- **Location:** `components/layout/SectionWrapper.tsx`
- **Purpose:** Consistent section wrapper with spacing and styling
- **Props:**
```typescript
interface Props {
  children: React.ReactNode;
  variant?: "default" | "muted";
  className?: string;
}
```
- **Data fetching:** None
- **Notes:** Provides consistent spacing and background colors

#### ConfirmDialog
- **Type:** Client
- **Location:** `components/layout/ConfirmDialog.tsx`
- **Purpose:** Modal dialog for confirmations (delete, cancel, etc.)
- **Props:**
```typescript
interface Props {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}
```
- **Data fetching:** None
- **Notes:** Accessible with focus management

#### SpaFooter
- **Type:** Server
- **Location:** `components/layout/SpaFooter.tsx`
- **Purpose:** Site footer with contact information and links
- **Props:** None
- **Data fetching:** Fetches site settings from API
- **Notes:** Uses site configuration for contact info

### Booking components

#### BookingWizard
- **Type:** Client
- **Location:** `components/booking/BookingWizard.tsx`
- **Purpose:** Multi-step booking flow (service → therapist → time → confirm)
- **Props:**
```typescript
interface Props {
  onBookingComplete?: (booking: Booking) => void;
}
```
- **Data fetching:** 
  - GET /api/services (step 1)
  - GET /api/services/[id]/therapists (step 2)
  - POST /api/booking/availability (step 3)
  - POST /api/booking/lock (step 3)
  - POST /api/booking/confirm (step 4)
- **Notes:** Manages step state, validation, and error handling

#### CalendarPicker
- **Type:** Client
- **Location:** `components/booking/CalendarPicker.tsx`
- **Purpose:** Date selection calendar with available time slots
- **Props:**
```typescript
interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates: string[];
  timeSlots: TimeSlot[];
  onTimeSlotSelect: (slot: TimeSlot) => void;
}
```
- **Data fetching:** None (receives data via props)
- **Notes:** Highlights available dates, shows time slots for selected date

#### CancelBookingButton
- **Type:** Client
- **Location:** `components/booking/CancelBookingButton.tsx`
- **Purpose:** Button to cancel a booking with confirmation dialog
- **Props:**
```typescript
interface Props {
  bookingId: string;
  onCancelComplete?: () => void;
}
```
- **Data fetching:** DELETE /api/booking/[id]
- **Notes:** Shows confirmation dialog before cancellation

### Admin components

#### ServiceForm
- **Type:** Client
- **Location:** `components/admin/ServiceForm.tsx`
- **Purpose:** Form for creating/editing services with image gallery
- **Props:**
```typescript
interface Props {
  initial?: ServiceFormInput | null;
  onSaved?: () => void;
  onCancel?: () => void;
}
```
- **Data fetching:**
  - POST /api/admin/services (create)
  - PUT /api/admin/services (update)
  - POST /api/admin/upload (image upload)
  - GET /api/admin/services/[id]/images (gallery)
- **Notes:** Includes image gallery management, service assignment

#### TherapistForm
- **Type:** Client
- **Location:** `components/admin/TherapistForm.tsx`
- **Purpose:** Form for creating/editing therapists with photo upload
- **Props:**
```typescript
interface Props {
  initial?: TherapistFormInput | null;
  onSaved?: () => void;
  onCancel?: () => void;
}
```
- **Data fetching:**
  - POST /api/admin/therapists (create)
  - PUT /api/admin/therapists (update)
  - GET /api/services (for assignment)
  - POST /api/admin/upload (photo)
- **Notes:** Includes service assignment checkboxes

#### ScheduleViewer
- **Type:** Client
- **Location:** `components/admin/ScheduleViewer.tsx`
- **Purpose:** View and manage therapist schedules and time slots
- **Props:**
```typescript
interface Props {
  therapistId?: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
}
```
- **Data fetching:**
  - GET /api/admin/time-slots (by therapist/date)
  - POST /api/admin/time-slots (create)
  - DELETE /api/admin/time-slots (delete)
- **Notes:** Calendar view with time slot creation/deletion

### UI components

#### ServiceCard
- **Type:** Client
- **Location:** `components/ui/ServiceCard.tsx`
- **Purpose:** Display service information in card format
- **Props:**
```typescript
interface Props {
  service: Service;
  href?: string;
  showPrice?: boolean;
  showDuration?: boolean;
}
```
- **Data fetching:** None
- **Notes:** Used in service listings, booking wizard, therapist pages

#### ImageUpload
- **Type:** Client
- **Location:** `components/ui/ImageUpload.tsx`
- **Purpose:** File upload component with preview and progress
- **Props:**
```typescript
interface Props {
  currentUrl?: string | null;
  bucket: UploadBucket;
  entityId: string;
  onUpload: (url: string) => void;
  aspectRatio?: "square" | "landscape";
  disabled?: boolean;
  label?: string;
}
```
- **Data fetching:** POST /api/admin/upload
- **Notes:** Handles drag-and-drop, file validation, progress tracking

#### Avatar
- **Type:** Client
- **Location:** `components/ui/Avatar.tsx`
- **Purpose:** User avatar with fallback initials
- **Props:**
```typescript
interface Props {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}
```
- **Data fetching:** None
- **Notes:** Shows initials when no image provided

#### Badge
- **Type:** Client
- **Location:** `components/ui/Badge.tsx`
- **Purpose:** Status badges with color coding
- **Props:**
```typescript
interface Props {
  status: string;
  size?: "sm" | "md";
}
```
- **Data fetching:** None
- **Notes:** Color-coded by status (confirmed=green, cancelled=red, pending=yellow)

#### Button
- **Type:** Client
- **Location:** `components/ui/Button.tsx`
- **Purpose:** Consistent button component with variants and loading states
- **Props:**
```typescript
interface Props {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}
```
- **Data fetching:** None
- **Notes:** Handles loading spinner, disabled states

#### Card
- **Type:** Client
- **Location:** `components/ui/Card.tsx`
- **Purpose:** Consistent card container with shadow and border
- **Props:**
```typescript
interface Props {
  children: React.ReactNode;
  className?: string;
}
```
- **Data fetching:** None
- **Notes:** Used for forms, modals, and content sections

#### Input
- **Type:** Client
- **Location:** `components/ui/Input.tsx`
- **Purpose:** Form input with validation and error display
- **Props:**
```typescript
interface Props {
  label?: string;
  type?: "text" | "email" | "password" | "tel" | "number";
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```
- **Data fetching:** None
- **Notes:** Includes label, error states, and accessibility

#### Skeleton
- **Type:** Client
- **Location:** `components/ui/Skeleton.tsx`
- **Purpose:** Loading placeholder with animation
- **Props:**
```typescript
interface Props {
  className?: string;
  width?: string;
  height?: string;
}
```
- **Data fetching:** None
- **Notes:** Used during data loading states

#### Spinner
- **Type:** Client
- **Location:** `components/ui/Spinner.tsx`
- **Purpose:** Loading spinner with size variants
- **Props:**
```typescript
interface Props {
  size?: "sm" | "md" | "lg";
}
```
- **Data fetching:** None
- **Notes:** Used in buttons and forms during async operations

#### Toast
- **Type:** Client
- **Location:** `components/ui/Toast.tsx`
- **Purpose:** Notification toast for success/error messages
- **Props:**
```typescript
interface Props {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
}
```
- **Data fetching:** None
- **Notes:** Auto-dismisses after timeout

## Component patterns

### Server vs Client components
- **Server components:** Used for static content, SEO, and initial data loading
- **Client components:** Used for interactivity, state management, and browser APIs
- **Mixed approach:** Server components wrap client components for optimal performance

### Data fetching patterns
- **Server components:** Fetch data directly in component (parallel loading)
- **Client components:** Use `useApi()` hook or `apiFetch()` utility
- **Forms:** Handle loading states and validation errors

### Error boundaries
- **Route-level:** Error pages for 404, 500, etc.
- **Component-level:** Try/catch in API routes, error display in UI
- **Form validation:** Client-side + server-side validation

### Accessibility patterns
- **Semantic HTML:** Proper heading hierarchy, form labels
- **ARIA labels:** Screen reader support for interactive elements
- **Keyboard navigation:** Tab order and focus management
- **Color contrast:** WCAG compliant color schemes

### Responsive design
- **Mobile-first:** CSS uses mobile-first approach
- **Breakpoints:** Tailwind responsive utilities (sm, md, lg)
- **Navigation:** Collapsible sidebar on mobile
- **Forms:** Full-width on mobile, constrained on desktop

### Performance optimization
- **Image optimization:** Next.js Image component with lazy loading
- **Code splitting:** Dynamic imports for large components
- **Caching:** API response caching where appropriate
- **Bundle size:** Tree-shaking unused components and utilities
