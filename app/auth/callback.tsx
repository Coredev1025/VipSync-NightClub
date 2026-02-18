import { useRouter } from "expo-router"
import * as Linking from "expo-linking"
import * as React from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"

import { completeOAuthFromUrl, syncBackendSession } from "@/lib/google-oauth"
import { supabase } from "@/lib/supabase"

const URL_RETRY_DELAYS_MS = [0, 150, 400, 800]

/**
 * OAuth callback screen. Handles deep link from Supabase OAuth.
 * Reads tokens or code from URL, sets session, syncs backend JWT, then navigates to mode page.
 */
export default function AuthCallbackScreen() {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const hasNavigated = React.useRef(false)
  const processing = React.useRef(false)

  /** Navigate home; use fromOAuth=1 so index shows the mode selection step for new Google sign-ins. */
  const goHome = React.useCallback(() => {
    if (hasNavigated.current) return
    hasNavigated.current = true
    router.replace("/?fromOAuth=1")
  }, [router])

  const goToAuth = React.useCallback(() => {
    if (hasNavigated.current) return
    hasNavigated.current = true
    setError(null)
    router.replace("/")
  }, [router])

  React.useEffect(() => {
    if (processing.current) return

    async function handleUrl(url: string | null) {
      if (!url || processing.current) return
      processing.current = true

      const result = await completeOAuthFromUrl(url)
      if (result.success) {
        console.log("[Auth] Google sign-in complete (callback). Navigating to mode page.")
        goHome()
        return
      }
      setError(result.error ?? "Sign-in failed. Please try again.")
      processing.current = false
    }

    // Android: getInitialURL can return null initially; retry with small delays
    const tryGetUrl = async () => {
      for (const delay of URL_RETRY_DELAYS_MS) {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay))
        const url = await Linking.getInitialURL()
        if (url) {
          handleUrl(url)
          return
        }
      }
    }
    tryGetUrl()

    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url))

    function checkSessionAndGo() {
      if (hasNavigated.current) return
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !hasNavigated.current) {
          syncBackendSession(session).then((err) => {
            if (err) {
              setError(err)
            } else {
              console.log("[Auth] Google sign-in complete (session check). Navigating to mode page.")
              goHome()
            }
          })
        }
      })
    }
    checkSessionAndGo()
    const sessionCheckDelay = setTimeout(checkSessionAndGo, 2000)
    const fallbackGoHome = setTimeout(goHome, 10000)

    return () => {
      sub.remove()
      clearTimeout(sessionCheckDelay)
      clearTimeout(fallbackGoHome)
    }
  }, [goHome])

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={goToAuth} style={styles.link}>
          <Text style={styles.linkText}>Try again</Text>
        </Pressable>
        <Pressable onPress={goHome} style={[styles.link, { marginTop: 8 }]}>
          <Text style={[styles.linkText, styles.linkSecondary]}>Continue to app</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Completing sign in…</Text>
      <Text style={styles.hint}>If this takes more than a few seconds, tap below.</Text>
      <Pressable onPress={goHome} style={styles.link}>
        <Text style={styles.linkText}>Continue to app</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  error: {
    color: "#c00",
    textAlign: "center",
    marginBottom: 16,
  },
  link: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 16,
    color: "#0066cc",
  },
  linkSecondary: {
    color: "#666",
    fontSize: 14,
  },
})
