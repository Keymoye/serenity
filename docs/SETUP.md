Last updated: March 5, 2026 | Auto-generated from source

# Setup & Local Development

This document lists the steps and requirements needed to run the booking-app locally. All information is derived from the codebase.

## Prerequisites

- **Node.js** 18+ (LTS)
- **pnpm** (preferred) or npm/yarn
- A Supabase project with the database schema described in `docs/SUPABASE.md` or a compatible PostgreSQL instance

## Required Environment Variables

The application reads the following variables via `process.env` in multiple modules:

- `NEXT_PUBLIC_SUPABASE_URL` – base URL of your Supabase project (used by both server and client clients)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – public anon key (used by browser/client code)
- `SUPABASE_SERVICE_ROLE_KEY` – service‑role key (server‑only, used by admin and data clients)

These are the only environment variables referenced directly in code. Create a `.env.local` file in the project root during development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=service-role-key-here
```

> **Security note**: never commit `SUPABASE_SERVICE_ROLE_KEY` to version control. The two `NEXT_PUBLIC_*` vars are safe for client transpilation.

## Installation & Commands

Install dependencies:

```bash
pnpm install
```

Type checking and linting:

```bash
pnpm run typecheck    # tsc --noEmit
pnpm run lint         # eslint
pnpm run lint:fix     # attempt autofix
```

Running the development server:

```bash
pnpm dev
# open http://localhost:3000
```

Building and starting production mode:

```bash
pnpm build
pnpm start
```

Testing

```bash
pnpm run test              # run Vitest suite
pnpm run test:watch        # watch mode
pnpm run test:coverage     # coverage report
```

Other useful scripts from `package.json`:

- `pnpm diagrams:render` – generate diagrams in `docs/diagrams`
- `pnpm test:unit` – same as `test`

## Configuration Files

- `next.config.ts` – currently empty; standard Next.js config may be added here
- `tsconfig.json` – TypeScript compiler options, including path alias `@/*`
- `tailwind.config.ts` – theme and plugin configuration for Tailwind CSS
- `eslint.config.mjs` – ESLint configuration
- `vitest.config.ts` – Vitest setup (JSDOM environment for component tests)

## Notes

- The Supabase client modules (`lib/infra/supabase/*`) validate that the required env vars are present at runtime and throw otherwise.
- Middleware in `middleware.ts` protects protected routes and will redirect to `/auth/login` if session is missing.

Happy hacking! Run `pnpm dev` and start exploring.
