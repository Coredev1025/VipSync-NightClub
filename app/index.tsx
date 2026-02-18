import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import * as React from "react"
import { View } from "react-native"

import { AppShell } from "@/components/app-shell"
import type { AuthCompleteData, SignupMode, UserRole } from "@/components/auth/auth-screen"
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
  const router = useRouter()
  const params = useLocalSearchParams<{ fromOAuth?: string }>()
  const [appState, setAppState] = React.useState<AppState>("splash")
  const [authMode, setAuthMode] = React.useState<SignupMode | null>(null)
  const [userRole, setUserRole] = React.useState<MapTabUserRole | undefined>(undefined)
  const [authInitialStep, setAuthInitialStep] = React.useState<"welcome" | "mode" | "role" | "profile">("welcome")

  const refreshSessionAndState = React.useCallback(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setAppState("auth")
        return
      }
      // After Google OAuth success we land with fromOAuth=1: show auth screen at mode step
      if (params.fromOAuth === "1") {
        setAppState("auth")
        setAuthInitialStep("mode")
        return
      }
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
  }, [params.fromOAuth])

  // On mount: if user has session (e.g. app restarted), go to app
  React.useEffect(() => {
    refreshSessionAndState()
  }, [refreshSessionAndState])

  // When returning from auth callback, index may already be mounted; re-check session on focus so we show app
  useFocusEffect(
    React.useCallback(() => {
      // Avoid flickering back to auth once the user is already in the app.
      if (appState !== "app") {
        refreshSessionAndState()
      }
    }, [refreshSessionAndState, appState])
  )

  const handleSplashComplete = React.useCallback(() => {
    setAppState("auth")
  }, [])

  const handleAuthComplete = React.useCallback(
    (mode: SignupMode, proRole?: UserRole, profileData?: AuthCompleteData) => {
      if (mode === "pro" && proRole) {
        setUserRole(proRole as MapTabUserRole)
      } else {
        setUserRole(undefined)
      }
      setAuthMode(mode)
      setAppState("app")
      router.replace("/") // clear ?fromOAuth=1 so we don't return to mode page on next focus
      // Persist mode, role, name, picture, and referral to Supabase via backend
      const updates: Parameters<typeof patchProfile>[0] = {
        mode,
        pro_role: mode === "pro" ? proRole : undefined,
      }
      if (profileData?.name) updates.name = profileData.name
      if (profileData?.picture != null) updates.picture = profileData.picture || undefined
      if (profileData?.referralCode) {
        updates.settings_account = { referral_code: profileData.referralCode }
      }
      patchProfile(updates).catch(() => {})
    },
    [router]
  )

  const handleLogout = React.useCallback(() => {
    setAccessToken(null)
    setAuthMode(null)
    setUserRole(undefined)
    setAppState("auth")
    supabase.auth.signOut().catch(() => {})
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
          <AuthScreen onComplete={handleAuthComplete} initialStep={authInitialStep} />
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
