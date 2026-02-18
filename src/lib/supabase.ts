// lib/supabase.ts
import { AppState, Platform } from "react-native"
import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient, processLock } from "@supabase/supabase-js"
import Constants from "expo-constants"

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""

// Longer lock timeout to avoid ProcessLockAcquireTimeoutError when multiple auth
// operations run at once on app load (getSession + onAuthStateChange in app-providers
// and use-supabase-auth). Default 10s can be too short with AsyncStorage on RN.
const AUTH_LOCK_TIMEOUT_MS = 25000
const lock = <R>(name: string, _acquireTimeout: number, fn: () => Promise<R>) =>
  processLock(name, AUTH_LOCK_TIMEOUT_MS, fn)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock,
  },
})

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)