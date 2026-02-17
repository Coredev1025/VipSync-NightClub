import { useRouter } from "expo-router"
import * as Linking from "expo-linking"
import * as React from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"

import { getApiBaseUrl, setAccessToken } from "@/lib/api"

import { getAuthCodeFromUrl, getOAuthTokensFromUrl } from "@/lib/oauth-url"
import { supabase } from "@/lib/supabase"

const CODE_EXCHANGE_TIMEOUT_MS = 45000
const URL_RETRY_DELAYS_MS = [0, 150, 400, 800]

/**
 * OAuth callback screen. Handles deep link from Supabase Google OAuth (PKCE).
 * Exchanges ?code= for session, syncs backend JWT, then navigates to app.
 */
export default function AuthCallbackScreen() {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const handled = React.useRef(false)

  const goHome = React.useCallback(() => {
    if (handled.current) return
    handled.current = true
    router.replace("/")
  }, [router])

  const goToAuth = React.useCallback(() => {
    if (handled.current) return
    handled.current = true
    setError(null)
    router.replace("/")
  }, [router])

  const setSessionAndGoHome = React.useCallback(
    async (session: { access_token: string }) => {
      const base = getApiBaseUrl()
      if (base) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const res = await fetch(`${base}/api/auth/supabase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: session.access_token }),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          const data = await res.json().catch(() => null)
          if (res.ok && data?.accessToken) {
            setAccessToken(data.accessToken)
          } else if (res.status === 401 || res.status === 503) {
            setError(
              data?.error ??
                (res.status === 503
                  ? "Backend is missing SUPABASE_JWT_SECRET. Set it in backend .env."
                  : "Backend sign-in failed. Check SUPABASE_JWT_SECRET in backend .env.")
            )
            return
          } else if (!res.ok) {
            const msg = (data?.error ?? data?.hint) || `Backend error ${res.status}`
            setError(msg)
            return
          }
        } catch (e) {
          const isAbort = e instanceof Error && e.name === "AbortError"
          setError(
            isAbort
              ? "Backend did not respond in time. Check EXPO_PUBLIC_API_URL and that the server is running."
              : "Could not reach backend. Check EXPO_PUBLIC_API_URL and that the server is running."
          )
          return
        }
      }
      goHome()
    },
    [goHome]
  )

  React.useEffect(() => {
    if (handled.current) return

    async function handleUrl(url: string | null) {
      if (!url || handled.current) return

      const code = getAuthCodeFromUrl(url)
      if (!code) {
        setError("Invalid sign-in link. Please try again from the app.")
        return
      }

      if (handled.current) return
      handled.current = true

      try {
        const { data: { session }, error: exchangeErr } = await Promise.race([
          (async () => {
            try {
              if (__DEV__) console.log("[AuthCallback] Exchanging code for session (code length:", code.length, ")")
              const res = await supabase.auth.exchangeCodeForSession(code)
              if (__DEV__) console.log("[AuthCallback] exchangeCodeForSession result:", res.error ? "error" : "ok")
              return res
            } catch (e) {
              if (__DEV__) console.warn("[AuthCallback] exchangeCodeForSession error:", e)
              const tokens = getOAuthTokensFromUrl(url)
              if (tokens?.access_token && tokens?.refresh_token) {
                const setRes = await supabase.auth.setSession({
                  access_token: tokens.access_token,
                  refresh_token: tokens.refresh_token,
                })
                if (setRes.error) throw setRes.error
                return setRes
              }
              throw e
            }
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Code exchange timed out. Try again or tap Continue to app.")),
              CODE_EXCHANGE_TIMEOUT_MS
            )
          ),
        ])
        if (exchangeErr) {
          setError(exchangeErr.message)
          handled.current = false
          return
        }
        if (!session) {
          setError("Could not complete sign-in. Try again or use Continue to app.")
          handled.current = false
          return
        }
        await setSessionAndGoHome(session)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed. Try again or tap Continue to app.")
        handled.current = false
      }
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
      if (handled.current) return
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !handled.current) {
          handled.current = true
          setSessionAndGoHome(session).catch(() => {
            handled.current = false
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
  }, [router, goHome, setSessionAndGoHome])

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
