-- Supabase schema for Serenity Spa Booking app
-- Tables, indexes, RLS policies, and seed data matching repository layer

-- 1. Core tables

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role text not null default 'customer'   -- 'admin' | 'customer' | 'guest'
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  duration_minutes int,
  price numeric,
  description text,
  thumbnail_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  updated_at timestamp with time zone not null default now()
);

create table therapists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  photo_url text,
  bio_short text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table therapist_service (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  therapist_id uuid not null references therapists(id) on delete cascade,
  unique (service_id, therapist_id)
);

create table service_images (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  image_url text not null,
  sort_order int
);

create table time_slots (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references therapists(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_available boolean not null default true,
  locked_until timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  service_id uuid not null references services(id),
  therapist_id uuid references therapists(id),
  time_slot_id uuid not null references time_slots(id),
  status text not null check (status in ('confirmed','cancelled','pending')) default 'pending',
  reference_code text unique,
  notes text,
  created_at timestamp with time zone not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  ip_address inet,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text,
  notes text
);

-- 2. Indexes

create index idx_time_slots_therapist_start on time_slots (therapist_id, start_time);
create index idx_time_slots_available_locked on time_slots (is_available, locked_until);
create unique index idx_bookings_slot on bookings (time_slot_id);
create index idx_bookings_customer on bookings (customer_id);
create index idx_bookings_status_timeslot on bookings (status, time_slot_id);
create index idx_messages_ip_created on messages (ip_address, created_at);

-- 3. Row-Level Security

alter table bookings enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;

create policy admin_only on bookings
  for all using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy customer_bookings_select on bookings
  for select using (auth.uid() = customer_id);
create policy customer_bookings_update on bookings
  for update using (auth.uid() = customer_id);
create policy customer_bookings_delete on bookings
  for delete using (auth.uid() = customer_id);
create policy customer_bookings_insert on bookings
  for insert with check (auth.uid() = customer_id);

create policy messages_public_insert on messages
  for insert with check (true);
create policy messages_admin_select on messages
  for select using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy messages_admin_update on messages
  for update using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy profiles_customer_select on profiles
  for select using (auth.uid() = id);
create policy profiles_self_update on profiles
  for update using (auth.uid() = id);

-- 4. Seed data
-- NOTE: profiles are created automatically when users sign up via Supabase Auth
-- Do not manually insert profiles here; the FK to auth.users will fail

insert into services (id, name, category, duration_minutes, price, is_active) values
  ('10000000-0000-0000-0000-000000000001','Swedish Massage','massage',60,120,true),
  ('10000000-0000-0000-0000-000000000002','Hot Stone','massage',90,150,true);

insert into therapists (id, name, title, is_active) values
  ('20000000-0000-0000-0000-000000000001','Alice','MT',true),
  ('20000000-0000-0000-0000-000000000002','Bob','ST',true);

insert into therapist_service (service_id, therapist_id) values
  ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002');

insert into time_slots (therapist_id, start_time, end_time) values
  ('20000000-0000-0000-0000-000000000001','2026-03-03T09:00:00Z','2026-03-03T10:00:00Z'),
  ('20000000-0000-0000-0000-000000000001','2026-03-03T10:00:00Z','2026-03-03T11:00:00Z');

-- 5. Auto-create profile on user signup

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.email, 'customer');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 6. Optional slot-locking helper function

create or replace function public.try_lock_slot(
  slot uuid, lock_until timestamptz, now timestamptz
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
