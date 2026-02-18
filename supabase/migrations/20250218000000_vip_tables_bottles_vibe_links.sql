-- VIPsync: vip_tables ↔ map_tables, bottles links, vibe ↔ vibe_events, table_service_lto
-- Run after 20250217000000_table_bar_menu.sql

-- 1) Link vip_tables to map_tables by id
ALTER TABLE vip_tables
  ADD COLUMN IF NOT EXISTS map_table_id UUID REFERENCES map_tables(id);

CREATE INDEX IF NOT EXISTS idx_vip_tables_map_table ON vip_tables(map_table_id);

-- 2) Link table_service_items and bar_drink_items to bottles
ALTER TABLE table_service_items
  ADD COLUMN IF NOT EXISTS bottle_id UUID REFERENCES bottles(id);

CREATE INDEX IF NOT EXISTS idx_table_service_bottle ON table_service_items(bottle_id);

ALTER TABLE bar_drink_items
  ADD COLUMN IF NOT EXISTS bottle_id UUID REFERENCES bottles(id);

CREATE INDEX IF NOT EXISTS idx_bar_drink_bottle ON bar_drink_items(bottle_id);

-- 3) Table Service LTO (limited-time offers for table service)
CREATE TABLE IF NOT EXISTS table_service_lto (
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

CREATE INDEX IF NOT EXISTS idx_table_service_lto_venue_dates
  ON table_service_lto(venue_id, start_date, end_date);

ALTER TABLE table_service_lto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "table_service_lto_authenticated" ON table_service_lto;
CREATE POLICY "table_service_lto_authenticated"
  ON table_service_lto
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4) Integrate vibe with vibe_events via current_event_id
ALTER TABLE vibe
  ADD COLUMN IF NOT EXISTS current_event_id UUID REFERENCES vibe_events(id);

CREATE INDEX IF NOT EXISTS idx_vibe_current_event ON vibe(current_event_id);

-- VIPsync: vip_tables ↔ map_tables, bottles links, vibe ↔ vibe_events, table_service_lto
-- Run after 20250217000000_table_bar_menu.sql

-- 1) Link vip_tables to map_tables by id
ALTER TABLE vip_tables
  ADD COLUMN IF NOT EXISTS map_table_id UUID REFERENCES map_tables(id);

CREATE INDEX IF NOT EXISTS idx_vip_tables_map_table ON vip_tables(map_table_id);

-- 2) Link table_service_items and bar_drink_items to bottles
ALTER TABLE table_service_items
  ADD COLUMN IF NOT EXISTS bottle_id UUID REFERENCES bottles(id);

CREATE INDEX IF NOT EXISTS idx_table_service_bottle ON table_service_items(bottle_id);

ALTER TABLE bar_drink_items
  ADD COLUMN IF NOT EXISTS bottle_id UUID REFERENCES bottles(id);

CREATE INDEX IF NOT EXISTS idx_bar_drink_bottle ON bar_drink_items(bottle_id);

-- 3) Table Service LTO (limited-time offers for table service)
CREATE TABLE IF NOT EXISTS table_service_lto (
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

CREATE INDEX IF NOT EXISTS idx_table_service_lto_venue_dates
  ON table_service_lto(venue_id, start_date, end_date);

ALTER TABLE table_service_lto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "table_service_lto_authenticated" ON table_service_lto;
CREATE POLICY "table_service_lto_authenticated"
  ON table_service_lto
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4) Integrate vibe with vibe_events via current_event_id
ALTER TABLE vibe
  ADD COLUMN IF NOT EXISTS current_event_id UUID REFERENCES vibe_events(id);

CREATE INDEX IF NOT EXISTS idx_vibe_current_event ON vibe(current_event_id);

-- VIPsync: vip_tables ↔ map_tables, bottles links, vibe ↔ vibe_events, table_service_lto
-- Run after 20250217000000_table_bar_menu.sql

-- 1) Link vip_tables to map_tables by id
ALTER TABLE vip_tables
  ADD COLUMN IF NOT EXISTS map_table_id UUID REFERENCES map_tables(id);

CREATE INDEX IF NOT EXISTS idx_vip_tables_map_table ON vip_tables(map_table_id);

-- 2) Link table_service_items and bar_drink_items to bottles
ALTER TABLE table_service_items
  ADD COLUMN IF NOT EXISTS bottle_id UUID REFERENCES bottles(id);

CREATE INDEX IF NOT EXISTS idx_table_service_bottle ON table_service_items(bottle_id);

ALTER TABLE bar_drink_items
  ADD COLUMN IF NOT EXISTS bottle_id UUID REFERENCES bottles(id);

CREATE INDEX IF NOT EXISTS idx_bar_drink_bottle ON bar_drink_items(bottle_id);

-- 3) Table Service LTO (limited-time offers for table service)
CREATE TABLE IF NOT EXISTS table_service_lto (
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

CREATE INDEX IF NOT EXISTS idx_table_service_lto_venue_dates
  ON table_service_lto(venue_id, start_date, end_date);

ALTER TABLE table_service_lto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "table_service_lto_authenticated" ON table_service_lto;
CREATE POLICY "table_service_lto_authenticated"
  ON table_service_lto
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4) Integrate vibe with vibe_events via current_event_id
ALTER TABLE vibe
  ADD COLUMN IF NOT EXISTS current_event_id UUID REFERENCES vibe_events(id);

CREATE INDEX IF NOT EXISTS idx_vibe_current_event ON vibe(current_event_id);

