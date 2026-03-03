# Testing

This document describes the project's testing strategy and recommended commands.

Goals
- Fast developer feedback for unit and component tests.
- Integration tests for server helpers and API routes.
- Optional E2E tests for critical user flows.
- CI checks to gate PRs (typecheck, lint, tests).

Test types

1) Unit tests
- Tooling: Vitest
- Targets: pure functions, validation schemas in `lib/utils/validation.ts`, small helpers in `lib/*`.

2) Component tests
- Tooling: Vitest + `@testing-library/react` in a `jsdom` environment.
- Targets: React components in `components/` and small pages that can be rendered without a full browser.

3) Integration tests
- Tooling: Vitest (node) and mocking (`vi.mock`) or a disposable test Supabase project.
- Targets: `lib/db/*` helpers and `app/api/*` routes. Use mocked Supabase clients for fast, deterministic tests or real test DB for full integration.

4) End-to-end tests (optional)
- Tooling: Playwright (recommended) or Cypress.
- Targets: booking flows, admin flows, and authentication flows. Keep a small stable suite of core flows.

Static checks
- Type checking: `tsc --noEmit`
- Linting: `eslint .`

Local commands

Install dependencies:

```bash
pnpm install
```

Run unit + component tests:

```bash
pnpm run test
```

Run tests in watch mode:

```bash
pnpm run test:watch
```

Run tests with coverage:

```bash
pnpm run test:coverage
```

Run typecheck and lint:

```bash
pnpm run typecheck
pnpm run lint
```

CI

- CI should run `pnpm install`, `pnpm run typecheck`, `pnpm run lint`, and `pnpm run test:coverage`.
- We include a sample GitHub Actions workflow in `.github/workflows/ci.yml`.

Next steps (I can scaffold for you)

- Add a `vitest.config.ts` with `jsdom` environment and coverage config (I will add one).
- Add example component tests for `BookingWizard` and integration tests for `lib/db/*` helpers (we already have examples).
- Add Playwright E2E scaffold if you want full browser tests (install + first test).
- Hook coverage upload (Codecov or GitHub Actions artifact) if desired.

If you'd like, I can also:
- Add Playwright and example E2E tests.
- Add a test seed script for a disposable Supabase test project.
- Add coverage upload to Codecov.
