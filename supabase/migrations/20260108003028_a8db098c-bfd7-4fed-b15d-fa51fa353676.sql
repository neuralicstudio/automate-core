-- Create user_credits table to track usage
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_uses INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_uses_remaining INTEGER NOT NULL DEFAULT 0,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  passcode VARCHAR(12) UNIQUE,
  passcode_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own credits (for passcode validation)
CREATE POLICY "Users can update their own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow insert for new users
CREATE POLICY "Users can insert their own credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment usage and check limits
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_can_use BOOLEAN := false;
  v_remaining INTEGER := 0;
  v_is_premium BOOLEAN := false;
BEGIN
  -- Get or create user credits
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, total_uses) 
    VALUES (p_user_id, 0)
    RETURNING * INTO v_credits;
  END IF;
  
  -- Check if premium and not expired
  IF v_credits.is_premium AND v_credits.premium_expires_at > now() THEN
    v_is_premium := true;
    IF v_credits.premium_uses_remaining > 0 THEN
      v_can_use := true;
      UPDATE user_credits 
      SET premium_uses_remaining = premium_uses_remaining - 1,
          total_uses = total_uses + 1
      WHERE user_id = p_user_id
      RETURNING premium_uses_remaining INTO v_remaining;
    END IF;
  ELSE
    -- Free tier: 3 uses max
    IF v_credits.total_uses < 3 THEN
      v_can_use := true;
      v_remaining := 3 - v_credits.total_uses - 1;
      UPDATE user_credits 
      SET total_uses = total_uses + 1
      WHERE user_id = p_user_id;
    ELSE
      v_remaining := 0;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'can_use', v_can_use,
    'remaining', v_remaining,
    'is_premium', v_is_premium,
    'total_uses', v_credits.total_uses + 1
  );
END;
$$;

-- Function to validate and apply passcode
CREATE OR REPLACE FUNCTION public.validate_passcode(p_user_id UUID, p_passcode VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
BEGIN
  -- Find the passcode
  SELECT * INTO v_credits 
  FROM user_credits 
  WHERE passcode = p_passcode AND passcode_used = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or already used passcode');
  END IF;
  
  -- Apply the passcode to the user
  UPDATE user_credits
  SET is_premium = true,
      premium_uses_remaining = 100,
      premium_expires_at = now() + interval '30 days',
      passcode_used = true
  WHERE user_id = p_user_id;
  
  -- If no record exists for this user, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, is_premium, premium_uses_remaining, premium_expires_at)
    VALUES (p_user_id, true, 100, now() + interval '30 days');
    
    -- Mark the passcode as used
    UPDATE user_credits SET passcode_used = true WHERE passcode = p_passcode;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Premium activated! You have 100 uses for 30 days.');
END;
$$;