-- ============================================================
-- AlWaleed for Humanity — Supabase Chat Setup
-- Run this once in your Supabase SQL Editor
-- ============================================================

-- 1. Create the chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content     TEXT,
  media_type  TEXT CHECK (media_type IN ('image', 'video', 'voice', 'file') OR media_type IS NULL),
  file_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast per-session queries
CREATE INDEX IF NOT EXISTS idx_chat_session_time
  ON chat_messages (session_id, created_at);

-- 3. Enable Row-Level Security (open policy for the mobile app)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_chat"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================================
-- Done! Messages from the app will now sync in real-time.
-- Admins can reply by inserting a row with role = 'agent'
-- and the matching session_id of the user they want to reply to.
--
-- Example admin reply:
-- INSERT INTO chat_messages (id, session_id, role, content)
-- VALUES (gen_random_uuid()::text, '<user-session-id>', 'agent', 'مرحباً، كيف يمكنني مساعدتك؟');
-- ============================================================
