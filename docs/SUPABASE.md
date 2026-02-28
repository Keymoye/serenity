# Supabase setup for Serenity Spa

This document covers the expected Supabase schema, important implementation notes, and seed data suggestions.

## Recommended tables (representative DDL)

-- services
```
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  duration_minutes int,
  price numeric,
  thumbnail_url text,
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

-- therapists
```
create table therapists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  photo_url text,
  bio_short text,
  bio text,
  created_at timestamptz default now()
);
```

-- therapist_service (many-to-many)
```
create table therapist_service (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  therapist_id uuid references therapists(id) on delete cascade
);
```

-- time_slots
```
create table time_slots (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid references therapists(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity int default 1,
  locked_until timestamptz,
  is_booked boolean default false
);
```

-- bookings
```
create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id),
  therapist_id uuid references therapists(id),
  time_slot_id uuid references time_slots(id),
  customer_name text,
  customer_contact text,
  status text default 'pending',
  notes text,
  created_at timestamptz default now()
);
```

-- profiles (for role)
```
create table profiles (
  id uuid references auth.users(id) primary key,
  user_id uuid references auth.users(id),
  role text default 'customer',
  name text,
  phone text
);
```

-- messages (contact)
```
create table messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  subject text,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);
```

## RLS & security
- Use RLS on tables where appropriate. The project currently expects server-side enforcement for admin actions via the Service Role key.
- Keep `SUPABASE_SERVICE_ROLE_KEY` out of client bundles and source control.

## Seed data suggestions
- Create a few services, therapists, and schedule entries for local dev. Use Supabase SQL editor or `psql`.

## Helpful notes for APIs
- Availability API queries `therapist_service` and `time_slots` to compute bookable slots.
- Lock API should set `locked_until` for a timeslot and check for conflicts (use transactions where possible).
