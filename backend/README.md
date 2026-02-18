# VIPsync API (Node.js backend)

Express.js API (plain JavaScript ESM) with Supabase. All source files are `.js`; the server entry is **src/index.js**.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase URL, keys, and optional FCM config.
npm install
```

## Run

- **Development** (auto-restart on file changes):
  ```bash
  npm run dev
  ```
  Uses `node --watch src/index.js`.

- **Production:**
  ```bash
  npm start
  ```
  Runs `node src/index.js`.

## Layout

- **Entry:** `src/index.js` (this is the “server”; no `server.js` file).
- **Routes:** `src/routes/*.js` — auth, bottles, live-feed, vibe, tables, profile, chats, contacts, ops, push, guest, bar-lto, map.
- **Middleware:** `src/middleware/` (auth, require-permission).
- **Services:** `src/services/` (fcm, permissions).
- **Config:** `src/supabase.js`, `.env` (see `.env.example`).

## Endpoints

- `GET /` — API info.
- `GET /health` — Health check (`{ ok: true }`).
- `GET/POST /api/auth/*` — Auth (Supabase JWT exchange).
- `GET/POST/PATCH/DELETE /api/*` — Per resource (bottles, live-feed, tables, etc.).

## Supabase schema (fix "Profile insert failed" / "table 'public.profiles' not in schema cache")

The API expects a `profiles` table in your Supabase project. If you see:

- **Backend:** `Profile insert failed: Could not find the table 'public.profiles' in the schema cache`
- **App:** `[Auth] Backend sync failed: Profile insert failed`

then the database schema has not been applied. In **Supabase Dashboard → SQL Editor**, run the migrations in order:

1. **`supabase/migrations/20250210000000_initial.sql`** — creates `profiles`, `bottles`, `live_feed_items`, `vibe`, etc.
2. **`supabase/migrations/20250210100000_supabase_auth_rls.sql`** — adds `auth_id` and trigger for new auth users, RLS policies.

Copy each file’s contents into the SQL Editor and run it. After that, sign-in and profile sync should work.
