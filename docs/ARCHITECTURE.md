**SERENITY SPA**

**UI LAYER REFACTOR**

_MASTER ENGINEERING PROMPT_

_A comprehensive, stage-gated, architecture-compliant guide_

_for refactoring the presentation layer of a 4-layer hexagonal Next.js + Supabase application_

| Target Stack | Next.js 16 · TypeScript · Supabase |
| --- | --- |
| Architecture | 4-Layer Hexagonal (Domain→App→API→UI) |
| UI Framework | React Server + Client Components |
| Styling | Tailwind CSS + Design System |
| Scope | UI Presentation Layer Only |
| Date | March 2026 |

# **1\. Preamble & Context**

You are a senior full-stack engineer pair-programming on the Serenity Spa booking application - a production-grade Next.js 16 + Supabase system that implements a strict 4-layer hexagonal architecture. The backend (Domain, Application Services, Infrastructure/Repository, and API Controller layers) is architecturally complete and compliant at 100%. Your sole mandate in this engagement is to refactor the UI Presentation Layer.

This document is your single source of truth. Follow every instruction in the exact order specified. Do not skip stages. Do not perform lint or test fixes until Stage 6. Do not modify any file outside the UI layer scope unless explicitly instructed.

**⚠ Critical Constraint - Documentation Lag**

The architecture documentation provided to you (ARCHITECTURE.md) may be up to one commit behind the actual codebase.

You MUST treat the live codebase as the authoritative source of truth, not the documentation.

Before writing a single line of UI code, you will perform a full low-level codebase audit (Stage 0) and produce an

up-to-date Architecture Snapshot. Only then will you begin refactoring.

# **2\. Architecture Overview - The Contract You Must Honour**

The codebase implements a strict hexagonal 4-layer architecture. Every UI decision you make must respect this contract. Violations are not acceptable.

## **2.1 Layer Diagram**

**4-Layer Stack (read top-to-bottom - dependencies flow downward only)**

┌─────────────────────────────────────────────────────┐

│ LAYER 4 - UI PRESENTATION │

│ app/ components/ │

│ Server components call app services directly │

│ Client components call /api/\* endpoints only │

└────────────────────┬────────────────────────────────┘

│ HTTP fetch / server-side call

┌────────────────────▼────────────────────────────────┐

│ LAYER 3 - API CONTROLLER │

│ app/api/\*\* │

│ Validates inputs · Calls services · Maps errors │

└────────────────────┬────────────────────────────────┘

│ service calls

┌────────────────────▼────────────────────────────────┐

│ LAYER 2 - APPLICATION SERVICES │

│ lib/application/\*\* │

│ Business logic · Zod validation · Domain errors │

└────────────────────┬────────────────────────────────┘

│ repository calls

┌────────────────────▼────────────────────────────────┐

│ LAYER 1 - INFRASTRUCTURE / DOMAIN │

│ lib/infra/\*\* lib/domain/\*\* │

│ Supabase queries · Domain types · Error hierarchy │

└─────────────────────────────────────────────────────┘

## **2.2 UI Layer Rules - Non-Negotiable**

| RULE | ENFORCEMENT |
| --- | --- |
| ✅ Zero Supabase imports in UI | Grep check before commit |
| ✅ Server components → application services | No fetch() calls server-side |
| ✅ Client components → /api/\* only | No direct service imports in 'use client' files |
| ✅ Import types from lib/domain only | Never redefine domain types in UI |
| ✅ Handle all API error codes gracefully | Every error.code mapped to user message |
| ✅ Use logger for errors and tracking | No raw console.log |
| ✅ No business logic in components | Components render; services decide |
| ✅ Custom API hooks wrap fetch calls | No raw fetch() inline in components |

**STAGE 0 Codebase Audit & Architecture Snapshot**

_Before touching a single component, understand exactly what exists_

Stage 0 is mandatory. Every subsequent stage depends on the accurate snapshot you produce here. Take your time.

## **3.1 File System Exploration**

Run the following commands to map the entire codebase structure. Read every output carefully.

find app/ components/ lib/ -type f -name '\*.tsx' -o -name '\*.ts' | sort

find app/ -type f -name 'page.tsx' | sort

find app/ -type f -name 'layout.tsx' | sort

find components/ -type f | sort

find lib/ -type d | sort

cat package.json

cat tailwind.config.ts || cat tailwind.config.js

## **3.2 Domain Layer Audit**

Read every file in lib/domain/. For each file record: interfaces exported, Zod schemas exported, error classes exported.

cat lib/domain/booking.types.ts

cat lib/domain/therapist.types.ts

cat lib/domain/service.types.ts

cat lib/domain/timeSlot.types.ts

cat lib/domain/admin.types.ts

cat lib/domain/errors.ts

Check for any domain files not listed above:

ls lib/domain/

## **3.3 Application Services Audit**

Read every service file in lib/application/. For each service record: use-case functions exported, context interface, dependencies interface.

ls lib/application/

cat lib/application/booking.service.ts

cat lib/application/admin.service.ts

cat lib/application/service.service.ts

cat lib/application/auth.service.ts

cat lib/application/profile.service.ts

cat lib/application/contact.service.ts

cat lib/application/therapist.service.ts

## **3.4 API Controller Layer Audit**

Read every route.ts file to understand what endpoints exist, what they return, and what error codes they emit.

find app/api -name 'route.ts' | sort | xargs -I{} sh -c 'echo "=== {} ==="; cat {}'

For each route record: HTTP method, auth required (Y/N), success response shape, error codes possible.

## **3.5 Existing UI Audit**

Read every existing page and component. For each file record: server or client component, what data it fetches, what it currently renders, what it is missing.

find app -name 'page.tsx' | sort | xargs -I{} sh -c 'echo "=== {} ==="; cat {}'

find components -name '\*.tsx' | sort | xargs -I{} sh -c 'echo "=== {} ==="; cat {}'

## **3.6 Produce the Architecture Snapshot Document**

Once you have read everything above, produce a markdown file named ARCHITECTURE_SNAPSHOT.md in the project root. This file replaces any outdated documentation. It must contain ALL of the following sections:

**Required Contents of ARCHITECTURE_SNAPSHOT.md**

\### 1. Domain Types Inventory

- Full list of interfaces, type aliases, Zod schemas, error classes

\### 2. Application Services Inventory

- Each service file, each exported function with signature and return type

\### 3. API Routes Inventory

- Each route: method, path, auth, request body shape, success response shape, error codes

\### 4. Existing UI Inventory

- Each page/component: server or client, what it fetches, current gaps vs real-world requirements

\### 5. Architecture Delta

- Differences discovered between the provided ARCHITECTURE.md and the live codebase

\### 6. UI Refactor Plan

- Prioritised list of components and pages to create/rewrite, justified by real-world spa app requirements

**🔴 CHECKPOINT 0 - Do Not Proceed Without Confirmation**

After producing ARCHITECTURE_SNAPSHOT.md, STOP and report the following to the user:

1\. Summary of architecture delta (what was out of date in the docs)

2\. Full list of UI pages and components you found, with status (compliant / shallow / missing)

3\. Your proposed refactor plan (which pages/components will be created or rewritten and why)

4\. Ask: 'Do you confirm this plan? Shall I proceed to Stage 1?'

Do NOT begin Stage 1 until the user explicitly confirms.

**STAGE 1 Design System & Component Foundation**

_Establish the visual language before writing any page_

Before writing a single page component, you will establish the design system. Every subsequent page and component must consume this system - never deviate from it inline.

## **4.1 Tailwind Theme Extension**

Extend tailwind.config.ts with a bespoke spa design system. The aesthetic must convey luxury, calm, and professionalism - warm stone, deep teal, soft cream.

**Theme Requirements (implement all of the following)**

Colors:

brand.\* - deep teal palette (50 to 900)

accent.\* - warm gold/amber palette

stone.\* - warm neutral palette (extend default)

spa.\* - custom: spa-cream, spa-mist, spa-charcoal

Typography (add to theme.extend.fontFamily):

display - serif font for headings (e.g. Playfair Display or Cormorant Garamond)

body - clean sans for body copy (e.g. DM Sans or Lato)

mono - consistent mono for codes/refs (e.g. JetBrains Mono)

Spacing - add custom spacing tokens: 18, 22, 72, 96

BorderRadius - add 'xl2': '1.25rem', '4xl': '2rem'

BoxShadow - add 'luxury': multi-layer warm shadow, 'card': subtle elevation

Animation - add 'fadeIn', 'slideUp', 'shimmer' keyframes

## **4.2 Global Layout (app/layout.tsx)**

Rewrite the root layout. It must include:

- Google Fonts import for display + body typefaces (next/font/google)
- Global CSS variables for brand colors mapping to Tailwind tokens
- A &lt;SpaNavbar&gt; server component (see 4.3)
- A &lt;SpaFooter&gt; server component (see 4.3)
- Correct metadata (title template, description, Open Graph)
- Smooth scroll behaviour and body background in spa-cream

## **4.3 Core Layout Components**

Create the following components in components/layout/. These are server components unless noted.

| Component | Requirements |
| --- | --- |
| SpaNavbar.tsx | Logo, nav links (Services, About, Contact), auth state (login/register vs. Dashboard/Logout), mobile hamburger menu. Sticky with backdrop-blur on scroll. |
| SpaFooter.tsx | Brand mark, tagline, nav columns (Services, Company, Legal), social links, copyright. Rich layout with subtle texture. |
| PageHero.tsx | Reusable hero section accepting title, subtitle, ctaLabel, ctaHref, imageSrc. Full-bleed with overlay gradient. |
| SectionWrapper.tsx | Consistent section padding and max-width container. Accepts background variant prop. |
| LoadingSpinner.tsx | Branded, animated loading indicator. Used for Suspense boundaries. |
| ErrorBoundary.tsx (client) | React Error Boundary wrapping async sections. Shows user-friendly error with retry. |
| ConfirmDialog.tsx (client) | Reusable modal for destructive action confirmation. |

## **4.4 Base UI Component Library**

Create components/ui/. These are purely presentational and take no data-fetching concerns.

| Component | Description |
| --- | --- |
| Button.tsx | Primary, secondary, ghost, danger variants. Size sm/md/lg. Loading state with spinner. Disabled state. |
| Input.tsx | Labelled input with error state, hint text, required indicator. Accessible (aria-describedby). |
| Select.tsx | Styled native select with label and error. Accepts options array. |
| TextArea.tsx | Labelled textarea with character count and error state. |
| Badge.tsx | Status badge: confirmed (green), pending (amber), cancelled (red), available (teal). |
| Card.tsx | Content card with optional header, body, footer slots. Variants: default, elevated, bordered. |
| Avatar.tsx | Circular avatar from URL with fallback initials. Sizes: sm, md, lg. |
| Skeleton.tsx | Shimmer placeholder for loading states. Variants: text, card, avatar, table-row. |
| EmptyState.tsx | Illustrated empty state with icon, heading, message, optional CTA. |
| Toast.tsx (client) | Notification toasts: success, error, warning, info. Auto-dismiss. Stack safely. |
| StepIndicator.tsx | Multi-step progress indicator for booking wizard. |
| DatePicker.tsx (client) | Calendar-style date selector. Highlights unavailable dates. Min date = today. |
| TimeSlotGrid.tsx (client) | Visual grid of time slots. Available (selectable), locked (amber), booked (grey), selected (teal). |
| PriceTag.tsx | Formatted price display with optional duration label. |
| RatingStars.tsx | Star rating display (read-only). 1-5 stars. |

**🔴 CHECKPOINT 1 - Design System Review**

After completing Stage 1, STOP and report to the user:

1\. Confirm tailwind.config.ts has been updated with the full design system

2\. List every component created in components/layout/ and components/ui/

3\. Show the colour palette and typography choices you made

4\. Ask: 'Design system complete. Shall I proceed to Stage 2 - Public Pages?'

**STAGE 2 Public-Facing Pages**

_Homepage, Services, Service Detail, About, Contact_

These pages are the face of the business. They must feel like a premium spa website - immersive, rich in content, designed to convert visitors into bookings. All are server components calling application services directly.

## **5.1 Homepage - app/page.tsx**

The homepage is the brand centrepiece. It must include all of the following sections:

| Section | Requirements |
| --- | --- |
| Hero | Full-viewport hero with headline, sub-headline, dual CTAs (Book Now → /book, View Services → /services). Background image with gradient overlay. Animated entrance. |
| Social Proof Strip | Horizontal band: star rating (e.g. 4.9 ★), review count, years in business, awards. Simple, impactful numbers. |
| Featured Services | 3-4 cards from listPublicServices(). Each shows name, category, duration, price, Book Now link. Fetched server-side. |
| Meet Our Therapists | 2-3 therapist cards from listPublicTherapists(). Photo, name, title, short bio. Fetched server-side. |
| How It Works | 3-step visual: Choose Service → Pick Time → Relax. Numbered with icons. |
| Testimonials | 2-3 rich testimonial cards with quote, client name, service received, rating. |
| CTA Banner | Full-width section: 'Ready to unwind?' with Book Your Session CTA. |

## **5.2 Services Page - app/(public)/services/page.tsx**

Must feel like a spa treatment menu, not a plain list. Requirements:

- Fetch all active services via listPublicServices() server-side
- Filter bar (client island): filter by category, sort by price/duration
- Service cards in a responsive grid - image placeholder, category badge, name, description excerpt, duration, price, Book button
- Category grouping headings when no filter active
- Empty state if no services match filter

## **5.3 Service Detail Page - app/(public)/services/\[id\]/page.tsx**

A rich, immersive treatment detail page. Requirements:

- Fetch service detail via getPublicServiceDetail(id) server-side
- Fetch assigned therapists via listTherapistsForService({ serviceId }) server-side
- Hero image section with service name, category, duration, price
- Full description section with benefits list
- Therapist grid - photo, name, title, short bio for each assigned therapist
- Sticky Book Now CTA bar at bottom of screen on mobile
- 'What to Expect' section with preparation tips and aftercare
- Breadcrumb navigation (Home > Services > \[Service Name\])
- notFound() if service does not exist

## **5.4 About Page - app/(public)/about/page.tsx**

The spa's story and values. Requirements:

- Brand story section with rich editorial layout
- Core values grid (Wellness, Expertise, Tranquility, Community)
- Team section - fetch all public therapists, display as portrait cards
- Spa facility highlights with icons
- Location section with embedded map component (MapEmbed.tsx)
- 'Join Our Team' CTA linking to contact page

## **5.5 Contact Page - app/(public)/contact/page.tsx**

A conversion-optimised contact page. Requirements:

- ContactForm client component (see below) for enquiries
- Spa contact details: address, phone, email, hours
- MapEmbed.tsx component
- FAQ accordion - common questions answered

**5.5.1 ContactForm Component - components/forms/ContactForm.tsx (client)**

Rewrite the existing ContactForm to be production-grade:

- Fields: Full Name, Email, Phone (optional), Subject (select), Message
- Full client-side validation before submit with inline field errors
- POST to /api/contact - handle all error codes including RATE_LIMIT_EXCEEDED
- Success state: replace form with animated confirmation message
- Loading state: disable form and show spinner in submit button
- Character counter on Message field

**🔴 CHECKPOINT 2 - Public Pages Review**

After completing Stage 2, STOP and report to the user:

1\. Confirm every public page has been rewritten (list each file)

2\. Confirm all server-side data fetching calls application services (no fetch() in server components)

3\. Confirm no Supabase imports exist in any UI file (show grep result)

4\. Ask: 'Public pages complete. Shall I proceed to Stage 3 - Auth Pages?'

**STAGE 3 Authentication Pages**

_Login, Register, Password Reset - polished and production-grade_

Auth pages are first impressions for registered users. They must be clean, branded, and handle every error scenario gracefully. All are client components posting to /api/auth/\* endpoints.

## **6.1 Login Page - app/(auth)/auth/login/page.tsx**

- Email + Password fields with full validation
- Show/hide password toggle
- Forgot password link → /auth/reset-password
- POST to /api/auth/login - handle INVALID_CREDENTIALS, ACCOUNT_LOCKED, VALIDATION_ERROR
- Redirect to /dashboard on success
- 'New here? Create an account' link
- Google OAuth button placeholder (if OAuth will be added later - clearly labelled 'Coming Soon')
- Loading state on submit button

## **6.2 Register Page - app/(auth)/auth/register/page.tsx**

- Full Name, Email, Password, Confirm Password fields
- Password strength indicator (weak/fair/strong/very strong)
- Password requirements checklist (min 8 chars, uppercase, number, symbol)
- Terms of service checkbox (required)
- POST to /api/auth/register - handle CONFLICT (email in use), VALIDATION_ERROR
- Success state: 'Check your email to confirm your account'
- 'Already have an account? Login' link

## **6.3 Reset Password Page - app/(auth)/auth/reset-password/page.tsx**

- Single email field
- POST to /api/auth/reset-password
- Success state: instruction message (do not confirm email existence for security)
- Back to login link

## **6.4 Reset Password Confirm Page - app/(auth)/auth/reset-password/confirm/page.tsx**

- New Password + Confirm Password fields
- Password strength indicator
- POST to /api/auth/reset-password/confirm
- Success: redirect to login with success toast
- Error handling for expired/invalid token

**🔴 CHECKPOINT 3 - Auth Pages Review**

After completing Stage 3, STOP and report to the user:

1\. Confirm all four auth pages have been rewritten (list files)

2\. Confirm every error code returned by auth APIs is handled with a user-facing message

3\. Confirm no auth page directly imports Supabase

4\. Ask: 'Auth pages complete. Shall I proceed to Stage 4 - Customer Portal?'

**STAGE 4 Customer Portal**

_Dashboard, Booking Wizard, Profile - the core product experience_

The customer portal is where the real product value is delivered. It must match the richness of the backend - the booking wizard must implement the full lock-and-confirm race-condition-safe flow, and the dashboard must surface meaningful data to the customer.

## **7.1 Customer Dashboard - app/(customer)/dashboard/page.tsx**

Server component. Requires authentication (use requireCustomer()). Must display:

| Section | Requirements |
| --- | --- |
| Welcome Header | Personalised greeting with customer name, current date/time, brief motivational message tied to wellness. |
| Quick Stats Row | Total bookings, upcoming bookings count, last visit date, loyalty tier (if applicable). Card-based layout. |
| Upcoming Appointments | List of confirmed/pending bookings in chronological order. Each card: service name, therapist name, date/time, status badge, Cancel button. Fetched via getUserBookings(). |
| Past Appointments | Last 5 completed bookings. Each card: service name, therapist, date, reference code. Collapsed by default, expandable. |
| Book Again CTA | Prominent banner: 'Ready for your next session?' with Book Now link. |
| Empty State | If no bookings: illustrated empty state with 'Book Your First Session' CTA. |

**7.1.1 Cancel Booking (client island)**

Create components/booking/CancelBookingButton.tsx (client). It must:

- Show a ConfirmDialog before proceeding
- DELETE /api/booking/:id (or the equivalent endpoint - check your API routes)
- Handle error states with Toast notification
- Optimistically remove the booking card on success (or re-fetch)

## **7.2 Booking Wizard - app/(customer)/book/page.tsx + components/booking/BookingWizard.tsx**

This is the most critical UI component. It must implement the full 3-step race-condition-safe booking flow exactly as defined in the architecture.

**Step 1 - Service & Therapist Selection**

- Fetch services from GET /api/services (client-side on mount)
- Service grid with cards - name, category, duration, price, description
- On service select: fetch therapists from GET /api/services/:id/therapists
- Therapist cards - photo, name, title, bio. 'Any Available' option always shown first
- Selected state visually highlighted
- Continue button disabled until service selected

**Step 2 - Date & Time Selection**

- DatePicker component - only future dates selectable, default to today
- On date change: POST to /api/booking/availability with { serviceId, therapistId, date }
- Display result in TimeSlotGrid component
- Loading skeleton while availability loads
- On slot select: POST to /api/booking/lock immediately
- If SLOT_TAKEN: show error toast, refresh availability, do not advance
- If lock succeeds: start 15-minute countdown timer (visible in UI)
- If timer expires: show warning, invalidate selection, return to slot picker
- Continue button disabled until slot locked

**Step 3 - Confirmation & Details**

- Booking summary card: service, therapist, date/time, price
- Notes textarea (optional, max 500 chars)
- POST to /api/booking/confirm on submit
- Handle SLOT_TAKEN (slot lost during confirmation) - return to step 2 with error
- Handle VALIDATION_ERROR - show field-level errors
- Success: redirect to /dashboard with success toast
- Back navigation between steps must preserve selections

**7.2.1 StepIndicator Usage**

The StepIndicator component must be rendered at the top of BookingWizard showing the current step. Steps: 1. Select Service → 2. Choose Time → 3. Confirm.

**Architecture Compliance Check - BookingWizard**

✅ All API calls go through /api/\* endpoints (never direct service imports)

✅ Lock-then-confirm flow is implemented in the correct order

✅ SLOT_TAKEN (409) handled at both lock and confirm steps

✅ Countdown timer prevents stale locks from being confirmed

✅ Error codes from errorMapper are handled by name (not just HTTP status)

✅ useBookingWizard hook encapsulates all state and API calls (no raw fetch in JSX)

## **7.3 Profile Page - app/(customer)/profile/page.tsx**

Server component for initial render + client islands for forms. Requirements:

- Profile header: avatar (initials fallback), full name, email, member since date, role badge
- Update Profile form (client): full name, phone. PATCH /api/profile.
- Change Password form (client): old password, new password, confirm. POST /api/profile/password.
- Password strength indicator on new password field
- Each form has its own loading/success/error state
- Success states show Toast notification

**🔴 CHECKPOINT 4 - Customer Portal Review**

After completing Stage 4, STOP and report to the user:

1\. Confirm dashboard, booking wizard, and profile pages are complete (list files)

2\. Confirm booking wizard implements lock-then-confirm in correct order

3\. Confirm SLOT_TAKEN is handled at both Step 2 (lock) and Step 3 (confirm)

4\. Confirm countdown timer is implemented

5\. Show the API call sequence for a full booking (what fetches happen and in what order)

6\. Ask: 'Customer portal complete. Shall I proceed to Stage 5 - Admin Portal?'

**STAGE 5 Admin Portal**

_Bookings, Therapists, Services, Schedule, Messages - operations-grade UI_

The admin portal must be a professional operations tool - data-dense, action-oriented, and reliable. It should feel like a real business management system, not a prototype. All admin pages are client components fetching from /api/admin/\* endpoints.

## **8.1 Admin Layout - app/(admin)/layout.tsx**

Create a dedicated admin layout. Requirements:

- Persistent left sidebar with navigation to all admin sections
- Sidebar items: Dashboard, Bookings, Services, Therapists, Schedule, Messages
- Active route highlight
- Collapsible on mobile (hamburger)
- Admin user info in sidebar footer (name, email, logout button)
- Breadcrumb in main content area header
- Role guard: if not admin role, redirect to /dashboard

## **8.2 Admin Dashboard - app/(admin)/admin/page.tsx**

Overview page with KPIs. Requirements:

- Today's booking count
- Pending bookings requiring action
- Total active services and therapists
- Unread messages count
- Recent bookings table (last 10)
- Quick action buttons: Add Service, Add Therapist, View Messages

## **8.3 Bookings Management - app/(admin)/admin/bookings/page.tsx**

Full booking management interface. Requirements:

- Fetch all bookings from GET /api/admin/bookings
- Data table: reference code, customer (email), service, therapist, date/time, status badge, actions
- Filter bar: by status (all/confirmed/pending/cancelled), by date range, search by reference
- Inline status update: PUT /api/admin/bookings - status dropdown per row
- Delete booking: DELETE /api/admin/bookings - with ConfirmDialog
- Pagination or virtual scroll for large datasets
- Skeleton loading state for initial load
- Empty state if no bookings match filter

## **8.4 Therapist Management - app/(admin)/admin/therapists/page.tsx**

CRUD for therapists. Requirements:

- Fetch all therapists from GET /api/admin/therapists
- Therapist cards or table with: photo, name, title, active status badge, Edit, Delete actions
- Add Therapist button opens inline form or slide-over panel
- TherapistForm component (rewrite existing) - fields: name, title, photo URL, bio, is_active toggle
- Edit populates form with existing data - PUT /api/admin/therapists
- Delete with ConfirmDialog - DELETE /api/admin/therapists
- POST /api/admin/therapists for create
- All operations give Toast feedback

## **8.5 Service Management - app/(admin)/admin/services/page.tsx**

CRUD for services. Requirements:

- Fetch from GET /api/admin/services
- Services table: name, category, duration, price, active status, actions
- ServiceForm - fields: name, category, duration_minutes, price, is_active
- Inline create/edit/delete with Toast feedback
- Category grouping in the table

## **8.6 Schedule Management - app/(admin)/admin/schedule/page.tsx**

Time slot management. This is operationally critical. Requirements:

- Fetch time slots from GET /api/admin/time-slots
- Calendar/week-view layout showing slots by therapist and day
- Slot cards: start/end time, availability status, locked status
- Add slot form: therapist, date, start time, end time - POST /api/admin/time-slots
- Bulk slot creation: repeat pattern (e.g. every weekday 9am-5pm for next 4 weeks)
- Delete slot with confirmation
- Visual distinction: available (teal), locked (amber), booked (grey)

## **8.7 Messages - app/(admin)/admin/messages/page.tsx**

Contact message inbox. Requirements:

- Fetch from GET /api/admin/messages
- Message list: sender name, subject, date, read/unread badge
- Click message to expand full content in a detail panel
- Toggle read status: PUT /api/admin/messages
- Unread count in sidebar badge
- Filter: all / unread / read

**🔴 CHECKPOINT 5 - Admin Portal Review**

After completing Stage 5, STOP and report to the user:

1\. Confirm all admin pages and the admin layout are complete (list files)

2\. Confirm all admin pages use /api/admin/\* endpoints only (no direct service imports)

3\. Confirm every CRUD operation has appropriate loading, success, and error states

4\. Confirm admin layout enforces role guard for non-admin users

5\. Ask: 'Admin portal complete. Shall I proceed to Stage 6 - Quality & Compliance?'

**STAGE 6 Quality, Compliance & Cleanup**

_Lint, types, tests - the final gate before handoff_

This is the only stage where you address linting errors, TypeScript errors, and tests. Do not fix these in earlier stages - collect them and address them systematically here.

## **9.1 TypeScript Compliance**

Run and fix all type errors:

npx tsc --noEmit

For each error: trace it to the affected component, fix the root cause. Do not use @ts-ignore or as any to suppress errors - fix them properly. Common issues to expect:

- Domain types not imported from lib/domain - fix import paths
- API response shapes not typed - add proper response interfaces
- Event handler types missing - add React.ChangeEvent&lt;HTMLInputElement&gt; etc.
- Props interfaces missing or incorrect - define them explicitly

## **9.2 ESLint Compliance**

npx next lint

Fix all errors. Warnings may be addressed if time permits. Common issues:

- Missing key props in lists
- useEffect dependency arrays
- next/image instead of &lt;img&gt;
- Unused imports

## **9.3 Architecture Compliance Audit**

Run the following grep checks and confirm zero violations:

grep -r 'createBrowserClient\\|createServerClient\\|supabase' app/ components/ --include='\*.tsx' --include='\*.ts'

Expected output: zero matches. If any found, remove them and replace with the correct API call.

grep -r "from '@/lib/application" app/ components/ --include='\*.tsx'

This should only match in server components (no 'use client' at top of file). Any match in a client component is a violation.

grep -r "from '@/lib/infra" app/ components/ --include='\*.tsx'

Expected output: zero matches. Infrastructure must never be imported in UI.

## **9.4 Test Updates**

If any existing tests reference UI components you have rewritten, update them. Do not delete tests - update them to match the new component contracts. Run:

pnpm test

All pre-existing tests must still pass after the UI refactor. The UI layer refactor must not break backend tests. If a test fails due to a non-UI reason, do not modify the backend code - report it to the user.

## **9.5 Accessibility Check**

- All interactive elements have accessible labels (aria-label or associated &lt;label&gt;)
- All images have descriptive alt text
- Colour contrast meets WCAG AA minimum (4.5:1 for text)
- Keyboard navigation works for all forms and the booking wizard
- Focus ring is visible on all interactive elements

## **9.6 Performance Check**

- All images use next/image with appropriate width/height and priority on hero images
- Loading states (Skeleton) are used consistently - no layout shift
- Server components are used wherever possible (no unnecessary 'use client')
- No blocking data fetches in client components on mount without Suspense

**🔴 CHECKPOINT 6 - Final Quality Gate**

After completing Stage 6, STOP and produce a final Refactor Report to the user:

1\. TypeScript: zero errors (show tsc output)

2\. ESLint: zero errors (show lint output)

3\. Architecture: zero violations (show grep results)

4\. Tests: all passing (show test output)

5\. Summary of all pages and components created or rewritten

6\. Summary of any deviations from this plan (with justification)

7\. Any recommendations for future improvements (out of scope for this refactor)

Then ask: 'Refactor complete. Would you like me to produce the final updated ARCHITECTURE.md?'

# **10\. Global Rules & Anti-Patterns**

These rules apply at every stage. Violating them makes the refactor architecturally non-compliant.

## **10.1 What You MUST Do**

- Always read ARCHITECTURE_SNAPSHOT.md before making any structural decision
- Always use domain types from lib/domain - never redefine them in UI
- Always wrap fetch calls in dedicated hooks (e.g. useBookingWizard, useAdminTherapists)
- Always handle loading, success, and error states for every async operation
- Always use the design system - never hardcode hex colours or font families inline
- Always generate meaningful TypeScript prop interfaces for every component
- Always use next/image for images, next/link for navigation
- Always use the logger for errors (not console.error)

## **10.2 What You Must NEVER Do**

- ❌ Import Supabase client anywhere in app/ or components/
- ❌ Import from lib/application in a 'use client' component
- ❌ Import from lib/infra anywhere in UI
- ❌ Define business logic inside a React component
- ❌ Use raw fetch() inline in JSX - always extract to a hook or handler
- ❌ Skip error handling for any API call
- ❌ Use any or @ts-ignore to suppress TypeScript errors
- ❌ Delete or break existing backend tests
- ❌ Modify files in lib/domain, lib/application, lib/infra, or app/api
- ❌ Skip a CHECKPOINT - confirmations are mandatory

## **10.3 Component Decision Tree**

For each component you create, ask these questions in order:

- Does it need interactivity (onClick, onChange, useState, useEffect)?
- YES → 'use client' component. Call /api/\* endpoints only.
- NO → Server component. Can call application services directly.
- Does it fetch data from multiple sources or compose server + client parts?
- YES → Server component wrapper + client island(s) for interactive parts.
- Is it purely presentational (no data fetching, no state)?
- YES → Plain server component, no 'use client'. Accept typed props only.

# **11\. Appendix - Reference Patterns**

## **11.1 Correct Server Component Data Fetching Pattern**

**Pattern: Server Component → Application Service**

// app/(customer)/dashboard/page.tsx

import { requireCustomer } from '@/lib/services/authService';

import { getUserBookings } from '@/lib/application/booking.service';

import { logger } from '@/lib/utils/logger';

import type { Booking } from '@/lib/domain/booking.types';

export default async function DashboardPage() {

const current = await requireCustomer();

let bookings: Booking\[\] = \[\];

try {

bookings = await getUserBookings({ userId: current.user.id, role: current.profile.role });

} catch (error) {

logger.error('Failed to load bookings', error);

}

return &lt;DashboardView bookings={bookings} user={current} /&gt;;

}

## **11.2 Correct Client Component API Call Pattern**

**Pattern: Custom Hook → /api/\* Endpoint**

// hooks/useBookingWizard.ts

'use client';

import { useState, useCallback } from 'react';

import { logger } from '@/lib/utils/logger';

import type { Service, TimeSlot, Booking } from '@/lib/domain/...';

export function useBookingWizard() {

const \[step, setStep\] = useState(1);

const \[selectedService, setSelectedService\] = useState&lt;Service | null&gt;(null);

const lockSlot = useCallback(async (timeSlotId: string) => {

const res = await fetch('/api/booking/lock', {

method: 'POST', headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({ timeSlotId }),

});

const json = await res.json();

if (!json.success) {

if (json.error?.code === 'SLOT_TAKEN') throw new Error('SLOT_TAKEN');

throw new Error(json.error?.message ?? 'Lock failed');

}

return true;

}, \[\]);

return { step, setStep, selectedService, setSelectedService, lockSlot };

}

## **11.3 Stage Summary Table**

| **Stage** | **Name** | **Deliverables** |
| --- | --- | --- |
| 0   | Codebase Audit | ARCHITECTURE_SNAPSHOT.md, full inventory |
| 1   | Design System | tailwind.config, components/layout, components/ui |
| 2   | Public Pages | Homepage, Services, Detail, About, Contact |
| 3   | Auth Pages | Login, Register, Reset Password (x2) |
| 4   | Customer Portal | Dashboard, BookingWizard, Profile |
| 5   | Admin Portal | Admin layout, 6 management pages |
| 6   | Quality Gate | Zero type/lint errors, architecture compliance |

_End of Serenity Spa UI Refactor Master Engineering Prompt - v1.0 - March 2026_