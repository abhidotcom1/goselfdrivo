
-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  phone text,
  role text check (role in ('admin', 'customer')) default 'customer',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create cars table
create table public.cars (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text,
  hourly_rate numeric not null,
  min_booking_hours int default 24,
  status text check (status in ('AVAILABLE', 'LOCKED', 'MAINTENANCE', 'ON_TRIP')) default 'AVAILABLE',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.cars enable row level security;

-- Create bookings table
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  car_id uuid references public.cars(id) not null,
  pickup_time timestamptz not null,
  drop_time timestamptz not null,
  status text check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED')) default 'PENDING',
  total_price numeric not null,
  approved_return_time timestamptz,
  actual_return_time timestamptz,
  late_fee numeric default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.bookings enable row level security;

-- RLS Policies

-- CARS
create policy "Cars are viewable by everyone" on public.cars for select using (true);
create policy "Admins can insert cars" on public.cars for insert with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins can update cars" on public.cars for update using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins can delete cars" on public.cars for delete using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- PROFILES
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- BOOKINGS
create policy "Users can view their own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can insert bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Admins can view all bookings" on public.bookings for select using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins can update bookings" on public.bookings for update using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- TRIGGERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
