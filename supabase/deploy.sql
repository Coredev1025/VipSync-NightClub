-- VIPsync full schema deployment
-- Run this in Supabase Dashboard > SQL Editor if you prefer manual setup over Supabase CLI
-- Or use: supabase db push (after supabase link)

-- ========== MIGRATION 1: Initial schema ==========

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone TEXT,
  picture TEXT,
  mode TEXT NOT NULL DEFAULT 'pro' CHECK (mode IN ('pro', 'user')),
  pro_role TEXT NOT NULL DEFAULT 'promoter' CHECK (pro_role IN ('promoter', 'door', 'manager', 'owner')),
  settings_account JSONB DEFAULT '{}',
  settings_notifications JSONB DEFAULT '{}',
  settings_privacy JSONB DEFAULT '{}',
  settings_club JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_key TEXT,
  image_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('order', 'arrival', 'alert', 'geo')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  time TEXT NOT NULL,
  "table" INTEGER,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vibe (
  venue_id TEXT PRIMARY KEY DEFAULT 'default',
  dj_name TEXT NOT NULL DEFAULT 'DJ KHALED',
  dj_status TEXT NOT NULL DEFAULT 'ON DECKS' CHECK (dj_status IN ('ON DECKS', 'OFF DECKS', 'SCHEDULED', 'BREAK')),
  genres TEXT NOT NULL DEFAULT '',
  dj_initials TEXT NOT NULL DEFAULT 'DK',
  scheduled_time TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO vibe (venue_id) VALUES ('default') ON CONFLICT (venue_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS vibe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  dj_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  genres TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  number INTEGER NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'occupied', 'booked', 'pending')),
  capacity INTEGER NOT NULL DEFAULT 6,
  current_guests INTEGER NOT NULL DEFAULT 0,
  guest_name TEXT,
  spend NUMERIC,
  pending_spend NUMERIC,
  items_summary TEXT,
  primary_staff TEXT,
  backup_staff TEXT,
  assigned_to TEXT,
  promoter TEXT,
  server TEXT,
  eta TEXT,
  guest_avatar_key TEXT,
  promoter_avatar_key TEXT,
  bottle_girl_avatar_key TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  is_dj_booth BOOLEAN DEFAULT FALSE,
  dj_set_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  is_group BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  msg TEXT NOT NULL,
  me BOOLEAN NOT NULL DEFAULT TRUE,
  sender TEXT,
  role TEXT,
  sender_id TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_live_feed_created ON live_feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_events_venue ON vibe_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_map_tables_venue ON map_tables(venue_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ========== MIGRATION 2: Supabase Auth + RLS ==========

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

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

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth_id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth_id = auth.uid());

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
