-- VIPsync: seed sample tables and users
-- Run after 20250218000000_vip_tables_bottles_vibe_links.sql

-- 1) Seed 3 sample floor-plan tables (map_tables)
INSERT INTO map_tables (venue_id, number, x, y, status, capacity, is_vip, created_at, updated_at)
SELECT 'default', 4, 120, 180, 'open', 8, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM map_tables WHERE venue_id = 'default' AND number = 4
);

INSERT INTO map_tables (venue_id, number, x, y, status, capacity, is_vip, created_at, updated_at)
SELECT 'default', 6, 220, 180, 'booked', 6, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM map_tables WHERE venue_id = 'default' AND number = 6
);

INSERT INTO map_tables (venue_id, number, x, y, status, capacity, is_vip, created_at, updated_at)
SELECT 'default', 10, 320, 180, 'open', 4, FALSE, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM map_tables WHERE venue_id = 'default' AND number = 10
);

-- Link existing VIP table seeds to matching map_tables by table number
-- (TABLE 4 -> number 4, TABLE 6 -> number 6)
UPDATE vip_tables v
SET map_table_id = m.id
FROM map_tables m
WHERE v.venue_id = 'default'
  AND m.venue_id = 'default'
  AND v.map_table_id IS NULL
  AND (
    (v.name = 'TABLE 4' AND m.number = 4) OR
    (v.name = 'TABLE 6' AND m.number = 6)
  );

-- 2) Seed 5 sample user profiles
INSERT INTO profiles (id, email, name, phone, mode, created_at, updated_at)
SELECT 'guest_alex', 'alex.rivera@example.com', 'Alex Rivera', '+1-555-0101', 'user', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = 'guest_alex'
);

INSERT INTO profiles (id, email, name, phone, mode, created_at, updated_at)
SELECT 'guest_bri', 'brianna.lee@example.com', 'Brianna Lee', '+1-555-0102', 'user', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = 'guest_bri'
);

INSERT INTO profiles (id, email, name, phone, mode, created_at, updated_at)
SELECT 'guest_cj', 'cj.martin@example.com', 'CJ Martin', '+1-555-0103', 'user', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = 'guest_cj'
);

INSERT INTO profiles (id, email, name, phone, mode, created_at, updated_at)
SELECT 'guest_dana', 'dana.cho@example.com', 'Dana Cho', '+1-555-0104', 'user', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = 'guest_dana'
);

INSERT INTO profiles (id, email, name, phone, mode, created_at, updated_at)
SELECT 'guest_eli', 'eli.james@example.com', 'Eli James', '+1-555-0105', 'user', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = 'guest_eli'
);

