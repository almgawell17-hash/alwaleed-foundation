import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://rixxshbiyahqogaythej.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeHhzaGJpeWFocW9nYXl0aGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDM4ODgsImV4cCI6MjA5MzMxOTg4OH0.C0IANrYLuS0gcWLvPWrVS9PfdRxJGwQHnTNnpQrkBSM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const CHAT_TABLE = "chat_messages";

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * SUPABASE SETUP — run the following SQL in your Supabase SQL Editor once:
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * create table if not exists chat_messages (
 *   id          text primary key,
 *   session_id  text not null,
 *   role        text not null check (role in ('user', 'agent')),
 *   content     text,
 *   media_type  text,
 *   file_name   text,
 *   created_at  timestamptz default now()
 * );
 *
 * create index on chat_messages (session_id, created_at);
 *
 * -- Enable Row-Level Security (open policy for client app)
 * alter table chat_messages enable row level security;
 * create policy "allow_all" on chat_messages for all using (true) with check (true);
 *
 * -- Enable Realtime
 * alter publication supabase_realtime add table chat_messages;
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */
