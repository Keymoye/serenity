```
## Refactor Progress — saved 2026-03-04

### COMPLETE
- Stage 0: Audit (ARCHITECTURE_SNAPSHOT.md)
- Stage 1: Design system (tailwind, globals, all UI primitives)
- Stage 2: Public pages
- Stage 3: Auth pages
- Stage 4: Customer portal (dashboard, booking wizard, profile)
- Stage 5 partial:
  - layout.tsx (admin layout + sidebar + breadcrumb)
  - admin/page.tsx (metrics dashboard)
  - admin/bookings/page.tsx (client, full CRUD)
  - admin/therapists/page.tsx (client, full CRUD + slide-over)
  - admin/services/page.tsx (client, full CRUD + slide-over)

### REMAINING
- Stage 5: admin/messages/page.tsx (fetch messages, toggle read, delete, detail panel, filter)
- Stage 5: admin/schedule/page.tsx (time slot management, calendar view, bulk create)
- Stage 6: Quality gate (pnpm build, tsc, lint, grep infra imports, tests)