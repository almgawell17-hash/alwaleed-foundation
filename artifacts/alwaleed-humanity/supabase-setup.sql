-- AlWaleed for Humanity chat setup
-- Run once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'voice', 'file') OR media_type IS NULL),
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
  ON public.messages (conversation_id, created_at);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "messages_read_chat" ON public.messages;
CREATE POLICY "messages_read_chat" ON public.messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "messages_insert_anon" ON public.messages;
CREATE POLICY "messages_insert_anon" ON public.messages
  FOR INSERT TO anon WITH CHECK (role = 'user');

DROP POLICY IF EXISTS "messages_insert_authenticated" ON public.messages;
CREATE POLICY "messages_insert_authenticated" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    (role = 'user' AND conversation_id = auth.uid()::text)
    OR (role = 'agent' AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    ))
  );

DROP POLICY IF EXISTS "messages_admin_update" ON public.messages;
CREATE POLICY "messages_admin_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "messages_admin_delete" ON public.messages;
CREATE POLICY "messages_admin_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "chat_media_read" ON storage.objects;
CREATE POLICY "chat_media_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_upload" ON storage.objects;
CREATE POLICY "chat_media_upload" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_delete_admin" ON storage.objects;
CREATE POLICY "chat_media_delete_admin" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'chat-media' AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
