import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const CHAT_TABLE = "messages";
export const MEDIA_BUCKET = "chat-media";

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * SUPABASE SETUP — run supabase-setup.sql in your Supabase SQL Editor once:
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * create table if not exists messages (
 *   id              text primary key,
 *   conversation_id text not null,
 *   role        text not null check (role in ('user', 'agent')),
 *   content     text,
 *   media_type  text,
 *   file_name   text,
 *   created_at  timestamptz default now()
 * );
 *
 * create index on messages (conversation_id, created_at);
 *
 * -- Enable Row-Level Security (open policy for client app)
 * alter table messages enable row level security;
 *
 * -- Enable Realtime
 * alter publication supabase_realtime add table messages;
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */
