-- Create RLS policy to allow admins to view all user_credits
CREATE POLICY "Admins can view all user_credits"
ON public.user_credits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policy to allow admins to insert passcodes
CREATE POLICY "Admins can insert passcodes"
ON public.user_credits
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create RLS policy to allow admins to delete unused passcodes
CREATE POLICY "Admins can delete unused passcodes"
ON public.user_credits
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND passcode_used = false);