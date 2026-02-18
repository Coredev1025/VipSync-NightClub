# Frontend ↔ Backend ↔ Database Connection

## Architecture

```
┌─────────────┐     HTTP + JWT      ┌─────────────┐     service_role     ┌─────────────┐
│   Frontend  │ ──────────────────► │   Backend   │ ──────────────────► │   Supabase  │
│  (Expo app) │                     │ (Node API)  │                     │  (Postgres) │
└─────────────┘                     └─────────────┘                     └─────────────┘
```

## Setup

### 1. Database (Supabase)

Deploy schema:

```bash
npm run db:push
# or run supabase/deploy.sql in Supabase Dashboard SQL Editor
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
npm run dev
```

Backend listens on `http://10.0.2.2:3000` (reachable from device/emulator).

### 3. Frontend

Add to `.env` (project root):

```env
# Backend API URL - use your machine's local IP when testing on device
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

```

For **Android emulator**, use `http://10.0.2.2:3000` to reach host machine's localhost.

### 4. Verify

1. **Start the backend** (must be running first):
   ```bash
   cd backend && npm run dev
   ```
   You should see: `VIPsync API listening on http://0.0.0.0:3000`

2. **Set the frontend API URL** in project root `.env`:
   - **Android emulator:** `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
   - **iOS simulator:** `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000`
   - **Physical device:** `EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3000` (e.g. `http://10.0.2.2:3000`). Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

3. **Restart Expo** after changing `.env` (e.g. `npx expo start --clear`).

4. **Quick connectivity check:** In the app, open a screen that loads from the API (e.g. Bottles & Stock after sign-in). If you see "Please sign in again" or "Unauthorized", the app is reaching the backend but the token is missing/invalid. If you see a network error or nothing loads, the backend is likely unreachable (wrong URL or backend not running).

5. **Optional:** Call `checkApiReachable()` from `@/lib/api` (e.g. in a useEffect) and log the result to confirm the backend is reachable.

## Communication checklist

| Step | Frontend | Backend |
|------|----------|---------|
| **URL** | `.env`: `EXPO_PUBLIC_API_URL=http://...:3000` (see `.env.example`) | Runs on `http://0.0.0.0:3000` (or `PORT`) |
| **Auth** | After sign-in (Supabase), app calls `POST /api/auth/supabase` with `access_token`; backend returns JWT. App stores it and sends `Authorization: Bearer <token>` on every API request. | `authMiddleware` reads `Authorization`, verifies JWT; `requirePermission` checks role for protected routes. |
| **CORS** | N/A (same-origin or app origin) | `cors({ origin: true, credentials: true })` so app can call from any origin. |
| **Health** | `GET /health` is unauthenticated; use for `checkApiReachable()`. | Responds `{ ok: true }`. |
| **Connection state** | Optional: `GET /connection` to see backend-side activity. | Responds `lastRequestAt`, `requestCount`, `startedAt` (no auth). |

If the app shows "Unauthorized" on API screens, the backend is reachable but the token is missing or invalid (sign in again). If requests never complete or fail with network errors, check `EXPO_PUBLIC_API_URL` and that the backend process is running.

## Communication verification (frontend ↔ backend)

### How it works

| Layer | Frontend | Backend |
|-------|----------|---------|
| **Base URL** | `getApiBaseUrl()` from `app.config.js` extra / `EXPO_PUBLIC_API_URL`; fallback `http://10.0.2.2:3000` | Listens on `http://0.0.0.0:3000` (all interfaces) |
| **Requests** | `api.get/post/patch/delete()` in `@/lib/api` → `fetch(base + path)`, `Content-Type: application/json` | `express.json()`, `cors({ origin: true, credentials: true })` |
| **Auth** | After Supabase sign-in: `POST /api/auth/supabase` with `access_token` → store `accessToken`; all other calls send `Authorization: Bearer <token>` | `/api/auth/*` no JWT; all other `/api/*` use `authMiddleware` then route-specific `requirePermission` |
| **Health** | `checkApiReachable()` → `GET /health` (no auth); logged on app start in `AppProviders` | `GET /health` → `{ ok: true }` |

### Route alignment (frontend path → backend)

| Frontend path | Backend mount + route | Method |
|---------------|------------------------|--------|
| `/api/auth/supabase` | `/api/auth` + `POST /supabase` | POST |
| `/api/live-feed` | `/api/live-feed` + `GET /`, `POST /` | GET, POST |
| `/api/live-feed/:id` | `/api/live-feed` + `PATCH /:id`, `DELETE /:id` | PATCH, DELETE |
| `/api/live-feed/clear` | `/api/live-feed` + `DELETE /clear` (before `/:id`) | DELETE |
| `/api/bottles`, `/api/bottles/:id` | `/api/bottles` + `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` | ✓ |
| `/api/vibe`, `/api/vibe/events`, … | `/api/vibe` + same structure | ✓ |
| `/api/tables`, `/api/tables/:id` | `/api/tables` + same | ✓ |
| `/api/profile` | `/api/profile` + `GET /`, `PATCH /` | ✓ |
| `/api/chats`, `/api/chats/:id/messages`, … | `/api/chats` + same | ✓ |
| `/api/contacts`, `/api/ops`, `/api/push`, `/api/guest`, `/api/bar-lto`, `/api/map` | Mounted under `/api/*` with matching routes | ✓ |

### Quick verification steps

1. **Backend running:** `cd backend && npm run dev` → log shows `VIPsync API listening on http://0.0.0.0:3000`.
2. **Frontend URL:** In Metro/Expo console on app start you should see `[API] App started — getApiBaseUrl(): http://...` and `[API] checkApiReachable(): YES — backend reachable` (or NO if backend is down / wrong URL).
3. **Auth:** Sign in with Supabase; app exchanges token via `POST /api/auth/supabase` and stores backend JWT. Subsequent calls (e.g. live-feed, bottles) include `Authorization: Bearer <token>`.
4. **Feature check:** Open a screen that uses the API (e.g. Ops → live feed, or Bottles). Data loads = communication is working. 401 = token missing/invalid; 403 = role insufficient; 4xx/5xx body = validation or server error.
