# Serenity Spa — Developer Documentation

## What this app does
Spa booking platform. Customers browse services, pick a therapist, choose a time slot, and confirm a booking. Admins manage services, therapists, schedules, and view bookings/messages.

## Tech stack table
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | Next.js | 16.1.6 | React framework with App Router |
| Frontend | React | 19.2.3 | UI library |
| Frontend | TailwindCSS | 4 | Styling framework |
| Database | Supabase | - | PostgreSQL + Auth + Storage + RLS |
| Email | Resend | ^6.9.3 | Transactional email service |
| Rate Limiting | Upstash Redis | ^1.36.4 | Serverless Redis for auth rate limiting |
| Validation | Zod | ^4.3.6 | Runtime type validation |
| Testing | Vitest | ^1.0.0 | Unit testing framework |
| Linting | ESLint | ^9 | Code quality |

## Quick links
- [Architecture](architecture.md) - System design and patterns
- [Infrastructure](infrastructure/) - External services setup
  - [Supabase](infrastructure/supabase.md) - Database, Auth, Storage
  - [Resend](infrastructure/resend.md) - Email service
  - [Upstash](infrastructure/upstash.md) - Rate limiting
  - [Storage](infrastructure/storage.md) - File uploads
- [Domain](domain/) - Business logic and data models
  - [Booking Flow](domain/booking-flow.md) - End-to-end booking process
  - [Data Models](domain/data-models.md) - TypeScript interfaces
  - [Error Handling](domain/error-handling.md) - Error patterns
- [API](api/routes.md) - Complete API reference
- [Components](components/component-tree.md) - React component inventory
- [Guides](guides/) - Developer workflows
  - [Environment Setup](guides/environment-setup.md) - Getting started
  - [Adding Features](guides/adding-features.md) - Architecture-compliant development

## Project structure overview
```
booking-app/
├── app/                    # Next.js App Router pages + API routes
│   ├── (admin)/           # Admin-only pages (layout + auth)
│   ├── (auth)/            # Auth pages (login, register, reset)
│   ├── (public)/          # Public pages (services, book, dashboard)
│   ├── api/               # All API endpoints
│   ├── auth/callback/     # OAuth + magic link callback
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── booking/           # Booking flow components
│   ├── layout/            # Layout and navigation
│   └── ui/                # Reusable UI components
├── lib/                   # Core application logic
│   ├── domain/            # Types + errors (no external deps)
│   ├── application/       # Business logic services
│   ├── infra/             # External service clients
│   ├── config/            # Constants
│   └── utils/             # Shared utilities
├── docs/                  # This documentation
├── tests/                 # Unit tests
└── [config files]         # package.json, next.config.ts, etc.
```

## Key constants
| Constant | Value | Description |
|----------|-------|-------------|
| LOCK_TIMEOUT_MS | 30000 | Slot lock duration (30 seconds) |
| CURRENCY_LOCALE | 'en-KE' | Locale for price formatting |
| CURRENCY_CODE | 'KES' | ISO currency code (Kenyan Shilling) |

## Architecture principles
- **4-layer hexagonal architecture**: UI → API Routes → Application Services → Infrastructure/Repos → External
- **No Supabase imports outside lib/infra/** - All database access goes through repository pattern
- **No HTTP concerns outside app/api/** - API routes handle HTTP, services handle business logic
- **All errors use domain types** - Consistent error handling with DomainError base class
- **All routes use requireAdmin() or requireCustomer()** - Centralized auth checks
- **TypeScript-first** - All data shapes defined as interfaces, validated with Zod at runtime
- **Email failures never crash bookings** - All email calls wrapped in try/catch with graceful degradation

## Utility functions

### formatPrice(price)
- **File:** `lib/utils/format.ts` 
- **Input:** `number | null | undefined` 
- **Output:** Formatted string e.g. `KSh 2,500` or `—` for null
- **Used by:** `ServiceCard`, `services/[id]/page.tsx`, `admin/services/page.tsx`
