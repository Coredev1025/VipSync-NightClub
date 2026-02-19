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
import { MenuProvider } from "@/contexts/menu-context"
import { TablesProvider } from "@/contexts/tables-context"
import { VibeProvider } from "@/contexts/vibe-context"
import { checkApiReachable, getApiBaseUrl, isApiConnected, setAccessToken } from "@/lib/api"
import { syncBackendSession } from "@/lib/google-oauth"
import { supabase } from "@/lib/supabase"
import { ToastProvider, useToast } from "@/providers/toast-provider"
import { ThemeProvider } from "@/theme/theme-provider"

export interface AppProvidersProps {
  children: React.ReactNode
}

const TOKEN_REFRESH_SYNC_THROTTLE_MS = 5 * 60 * 1000 // Sync at most once per 5 min on TOKEN_REFRESHED

function AuthSyncListener({
  setHasBackendToken,
}: {
  setHasBackendToken: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { toast } = useToast()
  const lastTokenRefreshSyncRef = React.useRef<number>(0)

  // Listen for auth state changes and sync with backend. Only sync on SIGNED_IN or throttled TOKEN_REFRESHED to avoid request storms.
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (__DEV__) console.log("[Auth] Auth event:", event)

        if (event === "SIGNED_OUT" || !session) {
          setAccessToken(null)
          setHasBackendToken(false)
          return
        }

        if (event === "TOKEN_REFRESHED") {
          const now = Date.now()
          if (now - lastTokenRefreshSyncRef.current < TOKEN_REFRESH_SYNC_THROTTLE_MS) return
          lastTokenRefreshSyncRef.current = now
        }

        // SIGNED_IN or (throttled) TOKEN_REFRESHED: sync with backend when we have a session
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
          if (!isApiConnected()) {
            if (__DEV__) console.warn("[Auth] Backend JWT skipped: no API URL. Set EXPO_PUBLIC_API_URL in .env.")
            setAccessToken(null)
            setHasBackendToken(false)
            if (event === "SIGNED_IN") {
              toast({
                title: "Backend not connected",
                description: "Set EXPO_PUBLIC_API_URL and restart the app.",
                variant: "destructive",
              })
            }
            return
          }

          const error = await syncBackendSession(session)
          if (error) {
            console.error("[Auth] Backend sync failed:", error)
            setAccessToken(null)
            setHasBackendToken(false)
            if (event === "SIGNED_IN") {
              toast({
                title: "Sign-in failed",
                description: error,
                variant: "destructive",
              })
            }
          } else {
            setHasBackendToken(true)
            if (event === "SIGNED_IN") {
              toast({
                title: "Signed in",
                description: "Sign-in successful. Choose your mode to continue.",
                durationMs: 2600,
              })
            }
          }
        }
      }
    )

    // Initial load: sync if user already has a session (e.g. app reopened).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (!isApiConnected()) {
          setAccessToken(null)
          setHasBackendToken(false)
          return
        }
        lastTokenRefreshSyncRef.current = Date.now()
        syncBackendSession(session).then((error) => {
          if (error) {
            setAccessToken(null)
            setHasBackendToken(false)
          } else {
            setHasBackendToken(true)
          }
        })
      } else {
        setAccessToken(null)
        setHasBackendToken(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setHasBackendToken, toast])

  return null
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

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ApiAuthContext.Provider value={{ hasBackendToken }}>
            <BottlesProvider>
              <MenuProvider>
              <TablesProvider>
                <ChatsProvider>
                  <VibeProvider>
                    <LiveFeedProvider>
                      <ToastProvider>
                        <AuthSyncListener setHasBackendToken={setHasBackendToken} />
                        {children}
                      </ToastProvider>
                    </LiveFeedProvider>
                  </VibeProvider>
                </ChatsProvider>
              </TablesProvider>
              </MenuProvider>
            </BottlesProvider>
          </ApiAuthContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

