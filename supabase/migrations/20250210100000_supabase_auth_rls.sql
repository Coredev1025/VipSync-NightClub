-- Supabase Auth integration: link profiles to auth.users and add RLS
-- Run after 20250210000000_initial.sql

-- Link profiles to Supabase Auth (auth.users.id is UUID)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Trigger: create profile when a new auth user is created (e.g. Google OAuth)
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
    'pro',
    'promoter'
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- RLS policies: authenticated users use auth.uid() (Supabase JWT sub)
-- Profiles: users can read/update their own (by auth_id)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth_id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Allow read for profile by auth_id (trigger inserts with auth_id, so select works)
-- Service role can still do everything (bypasses RLS)

-- Bottles, live_feed, vibe, map_tables, chats: allow authenticated to manage (venue-scoped later)
DROP POLICY IF EXISTS "bottles_all_authenticated" ON bottles;
CREATE POLICY "bottles_all_authenticated" ON bottles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "live_feed_all_authenticated" ON live_feed_items;
CREATE POLICY "live_feed_all_authenticated" ON live_feed_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "vibe_all_authenticated" ON vibe;
CREATE POLICY "vibe_all_authenticated" ON vibe FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "vibe_events_all_authenticated" ON vibe_events;
CREATE POLICY "vibe_events_all_authenticated" ON vibe_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "map_tables_all_authenticated" ON map_tables;
CREATE POLICY "map_tables_all_authenticated" ON map_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "chats_all_authenticated" ON chats;
CREATE POLICY "chats_all_authenticated" ON chats FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "chat_messages_all_authenticated" ON chat_messages;
CREATE POLICY "chat_messages_all_authenticated" ON chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Drop default deny if any (Supabase enables RLS with default deny)
-- The above policies grant access; ensure no other policies block
