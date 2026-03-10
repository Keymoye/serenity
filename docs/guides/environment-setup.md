# Environment Setup
> Last updated: Batch 9 (March 2026)

## Prerequisites
- **Node.js** 20+ - Required for Next.js 16
- **pnpm** - Package manager (faster than npm)
- **Supabase account** - Database, auth, and storage
- **Resend account** - Email service (free tier available)
- **Upstash account** - Rate limiting (optional in dev)

## Step 1 — Clone and install

### Clone the repository
```bash
git clone <repository-url>
cd booking-app
```

### Install dependencies
```bash
pnpm install
```

### Verify installation
```bash
pnpm --version  # Should be 9+
node --version   # Should be 20+
```

## Step 2 — Supabase setup

### Create Supabase project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Choose organization or create new one
4. Enter project name: `serenity-spa-booking`
5. Choose database region (closest to your users)
6. Create project

### Configure authentication
1. In Supabase Dashboard → Authentication → Settings
2. Enable **Email** provider (enabled by default)
3. Enable **Google OAuth** (optional):
   - Get Google OAuth credentials from Google Cloud Console
   - Add Client ID and Client Secret to Supabase
4. Set site URL: `http://localhost:3000` (development)
5. Set redirect URLs: `http://localhost:3000/auth/callback`

### Get Supabase credentials
1. Go to Project Settings → API
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Create database schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy the entire schema from `docs/supabase_schema.sql`
3. Paste and run the SQL script
4. Verify tables created (profiles, services, therapists, etc.)

### Create storage buckets
1. Go to Storage in Supabase Dashboard
2. Create buckets:
   - `therapist-photos` (Public)
   - `service-images` (Public)
   - `spa-hero` (Public)
   - `avatar-uploads` (Public)
3. For each bucket, set as **Public**
4. Add CORS policy if needed (usually not required for public buckets)

### Verify RLS policies
1. Go to Authentication → Policies
2. Check that policies exist for:
   - `profiles` (customer access)
   - `bookings` (customer + admin access)
   - `messages` (public insert, admin read/update)
3. Test policies by trying to access data as different roles

## Step 3 — Resend setup

### Create Resend account
1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email address

### Verify sending domain
1. In Resend Dashboard → Domains
2. Add your domain (e.g., `yourspa.com`)
3. Add DNS records provided by Resend:
   - TXT record for SPF
   - TXT record for DKIM
4. Wait for domain verification (usually minutes)

### Get API key
1. Go to API Keys in Resend Dashboard
2. Click "Create API Key"
3. Copy the API key → `RESEND_API_KEY`

### Configure email settings
1. Set default from email in Resend Dashboard
2. Recommended: `bookings@yourspa.com`
3. Note the email for `RESEND_FROM_EMAIL`

### Test email sending
1. Use Resend Dashboard "Send Test Email"
2. Send to your email address
3. Verify delivery and check spam folder

## Step 4 — Upstash setup (optional)

### Create Upstash account
1. Go to [upstash.com](https://upstash.com)
2. Sign up for free account
3. No credit card required for free tier

### Create Redis database
1. In Upstash Dashboard, click "Create Database"
2. Choose region closest to your users
3. Select free tier (sufficient for rate limiting)
4. Click "Create"

### Get Redis credentials
1. Open your database in Upstash Dashboard
2. Click "Connect" → "REST"
3. Copy **REST URL** → `UPSTASH_REDIS_REST_URL`
4. Copy **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

### Test Redis connection
```bash
# Test with curl (optional)
curl -X POST "$UPSTASH_REDIS_REST_URL/set/foo/bar" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

## Step 5 — Environment file

### Create environment file
```bash
cp .env.example .env.local
```

### Fill in required variables
Edit `.env.local` with your credentials:

```bash
# Supabase — get from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Resend — email sending service (resend.com)
RESEND_API_KEY=re_your-api-key-here
RESEND_FROM_EMAIL=bookings@yourspa.com

# App — your deployed URL (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Upstash Redis — rate limiting (optional in dev)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here

# Optional: Spa configuration
SPA_NAME=Serenity Spa
SPA_ADDRESS=123 Wellness Street, Your City
SPA_PHONE=+1 (555) 000-0000
SPA_WEBSITE=https://yourspa.com
RESEND_ADMIN_EMAIL=admin@yourspa.com
```

### Variable reference table
| Variable | Required | Default | Where to get it |
|----------|----------|---------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | - | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | - | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | Yes | - | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | No | "bookings@serenity.spa" | Resend Dashboard → Domains |
| `NEXT_PUBLIC_APP_URL` | Yes | - | Your deployed URL (localhost:3000 for dev) |
| `UPSTASH_REDIS_REST_URL` | No | - | Upstash Dashboard → Database → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | No | - | Upstash Dashboard → Database → REST Token |

### Security notes
- **Never commit `.env.local`** to version control
- **Service role key** must be kept secret
- **API keys** should be rotated periodically
- **Use different keys** for development and production

## Step 6 — Create admin user

### Register as customer
1. Start the development server: `pnpm dev`
2. Go to `http://localhost:3000/auth/register`
3. Fill out registration form
4. Check email for magic link (or use password if configured)
5. Complete registration

### Promote to admin
1. Go to Supabase Dashboard → Table Editor
2. Open the `profiles` table
3. Find your user row (by email)
4. Click on the `role` field
5. Change from `'customer'` to `'admin'`
6. Save the changes

### Verify admin access
1. Go to `http://localhost:3000/admin`
2. Should redirect to admin dashboard
3. Verify you can see admin navigation

## Step 7 — Run development server

### Start the server
```bash
pnpm dev
```

### Verify server is running
- Open `http://localhost:3000`
- Should see the landing page
- Check browser console for errors

### Test authentication
1. Click "Login" in navigation
2. Log in with your admin account
3. Verify redirect to dashboard
4. Click "Logout" to test session cleanup

## Verification checklist

### Basic functionality
- [ ] Homepage loads without errors
- [ ] Navigation works between pages
- [ ] Services page displays services
- [ ] Booking wizard loads and navigates between steps

### Authentication
- [ ] Registration creates user profile
- [ ] Login works with email/password
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Admin routes work for admin users

### Admin functionality
- [ ] Admin dashboard loads
- [ ] Can create/edit services
- [ ] Can create/edit therapists
- [ ] Can upload images
- [ ] Can view bookings

### Booking flow
- [ ] Service selection works
- [ ] Therapist selection works
- [ ] Date/time selection shows availability
- [ ] Booking confirmation creates booking
- [ ] Confirmation email received (check spam folder)

### Email functionality
- [ ] Booking confirmation emails sent
- [ ] Admin notification emails sent
- [ ] Check Resend dashboard for delivery status

### Rate limiting (if Upstash configured)
- [ ] Multiple login attempts trigger rate limit
- [ ] 429 response with retry-after header
- [ ] Rate limiting works without Redis (graceful degradation)

## Troubleshooting

### Common issues

#### Supabase connection errors
**Symptoms:** "Supabase client environment variables are not configured"
**Solutions:**
- Check `.env.local` file exists
- Verify variable names match exactly
- Restart development server after changing env vars
- Check for extra spaces in variable values

#### Authentication not working
**Symptoms:** Login redirects but doesn't log in
**Solutions:**
- Verify Supabase Auth is enabled
- Check redirect URLs in Supabase settings
- Ensure site URL matches `NEXT_PUBLIC_APP_URL`
- Check browser console for auth errors

#### RLS policy errors
**Symptoms:** Queries return empty arrays
**Solutions:**
- Verify RLS policies exist for tables
- Check policy expressions are correct
- Test with service role key to bypass RLS
- Check user has required role in profiles table

#### Email not sending
**Symptoms:** No confirmation emails received
**Solutions:**
- Verify Resend API key is correct
- Check domain is verified in Resend
- Verify from email is verified
- Check Resend dashboard for delivery status

#### Image upload not working
**Symptoms:** Upload fails or images don't display
**Solutions:**
- Verify storage buckets exist and are public
- Check Next.js image config includes Supabase URL
- Verify file size is under 2MB limit
- Check MIME type is allowed

#### Rate limiting not working
**Symptoms:** No rate limiting in development
**Solutions:**
- This is expected behavior without Redis
- Rate limiting works in production with Upstash
- Check Upstash credentials are correct
- Verify Redis database is active

### Development tips

#### Environment variable debugging
```bash
# Check environment variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL
echo $RESEND_API_KEY

# Test Supabase connection
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
```

#### Database debugging
```sql
-- Test RLS policies in Supabase SQL Editor
SELECT * FROM profiles WHERE auth.uid() = 'your-user-id';

-- Check user roles
SELECT id, name, role FROM profiles;
```

#### Email debugging
```typescript
// Add logging to email service
console.log("Sending email to:", email);
console.log("Using API key:", RESEND_API_KEY ? "Set" : "Not set");
```

#### Performance debugging
```bash
# Check bundle size
pnpm run build

# Check for memory leaks
# Use browser dev tools → Performance tab
```

## Production deployment

### Additional setup steps

#### Environment variables
- Update `NEXT_PUBLIC_APP_URL` to production URL
- Update `RESEND_FROM_EMAIL` to production domain
- Use production Supabase project
- Use production Resend API key
- Consider using production Upstash Redis

#### Security considerations
- Enable HTTPS in production
- Use environment-specific API keys
- Set up monitoring and logging
- Configure backup strategy for database
- Enable audit logging for admin actions

#### Performance optimization
- Enable Next.js production optimizations
- Configure CDN for static assets
- Set up database connection pooling
- Monitor API response times
- Enable caching where appropriate

#### Monitoring setup
- Set up error tracking (e.g., Sentry)
- Configure uptime monitoring
- Set up database performance monitoring
- Monitor email delivery rates
- Track user analytics and conversion rates

## Getting help

### Resources
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **Upstash Docs:** [upstash.com/docs](https://upstash.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)

### Common issues and solutions
- Check the [troubleshooting section](#troubleshooting) above
- Search existing GitHub issues
- Ask questions in community forums
- Review error logs in browser console and terminal

### Contributing
- Follow the existing code style
- Add tests for new features
- Update documentation for changes
- Submit pull requests with clear descriptions
