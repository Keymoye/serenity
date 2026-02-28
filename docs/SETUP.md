# Local development setup

**Prerequisites**
- Node.js 18+ (LTS)
- pnpm (recommended) or npm/yarn
- A Supabase project (or local Postgres) with the expected tables (see SUPABASE.md)

1) Install dependencies
```bash
pnpm install
```

2) Environment variables
Create a `.env.local` in the project root with the following keys:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server only; keep secret)
- `NEXTAUTH_URL` (if used) and other provider secrets for production

Example `.env.local` (do NOT commit keys):
```
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=service_role_key_here
```

3) Run the app
```bash
pnpm dev
# Open http://localhost:3000
```

4) Helpful commands
- `pnpm lint` — run ESLint
- `pnpm tsc --noEmit` — typecheck
- `pnpm test` — run tests (if added)
