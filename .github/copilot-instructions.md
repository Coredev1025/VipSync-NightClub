# Copilot / AI Agent Instructions — VIPsyncApp_mobile

Purpose: give an AI coding agent the minimal, actionable knowledge to be productive quickly.

1) Big-picture architecture
- Frontend: Expo / React Native app using Expo Router and TypeScript (sources under `src/`, routes in `app/`). See [app/_layout.tsx](app/_layout.tsx) and [src/providers/app-providers.tsx](src/providers/app-providers.tsx).
- Backend: Node.js Express API in `backend/` (ESM, plain JS). Entry: `backend/src/index.js`. See [backend/README.md](backend/README.md).
- Database / Auth: Supabase is the primary backend DB + auth provider. Frontend uses anon keys (`src/lib/supabase.ts`), backend uses the service role key (`backend/src/supabase.js`). See [supabase/README.md](supabase/README.md).

2) Key dataflows & integration points
- Auth: Supabase auth on the client => exchanged for backend JWT via POST `/api/auth/supabase`. Implemented in the client token-sync in [src/providers/app-providers.tsx](src/providers/app-providers.tsx).
- API calls: frontend talks to the Node API (backend) via `EXPO_PUBLIC_API_URL` (set in environment). Backend enforces permissions and may use Supabase service role for privileged operations.
- DB migrations: use `supabase db push` or run `supabase/deploy.sql`. See `supabase/README.md`.

3) Developer workflows & important commands
- Start the app (dev): `npm start` (root) which runs `expo start`.
- Android dev: `npm run android` or `npm run android:reverse` for Metro port forwarding; built APKs via `eas build` (`npm run build:android` or `build:android:local`). See `package.json` scripts.
- Backend dev: `npm run backend:dev` from root — this runs `cd backend && npm run dev` (uses `node --watch src/index.js`).
- DB push (local schema deploy): `npm run db:push` (invokes Supabase CLI).
- Postinstall: this project runs `patch-package` in `postinstall`; be careful when upgrading deps.

4) Environment and secrets (where to look)
- Frontend public keys (required): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL` (used by `src/lib/supabase.ts` and `src/lib/api.ts`). See [app.json](app.json) and `src/lib/supabase.ts`.
- Backend secrets (sensitive): `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` (set in `backend/.env`; see `backend/.env.example` and [supabase/README.md](supabase/README.md)).

5) Codebase conventions & patterns to follow
- Path alias: imports use `@/` mapped to `./src` (see `tsconfig.json`). Prefer `@/` for project-local imports.
- Providers & Contexts: global state (auth, bottles, chats, etc.) is implemented with React Context providers under `src/contexts` and composed in [src/providers/app-providers.tsx](src/providers/app-providers.tsx).
- UI routing: uses Expo Router (file-system routes in `app/`), typed routes are enabled in `app.json` (`experiments.typedRoutes`).
- Supabase client: client-side uses `@supabase/supabase-js` with AsyncStorage (see [src/lib/supabase.ts](src/lib/supabase.ts)). Backend uses `createClient` with the service role key (see [backend/src/supabase.js](backend/src/supabase.js)).

6) Security cautions for agents
- Never commit real secrets into the repo. If you need to run locally, instruct the user to set `.env` files from examples.
- The backend uses the Supabase **service role** key — treat it as highly sensitive.

7) Files and locations worth scanning for context
- Frontend entry / routes: `app/` and `src/` (UI + context providers).
- API backend: `backend/src/` (routes, middleware, services). See `backend/README.md`.
- DB schema & migrations: `supabase/` and `supabase/migrations/`.
- Build configs: `package.json`, `eas.json`, `app.json`, `metro.config.js`.

8) Typical small tasks and how to approach them
- Add a small UI tweak: update the relevant route under `app/` and adjust the matching provider state in `src/contexts/*` if global state is required.
- Debug auth issues: confirm `EXPO_PUBLIC_SUPABASE_*` on the client and `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` in `backend/.env`; replicate the client token exchange flow in [src/providers/app-providers.tsx](src/providers/app-providers.tsx).
- Add/modify an API endpoint: implement route in `backend/src/routes/`, and add corresponding client helper in `src/lib/api.ts`.

9) When you need human help / clarifications
- If any environment variables or local device networking are unclear (e.g., `EXPO_PUBLIC_API_URL` for physical device debugging), ask the author for the intended local dev workflow and any private keys.

If anything here looks wrong or you'd like more specifics (example: mapping of backend routes to frontend calls), tell me which area to expand.
