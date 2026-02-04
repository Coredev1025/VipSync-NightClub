import AsyncStorage from "@react-native-async-storage/async-storage"
import * as React from "react"
import { View } from "react-native"

import { AppShell } from "@/components/app-shell"
import type { SignupMode, UserRole } from "@/components/auth/auth-screen"
import { AuthScreen } from "@/components/auth/auth-screen"
import { GuestShell } from "@/components/guest/guest-shell"
import { MobileFrame } from "@/components/mobile-frame"
import { SplashScreen } from "@/components/splash-screen"
import type { MapTabUserRole } from "@/components/tabs"
type AppState = "splash" | "auth" | "app"

const AUTH_KEY = "vipsync_auth"
const AUTH_MODE_KEY = "vipsync_auth_mode"
const AUTH_PRO_ROLE_KEY = "vipsync_auth_pro_role"

const VALID_PRO_ROLES: MapTabUserRole[] = ["promoter", "door", "manager", "owner"]

export default function HomeScreen() {
  const [appState, setAppState] = React.useState<AppState>("splash")
  const [authMode, setAuthMode] = React.useState<SignupMode | null>(null)
  const [userRole, setUserRole] = React.useState<MapTabUserRole | undefined>(undefined)

  React.useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(AUTH_KEY),
      AsyncStorage.getItem(AUTH_MODE_KEY),
      AsyncStorage.getItem(AUTH_PRO_ROLE_KEY),
    ])
      .then(([isAuth, mode, proRole]) => {
        if (isAuth === "true") {
          setAppState("app")
          setAuthMode((mode === "user" || mode === "pro" ? mode : "pro") as SignupMode)
          if (mode === "pro" && proRole && VALID_PRO_ROLES.includes(proRole as MapTabUserRole)) {
            setUserRole(proRole as MapTabUserRole)
          } else {
            setUserRole(undefined)
          }
        }
      })
      .catch(() => {})
  }, [])

  const handleSplashComplete = React.useCallback(() => {
    Promise.all([
      AsyncStorage.getItem(AUTH_KEY),
      AsyncStorage.getItem(AUTH_MODE_KEY),
      AsyncStorage.getItem(AUTH_PRO_ROLE_KEY),
    ])
      .then(([isAuth, mode, proRole]) => {
        if (isAuth === "true") {
          setAppState("app")
          setAuthMode((mode === "user" || mode === "pro" ? mode : "pro") as SignupMode)
          if (mode === "pro" && proRole && VALID_PRO_ROLES.includes(proRole as MapTabUserRole)) {
            setUserRole(proRole as MapTabUserRole)
          } else {
            setUserRole(undefined)
          }
        } else {
          setAppState("auth")
        }
      })
      .catch(() => setAppState("auth"))
  }, [])

  const handleAuthComplete = React.useCallback((mode: SignupMode, proRole?: UserRole) => {
    AsyncStorage.setItem(AUTH_KEY, "true").catch(() => {})
    AsyncStorage.setItem(AUTH_MODE_KEY, mode).catch(() => {})
    if (mode === "pro" && proRole) {
      AsyncStorage.setItem(AUTH_PRO_ROLE_KEY, proRole).catch(() => {})
      setUserRole(proRole as MapTabUserRole)
    } else {
      AsyncStorage.removeItem(AUTH_PRO_ROLE_KEY).catch(() => {})
      setUserRole(undefined)
    }
    setAuthMode(mode)
    setAppState("app")
  }, [])

  const handleLogout = React.useCallback(() => {
    AsyncStorage.removeItem(AUTH_KEY).catch(() => {})
    AsyncStorage.removeItem(AUTH_MODE_KEY).catch(() => {})
    AsyncStorage.removeItem(AUTH_PRO_ROLE_KEY).catch(() => {})
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
      {/* User mode: guest experience — all pages from guest/tabs (GuestShell) */}
      {appState === "app" && authMode === "user" ? (
        <View style={{ flex: 1 }}>
          <GuestShell onLogout={handleLogout} />
        </View>
      ) : null}
    </MobileFrame>
  )
}
