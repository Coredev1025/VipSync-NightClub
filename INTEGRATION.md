# VIPsync — Frontend, Backend & Supabase Integration

This document describes how the React Native app, Node API, and Supabase database are wired together and how to run the full stack.

## Overview

- **Frontend**: Expo/React Native app in this repo (`app/`, `src/`). When `EXPO_PUBLIC_API_URL` is set to a non-localhost URL, the app uses the backend for data; otherwise it runs with local/AsyncStorage data only.
- **Backend**: Node.js API in `backend/`. It uses Supabase as the database and issues JWTs after sign-in (Supabase auth).
- **Database**: Supabase. Schema is in `supabase/migrations/20250210000000_initial.sql`.

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of `supabase/migrations/20250210000000_initial.sql`.
3. In Project Settings → API, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET (or JWT_SECRET)
npm install
npm run dev
```

API runs at `http://10.0.2.2:3000`. Endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | /api/bottles, /api/bottles/:id | Bottles full CRUD (Manager/Owner only for write) |
| GET/POST/PATCH/DELETE | /api/live-feed, /api/live-feed/:id | Live feed items (Manager/Owner only); DELETE /api/live-feed/clear to clear all |
| GET/PATCH | /api/vibe | Current DJ vibe (singleton) |
| GET/POST/PATCH/DELETE | /api/vibe/events, /api/vibe/events/:id | Vibe events (Manager/Owner only for write) |
| GET/POST/PATCH/DELETE | /api/tables, /api/tables/:id | Map tables full CRUD (Door view-only; Manager/Owner can edit table girl) |
| GET/PATCH | /api/profile | Profile and settings |
| GET/POST/PATCH/DELETE | /api/chats, /api/chats/:id | Chats full CRUD |
| GET/POST/PATCH/DELETE | /api/chats/:id/messages, ... | Chat messages full CRUD |
| GET/POST/PATCH/DELETE | /api/contacts, /api/contacts/:id | Contacts (owner = current user) |
| GET/PATCH | /api/ops/revenue | Revenue goal and summary for Ops donut (Manager/Owner only) |
| POST | /api/push/register | Register FCM device token; body: `{ token, platform? }` |
| POST | /api/push/send-all | Send push to all registered users (Manager/Owner only); body: `{ title, body?, data? }` |
| GET | /api/guest/featured-tables | Guest home featured tables |
| GET | /api/guest/vip-tables | Guest home VIP (bidding + booking) |
| POST | /api/guest/vip-tables/:id/bid | Place bid on VIP bidding table |
| GET | /api/guest/events | Guest home events (from vibe_events) |
| GET/POST/DELETE | /api/guest/follows | Guest DJ/entity follows |
| GET/POST/PATCH/DELETE | /api/bar-lto | Bar LTO (limited-time offers) |
| POST | /api/map/pdf | PDF table import stub (Pro edit-map only) |

All routes except `/api/auth/supabase` and `/health` require `Authorization: Bearer <accessToken>`.

### 3. Frontend

```bash
# From repo root
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend URL (e.g. ngrok URL for device testing)
# Set EXPO_PUBLIC_API_URL to your backend URL
npm install
npx expo start
```

- If **EXPO_PUBLIC_API_URL** is set to a non-localhost URL, the app uses the API for:
  - **Bottles** — list, add, update, delete (BottlesContext).
  - **Live feed** — list, add, update, remove single item, clear all (LiveFeedContext); `updateFeedItem`, `removeFeedItem`, `clearFeed`.
  - **Vibe & vibe events** — current vibe and events full CRUD (VibeContext); staff home tab.
  - **Map tables** — full CRUD (TablesContext); map tab.
  - **Profile** — GET on load and PATCH on save for account, notifications, privacy, club settings (profile-tab, guest-account-tab); `src/lib/profile-sync.ts`.
  - **Chats** — full CRUD: list, create, update, delete chats; fetch/send/update/delete messages (ChatsContext).
- If not set or localhost, the app runs with local/AsyncStorage data only (no backend calls for the above).

## Data CRUD summary

| Entity | Create | Read | Update | Delete | Frontend |
|--------|--------|------|--------|--------|----------|
| **Auth/Profile** | On sign-in | GET /api/profile | PATCH /api/profile | — | profile-sync, auth-screen, index |
| **Bottles** | POST /api/bottles | GET /api/bottles | PATCH /api/bottles/:id | DELETE /api/bottles/:id | BottlesContext |
| **Live feed** | POST /api/live-feed | GET /api/live-feed | PATCH /api/live-feed/:id | DELETE /api/live-feed/:id, DELETE /clear | LiveFeedContext (addFeedItem, updateFeedItem, removeFeedItem, clearFeed) |
| **Vibe** | — | GET /api/vibe | PATCH /api/vibe | — | VibeContext |
| **Vibe events** | POST /api/vibe/events | GET /api/vibe/events | PATCH /api/vibe/events/:id | DELETE /api/vibe/events/:id | VibeContext |
| **Map tables** | POST /api/tables | GET /api/tables | PATCH /api/tables/:id | DELETE /api/tables/:id | TablesContext |
| **Chats** | POST /api/chats | GET /api/chats | PATCH /api/chats/:id | DELETE /api/chats/:id | ChatsContext |
| **Chat messages** | POST /api/chats/:id/messages | GET /api/chats/:id/messages | PATCH /api/chats/:id/messages/:msgId | DELETE /api/chats/:id/messages/:msgId | ChatsContext |
| **Profile settings** | — | GET /api/profile (settings_*) | PATCH /api/profile (settings_account, settings_notifications, settings_privacy, settings_club) | — | profile-tab, guest-account-tab via profile-sync |

## Data flow

1. **Auth**: User signs in via Supabase (e.g. magic link or other provider). The app exchanges the Supabase session for a JWT via `POST /api/auth/supabase`. The backend verifies the Supabase token and returns a JWT. The app stores the JWT and uses it for all subsequent API requests.
2. **Profile**: After onboarding, the app sends `PATCH /api/profile` with `mode` and `pro_role` so the backend profile stays in sync.
3. **Bottles / Live feed / Vibe / Tables**: Each context fetches from the API when connected and persists changes via the API; when not connected, it uses local state or AsyncStorage.

## Environment variables

### App (`.env` in repo root)

| Variable | Purpose |
|----------|---------|
| EXPO_PUBLIC_API_URL | Backend base URL; when set (and not localhost), app uses API for data |
### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| PORT | Server port (default 3000) |
| JWT_SECRET | Secret for signing JWTs |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key |
| FIREBASE_SERVICE_ACCOUNT_JSON | JSON string of Firebase service account key for FCM (optional) |
| GOOGLE_APPLICATION_CREDENTIALS | Path to Firebase service account JSON file (optional, alternative to above) |

## Chats

Chats are wired to the API via `ChatsContext`: the list comes from GET /api/chats, messages from GET /api/chats/:id/messages when a chat is opened, and sending a message uses POST /api/chats/:id/messages. Creating a new chat (new contact or new group) uses POST /api/chats. When the API is not connected, the app uses default local chats and in-memory messages.

## Security

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` to the client.
- Use a strong `JWT_SECRET` in production.
- In production, run the API over HTTPS and set CORS appropriately.
