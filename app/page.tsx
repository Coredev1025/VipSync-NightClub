"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { SplashScreen } from "@/components/splash-screen"
import { AuthScreen } from "@/components/auth/auth-screen"
import { AppShell } from "@/components/app-shell"
import { MobileFrame } from "@/components/mobile-frame"

type AppState = "splash" | "auth" | "app"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("splash")

  // For demo purposes, check if user is "authenticated" via sessionStorage
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("vipsync_auth")
    if (isAuthenticated === "true") {
      setAppState("app")
    }
  }, [])

  const handleSplashComplete = () => {
    const isAuthenticated = sessionStorage.getItem("vipsync_auth")
    if (isAuthenticated === "true") {
      setAppState("app")
    } else {
      setAppState("auth")
    }
  }

  const handleAuthComplete = () => {
    sessionStorage.setItem("vipsync_auth", "true")
    setAppState("app")
  }

  const handleLogout = () => {
    sessionStorage.removeItem("vipsync_auth")
    setAppState("auth")
  }

  return (
    <MobileFrame>
      <main className="absolute inset-0 w-full h-full overflow-hidden rounded-[3rem]">
        <AnimatePresence mode="wait">
          {appState === "splash" && (
            <SplashScreen key="splash" onComplete={handleSplashComplete} />
          )}
          {appState === "auth" && (
            <AuthScreen key="auth" onComplete={handleAuthComplete} />
          )}
          {appState === "app" && (
            <AppShell key="app" onLogout={handleLogout} />
          )}
        </AnimatePresence>
      </main>
    </MobileFrame>
  )
}
