-- VIPsync: contacts, revenue, push tokens, guest features, bar LTO
-- Run after 20250210100000_supabase_auth_rls.sql

-- Contacts (staff contacts for chat; owner = profile id)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_own" ON contacts;
CREATE POLICY "contacts_own" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chat participants (for group chats; links profiles to chats)
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chat_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_profile ON chat_participants(profile_id);
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_participants_authenticated" ON chat_participants;
CREATE POLICY "chat_participants_authenticated" ON chat_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Revenue goals (per venue per date; for Ops donut)
CREATE TABLE IF NOT EXISTS revenue_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  goal_date DATE NOT NULL,
  goal_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  comparison_previous_amount NUMERIC,
  comparison_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(venue_id, goal_date)
);
CREATE INDEX IF NOT EXISTS idx_revenue_goals_venue_date ON revenue_goals(venue_id, goal_date);
ALTER TABLE revenue_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "revenue_goals_authenticated" ON revenue_goals;
CREATE POLICY "revenue_goals_authenticated" ON revenue_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Push tokens (FCM device tokens per user)
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_tokens_own" ON push_tokens;
CREATE POLICY "push_tokens_own" ON push_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Featured tables (guest home: name, seats, min_spend, tag)
CREATE TABLE IF NOT EXISTS featured_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  seats TEXT NOT NULL,
  min_spend NUMERIC NOT NULL DEFAULT 0,
  tag TEXT CHECK (tag IN ('HOT', 'LIMITED', 'BEST VALUE')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_featured_tables_venue ON featured_tables(venue_id);
ALTER TABLE featured_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "featured_tables_authenticated" ON featured_tables;
CREATE POLICY "featured_tables_authenticated" ON featured_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- VIP tables: bidding or booking (guest home)
CREATE TABLE IF NOT EXISTS vip_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  type TEXT NOT NULL CHECK (type IN ('bidding', 'booking')),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 6,
  -- Bidding
  current_bid NUMERIC,
  leader TEXT,
  next_bid_amount NUMERIC,
  -- Booking
  description TEXT,
  min_spend NUMERIC,
  --
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vip_tables_venue ON vip_tables(venue_id);
ALTER TABLE vip_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vip_tables_authenticated" ON vip_tables;
CREATE POLICY "vip_tables_authenticated" ON vip_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Guest follows (DJs or events; entity_type = 'dj', entity_id = slug or id)
CREATE TABLE IF NOT EXISTS guest_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_guest_follows_profile ON guest_follows(profile_id);
ALTER TABLE guest_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guest_follows_own" ON guest_follows;
CREATE POLICY "guest_follows_own" ON guest_follows FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bar LTO (limited-time offers; date range)
CREATE TABLE IF NOT EXISTS bar_lto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  menu_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bar_lto_venue_dates ON bar_lto(venue_id, start_date, end_date);
ALTER TABLE bar_lto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bar_lto_authenticated" ON bar_lto;
CREATE POLICY "bar_lto_authenticated" ON bar_lto FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed featured_tables and vip_tables for default venue (run once; skip if already seeded)
INSERT INTO featured_tables (venue_id, name, seats, min_spend, tag, sort_order)
SELECT 'default', 'Jade Booth', '4–6', 1200, 'HOT', 1
WHERE NOT EXISTS (SELECT 1 FROM featured_tables WHERE venue_id = 'default' AND name = 'Jade Booth');
INSERT INTO featured_tables (venue_id, name, seats, min_spend, tag, sort_order)
SELECT 'default', 'Pearl Sofa', '2–4', 800, 'BEST VALUE', 2
WHERE NOT EXISTS (SELECT 1 FROM featured_tables WHERE venue_id = 'default' AND name = 'Pearl Sofa');
INSERT INTO featured_tables (venue_id, name, seats, min_spend, tag, sort_order)
SELECT 'default', 'Tokyo Stage', '6–10', 2200, 'LIMITED', 3
WHERE NOT EXISTS (SELECT 1 FROM featured_tables WHERE venue_id = 'default' AND name = 'Tokyo Stage');

INSERT INTO vip_tables (venue_id, type, name, capacity, current_bid, leader, next_bid_amount, sort_order)
SELECT 'default', 'bidding', 'TABLE 4', 8, 1200, '@CryptoKing', 1250, 1
WHERE NOT EXISTS (SELECT 1 FROM vip_tables WHERE venue_id = 'default' AND name = 'TABLE 4');
INSERT INTO vip_tables (venue_id, type, name, capacity, current_bid, leader, next_bid_amount, sort_order)
SELECT 'default', 'bidding', 'Jade Booth', 6, 1100, '@VIPGuest', 1200, 2
WHERE NOT EXISTS (SELECT 1 FROM vip_tables WHERE venue_id = 'default' AND name = 'Jade Booth' AND type = 'bidding');
INSERT INTO vip_tables (venue_id, type, name, capacity, description, min_spend, sort_order)
SELECT 'default', 'booking', 'TABLE 6', 6, 'Great view of the stage. Standard minimum spend applies.', 500, 3
WHERE NOT EXISTS (SELECT 1 FROM vip_tables WHERE venue_id = 'default' AND name = 'TABLE 6');
INSERT INTO vip_tables (venue_id, type, name, capacity, description, min_spend, sort_order)
SELECT 'default', 'booking', 'Pearl Sofa', 4, 'Intimate setting. Min spend applies.', 800, 4
WHERE NOT EXISTS (SELECT 1 FROM vip_tables WHERE venue_id = 'default' AND name = 'Pearl Sofa' AND type = 'booking');
