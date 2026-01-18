-- Add user approval status to profiles table
ALTER TABLE public.profiles
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update existing profiles to be approved (for backwards compatibility)
UPDATE public.profiles SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Make approval_status NOT NULL after setting defaults
ALTER TABLE public.profiles
ALTER COLUMN approval_status SET NOT NULL;

-- Update RLS policies to only allow approved users to sign in
-- We'll handle this in the application logic, but we can add a policy for viewing profiles
CREATE POLICY "Approved users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id AND approval_status = 'approved');

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert their own profile during signup"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile if approved
CREATE POLICY "Approved users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id AND approval_status = 'approved');

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));