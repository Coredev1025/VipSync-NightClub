# Google Sign-In (OAuth 2.0) Setup

If you see **"Access blocked: Authorization Error"**, **Error 400: invalid_request**, or **404 "The requested URL was not found"** when tapping "Continue with Google", the app’s OAuth configuration doesn’t match Google’s rules. Fix it by creating the right client(s) and redirect URIs.

## Code exchange timed out / session not exchanged

If you see "Completing sign in..." then "Code exchange timed out", add your app's redirect URL to **Supabase** (not just Google Cloud):

1. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
2. Add the exact URL logged in Metro at sign-in (e.g. `vipsyncappmobile://auth/callback` or `exp://.../--/auth/callback` for Expo Go)
3. Use `vipsyncappmobile://**` as a wildcard if needed

## 404: "The requested URL was not found on this server"

Your **redirect URI** is not registered in Google Cloud. When you tap "Continue with Google", check the dev console for the logged redirect URI, then add that exact URI in [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → your **Web** OAuth client → **Authorized redirect URIs**.

## Why it happens (400 / Access blocked)

- On **Android** (standalone or dev build), the app uses a **custom scheme** redirect URI, e.g.  
  `com.vipsyncappmobile.app:/oauthredirect`
- A **Web application** OAuth client in Google Cloud only allows **HTTPS** redirect URIs, not custom schemes.
- So Google blocks the request with **400 invalid_request** when you use the Web client on Android.

## Solution: use an Android OAuth client on Android

### 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials**.
2. **Create an Android OAuth 2.0 Client** (in addition to or instead of only a Web client):
   - **Application type:** Android  
   - **Package name:** `com.vipsyncappmobile.app` (must match `android.package` in `app.json`)  
   - **SHA-1 certificate fingerprint:** add the fingerprint of the build you’re testing with.

### 2. Get your SHA-1

**Debug (local builds):**
```bash
cd android && ./gradlew signingReport
```
Use the **SHA1** under `Variant: debug` (or the variant you run).

**Windows (PowerShell):**
```powershell
cd android; .\gradlew.bat signingReport
```

**EAS / release:** Use the SHA-1 from your keystore or from EAS/Play Console. Add every SHA-1 you use (debug, release, upload key) to the Android OAuth client.

### 3. Configure the app

Set the **Android** client ID so the app uses it on Android:

- **.env** (or EAS env vars):
  ```env
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
  ```
- Optionally keep the Web client for Expo Go / web:
  ```env
  EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
  ```

Rebuild the app after changing env (e.g. `npx expo start --clear` or a new dev build).

## Summary

| Environment   | OAuth client type | Where to set it |
|---------------|-------------------|------------------|
| Android app   | Android           | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` |
| Expo Go / web | Web application   | `EXPO_PUBLIC_GOOGLE_CLIENT_ID` |

After adding the Android client with the correct package name and SHA-1 (and setting the Android client ID in the app when on Android), the "Authorization Error" / 400 should be resolved.

### If it still fails (400 / Access blocked)

1. **Restart Expo so env is picked up** — After changing `.env`, run `npx expo start --clear`, then reload the app.
2. **Confirm Android client has your SHA-1** — Run `cd android && .\gradlew.bat signingReport` (Windows) or `./gradlew signingReport` (Mac/Linux), copy the **SHA1** under your variant, and add it to the Android OAuth client in Google Cloud.
