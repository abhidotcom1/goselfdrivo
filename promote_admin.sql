-- 1. First, we MUST update the allowed roles to include 'super_admin'
-- (In case the main schema script wasn't fully applied)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'customer', 'driver', 'owner'));

-- 2. Now, promote the specific user
-- 2. Insert or Update the user to super_admin
-- We fetch the user from auth.users to ensure we have the correct ID
INSERT INTO public.profiles (id, email, role, full_name, is_verified)
SELECT 
    id, 
    email, 
    'super_admin', 
    coalesce(raw_user_meta_data->>'full_name', 'Super Admin'), 
    true
FROM auth.users
WHERE email = 'workingwithabhi@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', is_verified = true;

-- 3. Verify the change (this will show the result in the query output)
SELECT email, role, full_name, is_verified 
FROM public.profiles 
WHERE email = 'workingwithabhi@gmail.com';
