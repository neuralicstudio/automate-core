# Deployment Instructions

## Option 1: Lovable (Recommended - Already Active)
Your app is already deployed on Lovable with Cloud backend. Just click **Publish** in the top right!

---

## Option 2: Render Deployment (Independent Hosting)

### Prerequisites
1. A GitHub account (code will be pushed there)
2. A Render account (https://render.com)
3. A Supabase account (https://supabase.com) - for external hosting
4. OpenAI API key (for AI features)

### Step 1: Export Code to GitHub
1. In Lovable, click **Settings** → **GitHub** → **Connect Repository**
2. Create a new repository or connect existing one
3. Your code will sync automatically

### Step 2: Create External Supabase Project
1. Go to https://supabase.com and create a new project
2. Run the following SQL in the SQL Editor to set up your database:

```sql
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create user_credits table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_uses INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_uses_remaining INTEGER NOT NULL DEFAULT 0,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  passcode VARCHAR,
  passcode_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vin VARCHAR NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  trim TEXT,
  engine TEXT,
  transmission TEXT,
  drivetrain TEXT,
  fuel_type TEXT,
  body_style TEXT,
  manufacturer TEXT,
  plant_city TEXT,
  plant_country TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vin_lookups table
CREATE TABLE public.vin_lookups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  vin VARCHAR NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vin_lookups ENABLE ROW LEVEL SECURITY;

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create increment_usage function
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
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, total_uses) 
    VALUES (p_user_id, 0)
    RETURNING * INTO v_credits;
  END IF;
  
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

-- Create validate_passcode function
CREATE OR REPLACE FUNCTION public.validate_passcode(p_user_id UUID, p_passcode VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
BEGIN
  SELECT * INTO v_credits 
  FROM user_credits 
  WHERE passcode = p_passcode AND passcode_used = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or already used passcode');
  END IF;
  
  UPDATE user_credits
  SET is_premium = true,
      premium_uses_remaining = 100,
      premium_expires_at = now() + interval '30 days',
      passcode_used = true
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, is_premium, premium_uses_remaining, premium_expires_at)
    VALUES (p_user_id, true, 100, now() + interval '30 days');
    
    UPDATE user_credits SET passcode_used = true WHERE passcode = p_passcode;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Premium activated! You have 100 uses for 30 days.');
END;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credits" ON public.user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credits" ON public.user_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user_credits" ON public.user_credits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert passcodes" ON public.user_credits FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete unused passcodes" ON public.user_credits FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND passcode_used = false);

-- RLS Policies for vehicles
CREATE POLICY "Users can view their own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vin_lookups
CREATE POLICY "Users can view their own lookups" ON public.vin_lookups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lookups" ON public.vin_lookups FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. Go to **Settings** → **API** and copy:
   - Project URL
   - anon/public key

### Step 3: Deploy Edge Functions to External Supabase
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Set secrets:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_key
   supabase secrets set LOVABLE_API_KEY=your_lovable_key  # If using Lovable AI
   ```
5. Deploy functions: `supabase functions deploy`

### Step 4: Deploy Frontend to Render
1. Go to https://render.com and create a **Static Site**
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = Your Supabase anon key
5. Click **Deploy**

### Step 5: Configure Auth Redirect URLs
In your external Supabase project:
1. Go to **Authentication** → **URL Configuration**
2. Add your Render URL to **Site URL**
3. Add to **Redirect URLs**: `https://your-app.onrender.com/*`

---

## Environment Variables Reference

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `OPENAI_API_KEY` | OpenAI API key (for edge functions) | https://platform.openai.com/api-keys |

---

## Making Yourself Admin (External Supabase)

After deploying, sign up with your email, then run this SQL in Supabase:

```sql
-- Replace with your actual user ID after signing up
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users WHERE email = 'your-email@example.com';
```

---

## Troubleshooting

### CORS Errors
Ensure your Render URL is added to Supabase's allowed origins in **Authentication** → **URL Configuration**.

### Edge Functions Not Working
1. Check function logs: `supabase functions logs function-name`
2. Verify secrets are set: `supabase secrets list`

### Auth Redirect Issues
Make sure redirect URLs match exactly (including trailing slashes).
