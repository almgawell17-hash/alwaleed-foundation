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
  Arabic-first dark theme (gold + teal palette), 4 tabs (Home, Campaigns, Chat, About)
  plus 5 stack screens pushed from the home screen: `donate`, `news`, `contact`,
  `settings`, `language`. Home header has a 3-dot menu (MaterialCommunityIcons
  `dots-vertical`) opening a Modal with App Settings / Change Language / About.
  The home screen's main CTA is a 3-button action row (تبرع الآن / آخر الأخبار /
  تواصل معنا) that pushes onto the stack. Offline support via AsyncStorage,
  simulated real-time support chat, tablet-ready.
  Font: Tajawal (Arabic + Latin), aliased to the `Inter_*` keys throughout the codebase.
  Local persistence keys: `@alwaleed/campaigns/v1`, `@alwaleed/news/v1`,
  `@alwaleed/saved/v1`, `@alwaleed/chat/v1`, `@alwaleed/settings/v1`,
  `@alwaleed/language/v1`.
- **api-server** (`/api`) — shared Express API (currently only `/api/healthz`).
- **mockup-sandbox** (`/__mockup`) — design canvas sandbox.
