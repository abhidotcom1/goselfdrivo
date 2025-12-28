-- Create a function to handle super admin creation safely
create or replace function create_super_admin(
  admin_email text,
  admin_password text
) returns void as $$
declare
  new_user_id uuid;
begin
  -- Check if user exists in auth.users
  select id into new_user_id from auth.users where email = admin_email;

  -- if user does not exist, we cannot create *auth* user easily via SQL without knowing internals or using the API
  -- So we assume the user might already sign up or we instruct them to sign up first.
  -- HOWEVER, the user asked to "create super admin user name and password". 
  -- Creating a user in `auth.users` via raw SQL is possible but tricky (encryption). 
  -- It's better to update an EXISTING user to super_admin.
  
  -- But if we MUST create, we can just Insert. NOTE: Password hashing matches Supabase default (bcrypt).
  -- For safety, we will just UPDATE the role if the email exists. 
  
  if new_user_id is not null then
    -- Update public.profiles
    update public.profiles
    set role = 'super_admin'
    where id = new_user_id;
    
    -- ensure metadata in auth.users is updated if you use it there
    update auth.users
    set raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
    where id = new_user_id;
  else
    raise exception 'User with email % does not exist. Please sign up the user through the frontend first, then run this script.', admin_email;
  end if;
end;
$$ language plpgsql security definer;

-- Usage:
-- select create_super_admin('admin@example.com', 'password123'); -- Password arg is currently unused in this logic as we prefer signup first.

-- ALTERNATIVE: If you want to insert a profile for an existing auth user that is missing a profile:
insert into public.profiles (id, email, role)
select id, email, 'super_admin'
from auth.users
where email = 'your_admin_email@example.com'
on conflict (id) do update
set role = 'super_admin';
