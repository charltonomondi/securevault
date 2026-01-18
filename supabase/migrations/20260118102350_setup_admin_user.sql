-- Set up admin user: charltonoomondi@gmail.com
-- This should be run after the approval_status column is added

-- First, ensure the user exists in auth.users (this will be handled by Supabase auth)
-- Then update their profile and role

-- Update profile to approved status
UPDATE public.profiles
SET approval_status = 'approved'
WHERE email = 'charltonoomondi@gmail.com';

-- Ensure they have admin role
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
WHERE p.email = 'charltonoomondi@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'admin'::app_role
);

-- If profile doesn't exist yet, this will create it when they first sign up
-- But for existing users, this ensures they're set up properly