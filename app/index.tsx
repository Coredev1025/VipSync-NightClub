import { useFocusEffect } from "expo-router"
import * as React from "react"
import { View } from "react-native"

import { AppShell } from "@/components/app-shell"
import type { SignupMode, UserRole } from "@/components/auth/auth-screen"
import { AuthScreen } from "@/components/auth/auth-screen"
import { GuestShell } from "@/components/guest/guest-shell"
import { MobileFrame } from "@/components/mobile-frame"
import { SplashScreen } from "@/components/splash-screen"
import type { MapTabUserRole } from "@/components/tabs"
import { setAccessToken } from "@/lib/api"
import { getProfile, patchProfile } from "@/lib/profile-sync"
import { supabase } from "@/lib/supabase"

type AppState = "splash" | "auth" | "app"

const VALID_PRO_ROLES: MapTabUserRole[] = ["promoter", "door", "manager", "owner"]

export default function HomeScreen() {
  const [appState, setAppState] = React.useState<AppState>("splash")
  const [authMode, setAuthMode] = React.useState<SignupMode | null>(null)
  const [userRole, setUserRole] = React.useState<MapTabUserRole | undefined>(undefined)

  const refreshSessionAndState = React.useCallback(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      getProfile()
        .then((profile) => {
          if (profile?.mode === "pro" || profile?.mode === "user") {
            setAuthMode(profile.mode as SignupMode)
            setUserRole(profile.pro_role as MapTabUserRole | undefined)
            setAppState("app")
          } else {
            setAppState("auth")
          }
        })
        .catch(() => setAppState("auth"))
    })
  }, [])

  // On mount: if user has session (e.g. app restarted), go to app
  React.useEffect(() => {
    refreshSessionAndState()
  }, [refreshSessionAndState])

  // When returning from OAuth callback, index may already be mounted; re-check session on focus so we show app
  useFocusEffect(
    React.useCallback(() => {
      refreshSessionAndState()
    }, [refreshSessionAndState])
  )

  const handleSplashComplete = React.useCallback(() => {
    setAppState("auth")
  }, [])

  const handleAuthComplete = React.useCallback((mode: SignupMode, proRole?: UserRole) => {
    if (mode === "pro" && proRole) {
      setUserRole(proRole as MapTabUserRole)
    } else {
      setUserRole(undefined)
    }
    setAuthMode(mode)
    setAppState("app")
    // Persist selected mode and role to backend profile so it can be restored on next launch
    patchProfile({
      mode,
      pro_role: mode === "pro" ? proRole : undefined,
    }).catch(() => {})
  }, [])

  const handleLogout = React.useCallback(() => {
    setAccessToken(null)
    setAuthMode(null)
    setUserRole(undefined)
    setAppState("auth")
  }, [])

  return (
    <MobileFrame>
      {appState === "splash" ? (
        <View style={{ flex: 1 }}>
          <SplashScreen onComplete={handleSplashComplete} />
        </View>
      ) : null}
      {appState === "auth" ? (
        <View style={{ flex: 1 }}>
          <AuthScreen onComplete={handleAuthComplete} />
        </View>
      ) : null}
      {appState === "app" && authMode === "pro" ? (
        <View style={{ flex: 1 }}>
          <AppShell onLogout={handleLogout} userRole={userRole} />
        </View>
      ) : null}
      {appState === "app" && authMode === "user" ? (
        <View style={{ flex: 1 }}>
          <GuestShell onLogout={handleLogout} />
        </View>
      ) : null}
    </MobileFrame>
  )
}
