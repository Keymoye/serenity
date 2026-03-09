# Supabase

## Overview
Supabase provides the backend infrastructure for this spa booking application:
- **PostgreSQL database** - All application data with Row Level Security
- **Authentication** - Email/password, magic links, OAuth (Google)
- **Storage** - Image uploads for services, therapists, avatars
- **Row Level Security (RLS)** - Fine-grained access control per user role

## Environment variables
| Variable | Required | Public/Secret | Purpose | Where to get it |
|----------|----------|---------------|---------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public | Anonymous API key for client | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Secret | Service role key (bypasses RLS) | Supabase Dashboard → Settings → API |

**Security notes:**
- Public variables can be exposed to browser
- Service role key must NEVER be exposed to client
- Service role key used only in server-side admin operations

## Client types

### 1. Admin client (service role)
**File:** `lib/infra/supabase/adminClient.ts`
```typescript
export async function getSupabaseAdminClient(): Promise<SupabaseAdminClient> {
  const client = createClient(supabaseUrl, serviceRoleKey);
  return client;
}
```

**Characteristics:**
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- **Bypasses all RLS policies** deliberately
- No cookies/session handling
- Used by: All repository functions in server-side code
- **NEVER expose to client browser**

**Use cases:**
- Admin CRUD operations (services, therapists, bookings)
- Background jobs and system tasks
- Data migrations/seed operations

### 2. User client (anon key + session)
**File:** `lib/infra/supabase/userClient.ts`
```typescript
export async function getSupabaseUserClient(): Promise<SupabaseUserClient> {
  const cookieStore = await cookies();
  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: { getAll, setAll }
  });
  return client;
}
```

**Characteristics:**
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Includes user session cookies
- **RLS policies enforced** at database level
- Used by: Customer operations, public data reads

**Use cases:**
- Customer profile reads/updates
- Customer booking views/mutations
- Public data reads (services, therapists)

### 3. Server auth client
**File:** `lib/infra/supabase/authClient.ts`
```typescript
export async function getSupabaseServerAuthClient(
  response?: NextResponse
): Promise<SupabaseClient> {
  // Handles cookie read/write for auth flows
}
```

**Characteristics:**
- Uses anon key + cookie handling
- Can write cookies to response object
- Used by: Auth flows, middleware, session management

**Use cases:**
- Login/logout operations
- OAuth callbacks
- Magic link handling
- Session refresh in middleware

## Database schema

### profiles
**Purpose:** User profile data linked to Supabase Auth users

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | - | FK to auth.users(id) |
| name | text | NOT NULL | - | User's full name |
| phone | text | YES | - | Phone number |
| role | text | NOT NULL | 'customer' | 'admin' | 'customer' | 'guest' |

**Foreign keys:**
- `id` → `auth.users(id)` ON DELETE CASCADE

**RLS policies:**
- `profiles_customer_select` - SELECT using `auth.uid() = id`
- `profiles_self_update` - UPDATE using `auth.uid() = id`

**Indexes:** None (primary key on id)

### services
**Purpose:** Spa services offered (massage, facial, etc.)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| name | text | NOT NULL | - | Service name |
| category | text | YES | - | Service category (massage, facial, etc.) |
| duration_minutes | int | YES | - | Service duration in minutes |
| price | numeric | YES | - | Service price |
| description | text | YES | - | Service description |
| thumbnail_url | text | YES | - | Service thumbnail image |
| is_active | boolean | NOT NULL | true | Whether service is bookable |
| is_featured | boolean | NOT NULL | false | Show on homepage |
| updated_at | timestamptz | NOT NULL | now() | Last update timestamp |

**RLS policies:** None (public read)

**Indexes:** None (primary key on id)

### therapists
**Purpose:** Therapist profiles and availability

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| name | text | NOT NULL | - | Therapist name |
| title | text | YES | - | Professional title (MT, ST, etc.) |
| photo_url | text | YES | - | Profile photo URL |
| bio_short | text | YES | - | Short bio |
| is_active | boolean | NOT NULL | true | Whether therapist is available |
| created_at | timestamptz | NOT NULL | now() | Creation timestamp |

**RLS policies:** None (public read)

**Indexes:** None (primary key on id)

### therapist_service
**Purpose:** Many-to-many relationship between therapists and services

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| service_id | uuid | NOT NULL | - | FK to services.id |
| therapist_id | uuid | NOT NULL | - | FK to therapists.id |

**Foreign keys:**
- `service_id` → `services(id)` ON DELETE CASCADE
- `therapist_id` → `therapists(id)` ON DELETE CASCADE

**Constraints:**
- `unique (service_id, therapist_id)` - Prevents duplicates

**RLS policies:** None (public read)

### service_images
**Purpose:** Gallery images for services

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| service_id | uuid | NOT NULL | - | FK to services.id |
| image_url | text | NOT NULL | - | Image URL |
| sort_order | int | YES | - | Display order |

**Foreign keys:**
- `service_id` → `services(id)` ON DELETE CASCADE

**RLS policies:** None (public read)

### time_slots
**Purpose:** Available appointment time slots

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| therapist_id | uuid | NOT NULL | - | FK to therapists.id |
| start_time | timestamptz | NOT NULL | - | Slot start time |
| end_time | timestamptz | NOT NULL | - | Slot end time |
| is_available | boolean | NOT NULL | true | Whether slot is bookable |
| locked_until | timestamptz | YES | - | Slot locked until (booking) |
| created_at | timestamptz | NOT NULL | now() | Creation timestamp |

**Foreign keys:**
- `therapist_id` → `therapists(id)` ON DELETE CASCADE

**RLS policies:** None (admin manages via service role)

**Indexes:**
- `idx_time_slots_therapist_start` - `(therapist_id, start_time)`
- `idx_time_slots_available_locked` - `(is_available, locked_until)`

### bookings
**Purpose:** Customer bookings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| customer_id | uuid | NOT NULL | - | FK to profiles.id |
| service_id | uuid | NOT NULL | - | FK to services.id |
| therapist_id | uuid | YES | - | FK to therapists.id |
| time_slot_id | uuid | NOT NULL | - | FK to time_slots.id |
| status | text | NOT NULL | 'pending' | 'confirmed' | 'cancelled' | 'pending' |
| reference_code | text | YES | - | Unique booking reference |
| notes | text | YES | - | Customer notes |
| created_at | timestamptz | NOT NULL | now() | Creation timestamp |

**Foreign keys:**
- `customer_id` → `profiles(id)` ON DELETE CASCADE
- `service_id` → `services(id)`
- `therapist_id` → `therapists(id)`
- `time_slot_id` → `time_slots(id)`

**Constraints:**
- `status` check: `status in ('confirmed','cancelled','pending')`
- `reference_code` unique

**RLS policies:**
- `admin_only` - All operations for admin role
- `customer_bookings_select` - SELECT using `auth.uid() = customer_id`
- `customer_bookings_update` - UPDATE using `auth.uid() = customer_id`
- `customer_bookings_delete` - DELETE using `auth.uid() = customer_id`
- `customer_bookings_insert` - INSERT with check `auth.uid() = customer_id`

**Indexes:**
- `idx_bookings_slot` - `(time_slot_id)` (unique)
- `idx_bookings_customer` - `(customer_id)`
- `idx_bookings_status_timeslot` - `(status, time_slot_id)`

### messages
**Purpose:** Contact form messages from website

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| full_name | text | NOT NULL | - | Contact name |
| email | text | NOT NULL | - | Contact email |
| phone | text | YES | - | Contact phone |
| subject | text | NOT NULL | - | Message subject |
| message | text | NOT NULL | - | Message content |
| ip_address | inet | YES | - | Submit IP address |
| is_read | boolean | NOT NULL | false | Whether admin read it |
| created_at | timestamptz | NOT NULL | now() | Creation timestamp |

**RLS policies:**
- `messages_public_insert` - INSERT with check `true` (anyone can submit)
- `messages_admin_select` - SELECT for admin role only
- `messages_admin_update` - UPDATE for admin role only

**Indexes:**
- `idx_messages_ip_created` - `(ip_address, created_at)`

### schedules
**Purpose:** Admin scheduling notes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| date | date | NOT NULL | - | Schedule date |
| title | text | YES | - | Schedule title |
| notes | text | YES | - | Schedule notes |

**RLS policies:** None (admin only)

## Database functions

### handle_new_user()
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.email, 'customer');
  return new;
end;
$$ language plpgsql security definer;
```

**Trigger:** `AFTER INSERT ON auth.users`
**Purpose:** Automatically creates a profile row when a user signs up via Supabase Auth
**Behavior:** Sets role to 'customer' and name to email address

### try_lock_slot()
```sql
create or replace function public.try_lock_slot(
  slot uuid, 
  lock_until timestamptz, 
  now timestamptz
) returns boolean as $$
declare
  updated record;
begin
  update time_slots
  set locked_until = lock_until
  where id = slot
    and is_available
    and (locked_until is null or locked_until < now)
  returning id into updated;

  return updated is not null;
end;
$$ language plpgsql stable;
```

**Purpose:** Atomically locks a time slot for booking
**Returns:** `true` if slot was successfully locked, `false` otherwise
**Used by:** `lockSlot()` service function
**Atomic behavior:** Prevents race conditions in slot locking

## Row Level Security

### RLS pattern used:
```sql
-- Enable RLS on table
alter table bookings enable row level security;

-- Admin full access (service role bypasses RLS)
create policy admin_only on bookings
  for all using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Customer self-access
create policy customer_bookings_select on bookings
  for select using (auth.uid() = customer_id);
```

### Common RLS patterns:

#### 1. Admin-only operations
```sql
-- Service role bypasses RLS, but we still check role for safety
create policy admin_only on bookings
  for all using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
```

#### 2. Customer self-access
```sql
-- Customers can only access their own data
create policy customer_bookings_select on bookings
  for select using (auth.uid() = customer_id);
```

#### 3. Public writes
```sql
-- Anyone can insert (contact form)
create policy messages_public_insert on messages
  for insert with check (true);
```

### Common gotchas:

#### RLS silent empty array
**Symptom:** Query with joins returns empty array `[]` even though data exists
**Cause:** Missing SELECT policy on one of the joined tables
**Fix:** Add public SELECT policy or ensure user has access
```sql
-- This query returns [] if service_images has no SELECT policy
select b.*, si.image_url 
from bookings b 
left join service_images si on b.service_id = si.service_id 
where b.customer_id = auth.uid();
```

#### getSession() security warning
**Issue:** `getSession()` can return stale session data
**Solution:** Use `getUser()` for authentication, `getSession()` for reading existing session
```typescript
// ✅ For auth checks
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new UnauthorizedError();

// ✅ For reading existing session
const { data: { session } } = await supabase.auth.getSession();
```

## Auth configuration

### Supported auth methods:
1. **Email + password** - Traditional login
2. **Magic link** - Passwordless login via email
3. **OAuth (Google)** - Social login via Google
4. **Password reset** - Email-based password reset

### Auth flow implementation:
```typescript
// Email/password
await supabase.auth.signInWithPassword({ email, password });

// Magic link  
await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${APP_URL}/auth/callback` }
});

// OAuth Google
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${APP_URL}/auth/callback` }
});
```

### Callback route:
**File:** `app/auth/callback/route.ts`
**Purpose:** Handles OAuth and magic link redirects
**Flow:**
1. User clicks magic link or OAuth authorization
2. Supabase redirects to `/auth/callback` with auth code
3. Callback route exchanges code for session
4. Session cookies set automatically by `@supabase/ssr`
5. User redirected to intended destination

```typescript
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  
  if (code) {
    const supabase = await getSupabaseServerAuthClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  return NextResponse.redirect(`${origin}${next}`);
}
```

## Running migrations

### Current setup:
- No automated migration runner
- Manual migrations via Supabase SQL Editor
- Schema file: `docs/supabase_schema.sql`
- Future: Consider `supabase db push` for local development

### Applying schema changes:
1. **Development:** Use Supabase Dashboard → SQL Editor
2. **Production:** Use same SQL Editor with careful testing
3. **Backup:** Always export schema before changes
4. **RLS:** Add policies immediately after table creation

### Migration workflow:
```sql
-- 1. Create table
create table new_table (...);

-- 2. Add RLS immediately
alter table new_table enable row level security;

-- 3. Add policies
create policy ... on new_table;

-- 4. Add indexes
create index ... on new_table (...);
```

## Common issues & fixes

### 1. RLS silent empty array
**Problem:** Query returns `[]` when data exists
**Root cause:** Missing SELECT policy on joined table
**Solution:** Add appropriate SELECT policies
```sql
-- Add public SELECT if table should be readable
create policy public_select on service_images
  for select using (true);
```

### 2. getSession() security warning
**Problem:** Supabase shows warning about using getSession() for auth
**Solution:** Use `getUser()` for authentication checks
```typescript
// ❌ For auth checks
const { data: { session } } = await supabase.auth.getSession();

// ✅ For auth checks  
const { data: { user } } = await supabase.auth.getUser();
```

### 3. Service role key exposure
**Problem:** Accidentally using service role key in client code
**Solution:** Ensure only adminClient.ts uses service role key
```typescript
// ❌ Never do this in client components
const client = createClient(url, serviceRoleKey);

// ✅ Always use admin client in server code
const client = await getSupabaseAdminClient();
```

### 4. Missing RLS on new tables
**Problem:** New table returns no data for users
**Solution:** Enable RLS and add policies immediately
```sql
create table new_table (...);
alter table new_table enable row level security;
create policy appropriate_policy on new_table ...;
```

### 5. Foreign key constraint failures
**Problem:** Insert fails with foreign key violation
**Solution:** Ensure referenced row exists before insert
```typescript
// Check therapist exists before booking
const therapist = await therapistRepo.getById(therapistId);
if (!therapist) throw new NotFoundError("Therapist not found");
```
