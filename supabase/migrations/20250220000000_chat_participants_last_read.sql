-- Chat participants: add last_read_at for unread message counts
-- Run after 20250211000000_otp_contacts_revenue_push_guest.sql

ALTER TABLE chat_participants
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- Backfill: add creator as participant for existing chats that have no participants
INSERT INTO chat_participants (chat_id, profile_id, last_read_at)
SELECT c.id, c.created_by, NOW()
FROM chats c
WHERE c.created_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.profile_id = c.created_by);

-- Existing participants: consider all messages read as of now
UPDATE chat_participants
SET last_read_at = NOW()
WHERE last_read_at IS NULL;

COMMENT ON COLUMN chat_participants.last_read_at IS 'When this user last read messages in this chat; used to compute unread count.';

-- Realtime: broadcast new chat messages to clients (skip if already added)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;
