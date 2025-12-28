-- 1. First, we MUST update the allowed roles to include 'super_admin'
-- (In case the main schema script wasn't fully applied)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'customer', 'driver', 'owner'));

-- 2. Now, promote the specific user
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'workingwithabhi@gmail.com';

-- 3. Verify the change (this will show the result in the query output)
SELECT email, role, full_name, is_verified 
FROM public.profiles 
WHERE email = 'workingwithabhi@gmail.com';
