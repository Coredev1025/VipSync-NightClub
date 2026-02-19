const path = require("path");

// Load .env from project root so extra.* and app code get EXPO_PUBLIC_* vars
// Variables used: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_*
try {
  require("dotenv").config({ path: path.resolve(__dirname, ".env") });
} catch {
  // dotenv optional; Expo CLI may also inject EXPO_PUBLIC_* when running expo start
}

const appJson = require("./app.json");

let plugins = [...(Array.isArray(appJson.expo?.plugins) ? appJson.expo.plugins : [])].filter(Boolean);
// Replace simple "expo-notifications" with configured version for Android default channel
const hasNotifications = plugins.some((p) => (Array.isArray(p) ? p[0] === "expo-notifications" : p === "expo-notifications"));
if (hasNotifications) {
  plugins = plugins.filter((p) => (Array.isArray(p) ? p[0] : p) !== "expo-notifications");
}
plugins.push(["expo-notifications", { defaultChannel: "default" }]);

module.exports = {
  expo: {
    ...appJson.expo,
    plugins,
    extra: {
      ...appJson.expo.extra,
      /** Backend API URL. From .env: EXPO_PUBLIC_API_URL */
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000",
      /** Supabase project URL. From .env: EXPO_PUBLIC_SUPABASE_URL */
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      /** Supabase anon/public key. From .env: EXPO_PUBLIC_SUPABASE_ANON_KEY */
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
    },
  },
};
