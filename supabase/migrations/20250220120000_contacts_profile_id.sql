-- Link contacts to profiles so recipients can show "contact name" or "Unknown"
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_profile_id ON contacts(profile_id);
