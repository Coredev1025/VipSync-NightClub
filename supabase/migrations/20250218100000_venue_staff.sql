-- Venue staff (bottle girls, etc.) for assign/edit dropdowns.
-- Promoters come from profiles (pro_role = 'promoter'); bottle girls from this table.
CREATE TABLE IF NOT EXISTS venue_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('bottle_girl', 'promoter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_venue_staff_venue_role ON venue_staff(venue_id, role);
ALTER TABLE venue_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venue_staff_authenticated" ON venue_staff;
CREATE POLICY "venue_staff_authenticated" ON venue_staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
