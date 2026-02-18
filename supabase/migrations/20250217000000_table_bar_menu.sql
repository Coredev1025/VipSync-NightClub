-- Table & Bar Menu: VIP Bottle Packages and Bar Drinks
-- Run after existing migrations

-- VIP Bottle Packages (Table Service)
CREATE TABLE IF NOT EXISTS table_service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  item_name TEXT NOT NULL,
  price TEXT NOT NULL,
  capacity TEXT,
  description TEXT,
  limited_offer BOOLEAN DEFAULT FALSE,
  limited_date_start DATE,
  limited_date DATE,
  discount_offer BOOLEAN DEFAULT FALSE,
  discount_price TEXT,
  discount_time_limit_start DATE,
  discount_time_limit DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_table_service_venue ON table_service_items(venue_id);
ALTER TABLE table_service_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "table_service_authenticated" ON table_service_items;
CREATE POLICY "table_service_authenticated" ON table_service_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bar Drinks (e.g. Craft Cocktails)
CREATE TABLE IF NOT EXISTS bar_drink_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  item_name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  limited_offer BOOLEAN DEFAULT FALSE,
  limited_date_start DATE,
  limited_date DATE,
  discount_offer BOOLEAN DEFAULT FALSE,
  discount_price TEXT,
  discount_time_limit_start DATE,
  discount_time_limit DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bar_drink_venue ON bar_drink_items(venue_id);
ALTER TABLE bar_drink_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bar_drink_authenticated" ON bar_drink_items;
CREATE POLICY "bar_drink_authenticated" ON bar_drink_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
