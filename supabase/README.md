# VIPsync Supabase Setup

## Deploy schema

### Option A: Supabase CLI (recommended)

```bash
# Install Supabase CLI: npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF   # from Supabase dashboard URL
supabase db push
```

### Option B: Manual (SQL Editor)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor**
3. Paste and run `supabase/deploy.sql`

## Backend connection

The backend uses Supabase with the **service role** key (bypasses RLS).

1. Copy `backend/.env.example` to `backend/.env`
2. Add `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API → `service_role`)
3. `SUPABASE_URL` can be shared from root `.env` (EXPO_PUBLIC_SUPABASE_URL) or set in `backend/.env`

Start backend: `npm run backend:dev`

## Schema reference

See [SCHEMA.md](./SCHEMA.md) for full table definitions.
