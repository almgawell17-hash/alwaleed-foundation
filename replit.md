# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **alwaleed-humanity** (`/`) — Expo mobile app for "AlWaleed for Humanity / مؤسسة الوليد للإنسانية".
  Arabic-first dark theme (gold #D4A24C + teal #0E8388, bg #0A1014), 4 tabs (Home, Campaigns, Chat, About)
  plus stack screens: `donate`, `news`, `contact`, `settings`, `language`, `admin`.
  Font: Tajawal (Arabic + Latin), aliased to `Inter_*` keys throughout.

  **Auth system** (`hooks/useAuth.tsx`):
  - Google OAuth via Supabase + expo-web-browser (native) / redirect (web)
  - Anonymous fallback: unique session_id stored in AsyncStorage
  - Admin unlock: long-press chat avatar → enter `EXPO_PUBLIC_ADMIN_SECRET`
  - Auth decision persisted in `@alwaleed/auth-decided/v1`

  **Chat system** (`hooks/useChat.tsx`):
  - session_id sourced from useAuth (Google user ID or anon ID)
  - Supabase Realtime subscription per session (postgres_changes)
  - Local auto-reply fallback when offline
  - Media: image, video, voice (expo-av), file bubbles
  - Push notifications via expo-notifications for agent replies

  **Admin Panel** (`app/admin.tsx`):
  - Session list: all distinct session_ids with last message preview + unread indicator
  - Session detail: full message history (ChatBubble) + reply-as-agent input bar
  - Realtime: subscribes to new messages across all sessions (list) and per session (detail)
  - Access: long-press chat avatar → enter admin code → navigates to /admin modal

  **Supabase** (`lib/supabase.ts`):
  - Project: rixxshbiyahqogaythej.supabase.co
  - Table: `chat_messages` (id, session_id, role, content, media_type, file_name, created_at)
  - SQL setup: `artifacts/alwaleed-humanity/supabase-setup.sql`
  - Env vars: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_ADMIN_SECRET

  Local persistence keys: `@alwaleed/campaigns/v1`, `@alwaleed/news/v1`,
  `@alwaleed/saved/v1`, `@alwaleed/chat/v2`, `@alwaleed/settings/v1`,
  `@alwaleed/language/v1`, `@alwaleed/session/v2`, `@alwaleed/auth-decided/v1`.
- **api-server** (`/api`) — shared Express API (currently only `/api/healthz`).
- **mockup-sandbox** (`/__mockup`) — design canvas sandbox.
