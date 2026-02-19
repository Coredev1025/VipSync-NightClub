-- Allow mode and pro_role to be NULL so new OAuth users go through onboarding
-- (mode/role chosen on login flow instead of defaulting to pro/promoter).

-- 1) Make mode nullable and drop default; drop column check that forbids NULL (mode IN ('pro','user'))
ALTER TABLE profiles ALTER COLUMN mode DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN mode DROP DEFAULT;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_mode_check;

-- 2) Drop the existing pro_role/mode check so we can add one that allows NULL mode
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pro_role_mode_check;

-- 3) Allow: (mode IS NULL AND pro_role IS NULL) for pending onboarding
ALTER TABLE profiles ADD CONSTRAINT profiles_pro_role_mode_check
  CHECK (
    (mode IS NULL AND pro_role IS NULL)
    OR (mode = 'user' AND pro_role IS NULL)
    OR (mode = 'pro' AND (pro_role IS NULL OR pro_role IN ('promoter', 'door', 'manager', 'owner')))
  );

-- 4) Trigger: new auth users get profile with NULL mode/pro_role so app shows mode selection
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, auth_id, email, name, picture, mode, pro_role)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'sub', NEW.id::text),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    picture = EXCLUDED.picture,
    updated_at = NOW();
  RETURN NEW;
END;
$$;
