# Deployment

## Recommended deployment targets
- Vercel (first-class for Next.js)
- Netlify, or any platform that supports Node + environment variables

## Environment variables
Set the same variables used for local dev in your deployment provider:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only secret)

## Build & output
- Build command: `pnpm build` (or `npm run build`)
- Start: `pnpm start` or use the provider's default Next.js integration

## Migration and DB
- Apply DB migrations and seeds via Supabase SQL or a migration tool before deploying.
