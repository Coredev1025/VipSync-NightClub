const path = require("path");

// Load .env from project root so extra.* and app code get EXPO_PUBLIC_* vars
// Variables used: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_*, optional EXPO_PUBLIC_GOOGLE_*
try {
  require("dotenv").config({ path: path.resolve(__dirname, ".env") });
} catch {
  // dotenv optional; Expo CLI may also inject EXPO_PUBLIC_* when running expo start
}

const appJson = require("./app.json");

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      /** Backend API URL. From .env: EXPO_PUBLIC_API_URL */
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000",
      /** Supabase project URL (used only if backend not connected). From .env: EXPO_PUBLIC_SUPABASE_URL */
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      /** Supabase anon/public key. From .env: EXPO_PUBLIC_SUPABASE_ANON_KEY */
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      /** Optional: Google OAuth Web client ID. From .env: EXPO_PUBLIC_GOOGLE_CLIENT_ID. For "Continue with Google", OAuth is via Supabase; add your app redirect URI in Google Cloud Console. */
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
      /** Optional: Google OAuth Android client ID for native builds. From .env: EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID */
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
    },
  },
};
