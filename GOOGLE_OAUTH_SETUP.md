# Google OAuth Setup (Supabase + Mobile)

This project uses **Supabase Auth** for Google sign-in (implicit flow). The flow is:

1. **Frontend** starts OAuth with `signInWithOAuth({ provider: 'google' })`.
2. User signs in with Google; Supabase redirects back to the app with `access_token` and `refresh_token` in the URL fragment.
3. **Frontend** sets the Supabase session from the URL tokens, then calls **backend** `POST /api/auth/supabase` with the Supabase access token.
4. **Backend** verifies the Supabase JWT, upserts the profile, and returns a backend JWT.

No Google client secret is used on the backend; Supabase handles the Google OAuth and issues JWTs.

---

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create an **OAuth 2.0 Client ID** (or use an existing one):
   - **Application type**: **Web application** (for Supabase).
   - **Authorized redirect URIs**: add your Supabase callback URL:
     - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**.
3. For **Android** (optional, for native Google Sign-In or consistency):
   - Create another OAuth 2.0 Client ID, type **Android**.
   - Use your app package name (e.g. `com.vipsyncappmobile.app`) and SHA-1.
   - You can put the Android client ID in backend `.env` as `GOOGLE_ANDROID_CLIENT_ID` for reference; Supabase uses the Web client for the redirect flow.

---

## 2. Supabase Dashboard

1. **Authentication** → **Providers** → **Google**:
   - Enable Google.
   - Paste **Client ID** and **Client Secret** from the Web application OAuth client.
   - Save.

2. **Authentication** → **URL Configuration** → **Redirect URLs**:
   - Add the app’s redirect URL so Supabase can redirect back after sign-in:
     - **Production / standalone app**: `vipsyncappmobile://auth/callback`
     - **Expo Go (dev)**: add the URL shown in the app (e.g. `exp://192.168.x.x:8081/--/auth/callback`) or use the wildcard `exp://*` if supported.
   - Supabase may allow one wildcard; check the dashboard.

---

## 3. Frontend (.env)

In the project root `.env` (Expo):

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

No Google keys are required in the frontend; Supabase uses its own Google provider config.

---

## 4. Backend (.env)

In `backend/.env`:

```env
SUPABASE_JWT_SECRET=<from Supabase Dashboard → Project Settings → API → JWT Secret>
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional (for `GET /api/auth/config` and reference):

```env
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
```

---

## 5. Verify

- **Frontend**: Tap “Continue with Google” on the welcome screen. An in-app browser should open; after signing in with Google you are redirected back and signed in.
- **Backend**: `GET /api/auth/config` returns `providers.google: true` when `GOOGLE_CLIENT_ID` is set, and `redirectUrlHint: "vipsyncappmobile://auth/callback"`.
- **Deep link**: If you open the app via `vipsyncappmobile://auth/callback#access_token=...&refresh_token=...` (e.g. from a different browser), the auth callback screen should set the session and complete sign-in.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| “Google sign-in is not available” | Supabase → Auth → Providers → Google enabled; Client ID/Secret correct. |
| “Invalid sign-in link” / redirect not working | Supabase → Auth → URL Configuration → add `vipsyncappmobile://auth/callback` (and Expo Go URL if needed). |
| “Invalid sign-in link” / tokens missing | Ensure Supabase redirect URL is allowed; try again from the app. |
| Backend 401/503 on token exchange | Backend `.env` `SUPABASE_JWT_SECRET` must match Supabase Dashboard → Project Settings → API → JWT Secret. |
