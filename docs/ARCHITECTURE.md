Last updated: March 5, 2026 | Auto-generated from source

# System Architecture Overview

This document describes the current architecture of the `booking-app` project based on the live source code.
It is entirely derived from the codebase; previous documentation may be outdated and is superseded by this file.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React Server/Client components
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL backend + built‑in auth)
- **Validation**: Zod schemas located under `lib/utils/validation.ts`
- **Testing**: Vitest with Jest‑DOM/Testing‑Library for component tests
- **Styling**: Tailwind CSS (see `tailwind.config.ts`)
- **Utilities**: `node` scripts for diagrams, ESLint for linting

Dependencies are declared in `package.json` and include `@supabase/supabase-js`, `zod`, `next`, `react`, etc.

## Layer Structure

The code adheres to a strict **4‑layer hexagonal architecture**. Each layer lives under a clear folder path.

| Layer | Folder(s) | Responsibility | Allowed Imports / Dependencies |
|-------|-----------|----------------|---------------------------------|
| **1 – Domain & Infrastructure** | `lib/domain/`, `lib/infra/supabase/` | Domain types, error classes, and all Supabase query implementations | No higher layers may import these; they may only depend on core Node/TS libs and Supabase SDK |
| **2 – Application Services** | `lib/application/` | Business use‑cases, orchestration, input validation, domain error throwing | May import domain types, infra repos, and other service modules; no UI or HTTP code |
| **3 – API Controllers** | `app/api/**/*.ts` (route handlers) | HTTP request handlers: parse/validate input, call services, map errors to HTTP responses | May import services, Zod schemas, error mapper, and Supabase auth helpers; no UI code |
| **4 – UI Presentation** | `app/`, `components/` | React Server & Client components, pages, layouts, client‑side logic | May call services (server components) or fetch `/api/*` (client components) and import domain types; must never access Supabase directly |

### Dependency Rules

- **Downward only**: UI → API → Services → Infra/Domain
- Services **must not** import API modules or UI components
- Infrastructure modules may import domain types but never services or API
- Zod schemas for request validation live in `lib/utils/validation.ts` and are imported by API routes or services as needed
- Domain models (interfaces/types) are re‑exported from `lib/domain/index.ts`

## Folder Map (excerpt)

```
app/                      # Next.js app router (pages, layouts, api routes)
components/               # Shared UI components
lib/
  application/            # Business logic services
  domain/                 # Interfaces, types, Zod schemas, errors
  infra/supabase/         # Supabase client creation & repository implementations
  utils/                  # Logger, validation, error mapping
middleware.ts             # Route protection middleware
next.config.ts, tsconfig.json, package.json, tailwind.config.ts
```

## Notes & Observations

- Supabase clients are separated by role (`userClient`, `adminClient`, `authClient`, `dataClient`).
- Authentication state is accessed via `getCurrentUser()` (returns `user` + `profile`), used across APIs and UI.
- All API routes generate a correlation ID, use centralized logger, and map domain errors using `errorMapper`.
- Zod schemas are reused between domain and API to ensure consistency.

> ⚠️ This document is generated automatically from the source code on **March 5 2026**. Any manual edits will be overwritten the next time the docs are regenerated.
