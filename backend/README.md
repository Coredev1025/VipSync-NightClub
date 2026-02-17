# VIPsync API (Node.js backend)

Express.js API (plain JavaScript ESM) with Supabase. All source files are `.js`; the server entry is **src/index.js**.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase URL, keys, and optional Google/FCM config.
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
- `GET/POST /api/auth/*` — Auth (Supabase, Google).
- `GET/POST/PATCH/DELETE /api/*` — Per resource (bottles, live-feed, tables, etc.).
