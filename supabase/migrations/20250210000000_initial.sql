-- VIPsync initial schema for Supabase
-- Run in Supabase SQL Editor or via supabase db push

-- Profiles (extends auth.users; we use custom JWT from Node so id = Google sub)
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

-- Bottles (venue inventory)
CREATE TABLE IF NOT EXISTS bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_key TEXT,
  image_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Live feed (ops feed items)
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

-- Vibe (current DJ state, singleton per venue)
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

-- Vibe events
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

-- Map tables (floor plan)
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

-- Chats
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

-- Chat messages
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

-- RLS is enabled; the Node API uses the service_role key which bypasses RLS.
-- Add policies here if you later use the anon key from the client.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
