Completed Tasks
​~~Introduce lib/domain with shared types, zod schemas, and domain error hierarchy, and wire it into existing usage.~~
​~~Convert lib/db modules and other Supabase usages into lib/infra/supabase repositories backed by a single wrapper.~~
​~~Enhance logger.ts with structured, correlation-aware logging and add errorMapper.ts for centralized Domain-to-HTTP mapping.~_ (Note: This item is partially obscured but crossed out)._
​Remaining Tasks
​Application Services: Create booking, admin, and related application services that encapsulate all business rules and orchestrate repositories.
​Controller Refactoring: Refactor booking and admin API route handlers into thin controllers that delegate to application services and use errorMapper.
​UI/Frontend Cleanup: Remove all direct Supabase usage from UI components/pages, routing them exclusively through application services or API endpoints.
​Concurrency & Safety: Centralize locking/confirmation logic in booking.service.ts and add tests to guarantee race-condition safety and double-booking prevention.