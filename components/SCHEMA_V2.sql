-- GoSelfDrivo Schema V2 (Strict Operations Mode)
-- WARNING: This script DROPS existing tables to enforce the new Strict Mode architecture.
-- Run this to reset/upgrade your database to V2.

-- DROP EXISTING TABLES (Clean Slate)
drop table if exists public.coupons cascade;
drop table if exists public.expenses cascade;
drop table if exists public.car_locks cascade;
drop table if exists public.bookings cascade;
drop table if exists public.cars cascade;
drop table if exists public.profiles cascade;

-- 1. PROFILES (Enhanced)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  phone text,
  email text, -- Copied from auth for easier querying
  driver_license_url text, -- For verification
  id_proof_url text,      -- For verification
  is_verified boolean default false, -- Admin verification status
  role text check (role in ('admin', 'customer', 'driver', 'owner')) default 'customer',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 2. CARS (Strict Ops)
create table public.cars (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  car_number text not null unique, -- Registration number (e.g., KA-01-HH-1234)
  image_urls text[] not null default '{}', -- Changed to array for multiple images
  fuel_type text check (fuel_type in ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID')) default 'PETROL',
  transmission text check (transmission in ('MANUAL', 'AUTOMATIC')) default 'MANUAL',
  seats int default 5,
  hourly_rate numeric not null,
  min_booking_hours int default 24,
  description text,
  
  -- Strict Status Control
  -- AVAILABLE: Ready for booking
  -- ON_TRIP: Currently with customer
  -- LOCKED: Admin blocked (Maintenance, Owner Use, etc.)
  -- MAINTENANCE: Specifically in garage
  status text check (status in ('AVAILABLE', 'ON_TRIP', 'LOCKED', 'MAINTENANCE')) default 'AVAILABLE',
  is_active boolean default true, -- For Soft Delete (Disable/Enable)
  
  created_at timestamptz default now()
);

alter table public.cars enable row level security;

-- 3. CAR LOCKS (Availability Control Log)
-- Any time a car is NOT AVAILABLE, there must be a record here (except ON_TRIP which is covered by bookings)
create table public.car_locks (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references public.cars(id) not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text check (reason in ('MAINTENANCE', 'OWNER_USE', 'CUSTOMER_LATE', 'MANUAL_BLOCK', 'OTHER')) not null,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.car_locks enable row level security;

-- 4. BOOKINGS (Lifecycle Flow)
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  car_id uuid references public.cars(id) not null,
  
  -- Request Details
  pickup_time timestamptz not null, -- Requested Start
  drop_time timestamptz not null,   -- Requested End
  
  -- Admin Approved Details (The strict operational times)
  approved_pickup_time timestamptz,
  expected_return_time timestamptz, -- The HARD deadline for late fees
  
  -- Actuals
  actual_pickup_time timestamptz,
  actual_return_time timestamptz,
  
  -- Financials
  total_amount numeric not null, -- Quoted Price
  advance_paid numeric default 0,
  security_deposit numeric default 0,
  late_fee numeric default 0,
  damage_charge numeric default 0,
  final_amount numeric, -- Calculated after return
  payment_status text check (payment_status in ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED')) default 'PENDING',
  
  -- Lifecycle Status
  -- PENDING: User requested
  -- APPROVED: Admin sanctioned (Car becomes LOCKED effectively)
  -- REJECTED: Admin said no
  -- ON_TRIP: Car picked up
  -- LATE: Past expected_return_time
  -- RETURNED: Car back, pending inspection/closure
  -- COMPLETED: Trip closed, financials settled
  -- CANCELLED: User/Admin cancelled
  status text check (status in ('PENDING', 'APPROVED', 'REJECTED', 'ON_TRIP', 'LATE', 'RETURNED', 'COMPLETED', 'CANCELLED')) default 'PENDING',
  
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

-- 5. EXPENSES (Operational Tracking)
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references public.cars(id),
  amount numeric not null,
  category text check (category in ('FUEL', 'MAINTENANCE', 'CLEANING', 'TOLL', 'INSURANCE', 'OTHER')) default 'OTHER',
  description text,
  date date default CURRENT_DATE,
  logged_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;

-- 6. COUPONS
create table public.coupons (
  code text primary key,
  discount_type text check (discount_type in ('FLAT', 'PERCENTAGE')) not null,
  value numeric not null,
  min_order_value numeric default 0,
  max_discount_value numeric, -- Cap for percentage
  valid_until timestamptz,
  usage_limit int,
  usage_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.coupons enable row level security;


-- POLICIES (Simplified for Admin-Driven Ops)

-- Public data policies
create policy "Public profiles" on public.profiles for select using (true);
create policy "User can update own profile" on public.profiles for update using (auth.uid() = id);

-- Public read access for Cars (Only AVAILABLE ones should be prioritized in query)
create policy "Cars viewable by all" on public.cars for select using (true);

-- Admin Full Access Policies
-- (Assuming we will use a service role or check profile role for admin actions in the actual app logic)
-- For now, listing basic policies. Strict Admin checks should be in App Logic or strictly strictly via RLS.

create policy "Admins all cars" on public.cars for all using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins all bookings" on public.bookings for all using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins all locks" on public.car_locks for all using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins all expenses" on public.expenses for all using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Customer Policies
create policy "Customer view own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Customer create booking" on public.bookings for insert with check (auth.uid() = user_id);

-- TRIGGER for User Creation (Same as before)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'customer');
  return new;
end;
$$ language plpgsql security definer;

-- Drop verify if exists to avoid conflicts during dev reload
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- MIGRATION COMMANDS (Run these if upgrading from V1/Previous V2)
-- alter table public.cars drop column image_url;
-- alter table public.cars add column image_urls text[] default '{}';

-- ADMIN PROMOTION COMMAND (Run this after signing up to become admin)
-- update auth.users set raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"') where-- Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references public.cars(id) not null,
  amount numeric not null check (amount > 0),
  expense_type text not null check (expense_type in ('FUEL', 'PARKING', 'CLEANING', 'REPAIR', 'MAINTENANCE', 'OTHER')),
  expense_date timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

-- Payments Table
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.bookings(id) not null,
  amount numeric not null check (amount > 0),
  payment_mode text not null check (payment_mode in ('UPI', 'CASH', 'BANK_TRANSFER', 'ONLINE', 'OTHER')),
  payment_status text default 'PAID', -- Mostly for record keeping
  payment_date timestamptz default now(),
  notes text, -- Transaction ID or Reference
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.expenses enable row level security;
alter table public.payments enable row level security;

-- Policies for Expenses (Admins Only)
create policy "Admins can view all expenses" on public.expenses
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert expenses" on public.expenses
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update expenses" on public.expenses
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete expenses" on public.expenses
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Policies for Payments (Admins Only - Users see via booking status mostly)
create policy "Admins can view all payments" on public.payments
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert payments" on public.payments
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update payments" on public.payments
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete payments" on public.payments
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Helper to set user as admin
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';


-- MIGRATION: Add is_active column
-- alter table public.cars add column is_active boolean default true;

-- MIGRATION: Financial Tables
-- create table public.expenses ... (manually apply in Supabase SQL Editor)
-- create table public.payments ... (manually apply in Supabase SQL Editor)
