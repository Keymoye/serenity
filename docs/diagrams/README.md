# Diagrams

Visual reference for all major areas
of Serenity Spa booking platform.
Each .mmd file renders in VS Code with
the Mermaid Preview extension, or on
GitHub natively.

## How to view
- **VS Code:** Install "Mermaid Preview"
  extension, open any .mmd file,
  press Cmd/Ctrl+Shift+P →
  "Mermaid: Open Preview"
- **GitHub:** .mmd files render
  automatically in markdown and
  as standalone files
- **Online:** paste into
  https://mermaid.live

## Diagram index

| Folder | File | Type | What it shows |
|--------|------|------|--------------|
| architecture/ | layer-stack.mmd | graph TD | 4-layer hexagonal stack |
| architecture/ | request-lifecycle.mmd | sequence | Full HTTP round trip |
| architecture/ | dependency-rules.mmd | graph LR | Allowed + forbidden imports |
| auth/ | middleware-flow.mmd | flowchart | Proxy session check |
| auth/ | login-flow.mmd | sequence | Login + rate limiting |
| auth/ | register-flow.mmd | sequence | Registration flow |
| auth/ | session-guards.mmd | flowchart | requireCustomer/Admin |
| api/ | route-map.mmd | mindmap | All 30+ API routes |
| api/ | auth-levels.mmd | flowchart | Public/Customer/Admin |
| api/ | validation-flow.mmd | flowchart | Zod validation chain |
| booking/ | wizard-steps.mmd | flowchart | 4-step booking wizard |
| booking/ | slot-locking.mmd | sequence | 30s lock mechanism |
| booking/ | double-booking-prevention.mmd | flowchart | 3 prevention layers |
| booking/ | cancellation-flow.mmd | sequence | Cancel + email |
| database/ | entity-relationships.mmd | erDiagram | All 7 tables + FKs |
| database/ | rls-policies.mmd | flowchart | Row-level security |
| database/ | query-patterns.mmd | flowchart | Two-step + parallel patterns |
| storage/ | buckets.mmd | flowchart | 5 buckets + permissions |
| storage/ | upload-flow.mmd | sequence | Admin + customer upload |
| storage/ | filename-conventions.mmd | flowchart | Naming patterns |
| email/ | dispatch-flow.mmd | sequence | Non-blocking email send |
| email/ | email-types.mmd | flowchart | 4 email templates |
| error/ | error-chain.mmd | flowchart | Domain error → HTTP |
| error/ | rate-limit-flow.mmd | flowchart | Upstash + graceful degrade |
| admin/ | admin-flow.mmd | flowchart | Admin panel navigation |
| admin/ | metrics-flow.mmd | sequence | Parallel metrics queries |
| admin/ | service-management.mmd | flowchart | Service CRUD + gallery |
| customer/ | customer-journey.mmd | flowchart | Full user journey |
| customer/ | dashboard-layout.mmd | flowchart | Dashboard data + layout |
| customer/ | profile-flow.mmd | sequence | Avatar upload + save |
| components/ | component-hierarchy.mmd | flowchart | All components + props |
| components/ | navbar-state.mmd | flowchart | Navbar auth states |
| components/ | imageupload-states.mmd | stateDiagram | Upload component states |

> Last updated: Batch 10 (March 2026)
> Total diagrams: 33
