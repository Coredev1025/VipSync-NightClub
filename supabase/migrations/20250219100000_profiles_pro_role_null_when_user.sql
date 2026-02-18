-- When mode is 'user', pro_role must be NULL.
-- Makes pro_role nullable and enforces (mode = 'user' -> pro_role IS NULL).

-- Drop existing NOT NULL and CHECK so we can change the column
ALTER TABLE profiles ALTER COLUMN pro_role DROP NOT NULL;

-- Drop the default so new user rows don't get 'promoter'
ALTER TABLE profiles ALTER COLUMN pro_role DROP DEFAULT;

-- Remove the old check constraint (name may vary; try common pattern)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname LIKE '%pro_role%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(c.conname)
      FROM pg_constraint c
      WHERE c.conrelid = 'public.profiles'::regclass
        AND c.conname LIKE '%pro_role%'
      LIMIT 1
    );
  END IF;
END $$;

-- Ensure existing user-mode rows have pro_role = NULL
UPDATE profiles SET pro_role = NULL WHERE mode = 'user';

-- Enforce: when mode is user, pro_role must be null; when mode is pro, pro_role must be allowed or null
ALTER TABLE profiles ADD CONSTRAINT profiles_pro_role_mode_check
  CHECK (
    (mode = 'user' AND pro_role IS NULL)
    OR (mode = 'pro' AND (pro_role IS NULL OR pro_role IN ('promoter', 'door', 'manager', 'owner')))
  );
