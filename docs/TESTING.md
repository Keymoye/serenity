# Testing

## Strategy
- Unit tests: Jest + @testing-library/react for components.
- API tests: node tests using MSW to mock Supabase responses or lightweight integration tests.
- E2E: Playwright for critical booking flows (optional).

## Suggested packages
```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom msw jest-environment-jsdom ts-jest
```

## Example: component test
- Create `__tests__/BookingWizard.test.tsx` that renders `BookingWizard` and mocks network calls to `/api/booking/*` via MSW.

## CI
- Run `pnpm lint && pnpm tsc --noEmit && pnpm test -- --ci` in CI. See `.github/workflows/ci.yml` (add if missing).
