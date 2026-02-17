import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import * as React from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from "@expo-google-fonts/inter"
import {
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Orbitron_900Black,
} from "@expo-google-fonts/orbitron"

import { ApiAuthContext } from "@/contexts/api-auth-context"
import { BottlesProvider } from "@/contexts/bottles-context"
import { ChatsProvider } from "@/contexts/chats-context"
import { LiveFeedProvider } from "@/contexts/live-feed-context"
import { TablesProvider } from "@/contexts/tables-context"
import { VibeProvider } from "@/contexts/vibe-context"
import { checkApiReachable, getApiBaseUrl, isApiConnected, setAccessToken } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { ToastProvider } from "@/providers/toast-provider"
import { ThemeProvider } from "@/theme/theme-provider"

export interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [hasBackendToken, setHasBackendToken] = React.useState(false)

  const [fontsLoaded, fontError] = useFonts({
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Orbitron_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  // One-time backend reachability check on app start — log result in Metro/Expo console
  React.useEffect(() => {
    const base = getApiBaseUrl()
    console.log("[API] App started — getApiBaseUrl():", base || "(none)")
    if (!base) return
    checkApiReachable().then((ok) => {
      console.log("[API] checkApiReachable():", ok ? "YES — backend reachable" : "NO — backend not reachable")
    }).catch((e) => {
      console.warn("[API] checkApiReachable() failed:", e instanceof Error ? e.message : e)
    })
  }, [])

  // Global backend token sync: whenever we have a Supabase session, exchange it for a backend JWT.
  // Runs on mount and on auth changes so the token is set even if AuthScreen is not mounted.
  React.useEffect(() => {
    async function syncToken(session: { access_token: string } | null) {
      if (!session) {
        setAccessToken(null)
        setHasBackendToken(false)
        return
      }
      if (!isApiConnected()) {
        if (__DEV__) console.warn("[Auth] Backend JWT skipped: no API URL. Set EXPO_PUBLIC_API_URL in .env.")
        setAccessToken(null)
        setHasBackendToken(false)
        return
      }
      const base = getApiBaseUrl()
      try {
        const { data: { session: fresh } } = await supabase.auth.refreshSession()
        const token = (fresh?.access_token ?? session.access_token).trim()
        if (!token) {
          setAccessToken(null)
          setHasBackendToken(false)
          return
        }
        if (__DEV__) console.log("[Auth] Exchanging Supabase token for backend JWT at", base, "…")
        const res = await fetch(`${base}/api/auth/supabase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token }),
        })
        let data: { accessToken?: string; error?: string; hint?: string } | null = null
        try {
          data = await res.json()
        } catch {
          data = null
        }
        if (res.ok && data?.accessToken) {
          setAccessToken(data.accessToken)
          setHasBackendToken(true)
          if (__DEV__) console.log("[Auth] Backend JWT received.")
        } else {
          setAccessToken(null)
          setHasBackendToken(false)
          if (__DEV__) {
            console.warn(
              "[Auth] Backend JWT exchange failed:",
              res.status,
              data?.error ?? "",
              data?.hint ?? "Set SUPABASE_JWT_SECRET in backend .env to match Supabase Dashboard → API → JWT Secret."
            )
          }
        }
      } catch (e) {
        setAccessToken(null)
        setHasBackendToken(false)
        if (__DEV__) {
          console.warn("[Auth] Backend JWT exchange failed:", e instanceof Error ? e.message : e)
          console.warn("[Auth] On a physical device set EXPO_PUBLIC_API_URL to your computer's IP, e.g. http://192.168.1.x:3000")
        }
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => syncToken(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => syncToken(session ?? null))
    return () => subscription.unsubscribe()
  }, [])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ApiAuthContext.Provider value={{ hasBackendToken }}>
            <BottlesProvider>
              <LiveFeedProvider>
              <TablesProvider>
                <ChatsProvider>
                  <VibeProvider>
                    <ToastProvider>{children}</ToastProvider>
                  </VibeProvider>
                </ChatsProvider>
              </TablesProvider>
              </LiveFeedProvider>
            </BottlesProvider>
          </ApiAuthContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

