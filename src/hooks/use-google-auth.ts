import * as WebBrowser from "expo-web-browser"
import * as React from "react"
import Constants, { ExecutionEnvironment } from "expo-constants"
import { makeRedirectUri } from "expo-auth-session"
import { api, isApiConnected, setAccessToken } from "@/lib/api"
import { getAuthCodeFromUrl, getOAuthTokensFromUrl } from "@/lib/oauth-url"
import { supabase } from "@/lib/supabase"

WebBrowser.maybeCompleteAuthSession()

export interface AuthUser {
  id: string
  email?: string
  name?: string
  picture?: string
  mode?: string
  proRole?: string
}

export interface GoogleAuthState {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
  error: string | null
  user: AuthUser | null
}

/**
 * Sync backend JWT with current Supabase session.
 * Call after sign-in or when session is restored so API requests are authenticated.
 */
async function syncBackendToken(session: { access_token: string } | null): Promise<void> {
  if (!session) {
    setAccessToken(null)
    return
  }
  if (!isApiConnected()) return
  const { data: { session: fresh } } = await supabase.auth.refreshSession()
  const token = (fresh?.access_token ?? session.access_token).trim()
  if (!token) {
    setAccessToken(null)
    return
  }
  const res = await api.post<{ accessToken: string; error?: string; hint?: string }>("/api/auth/supabase", {
    access_token: token,
  })
  if (res?.accessToken) {
    setAccessToken(res.accessToken)
  } else {
    setAccessToken(null)
    throw new Error(res?.error ?? res?.hint ?? "Backend did not return an access token.")
  }
}

export function useGoogleAuth(onSuccess: () => void): GoogleAuthState {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const onSuccessRef = React.useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  const scheme = (Array.isArray(Constants.expoConfig?.scheme)
    ? Constants.expoConfig.scheme[0]
    : Constants.expoConfig?.scheme) ?? "vipsync"

  const redirectUrl = React.useMemo(
    () =>
      makeRedirectUri({
        path: "auth/callback",
        scheme: isExpoGo ? "exp" : scheme,
        preferLocalhost: isExpoGo,
      }),
    [isExpoGo, scheme]
  )

  // Restore session on mount and subscribe to auth changes
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        syncBackendToken(session).catch(() => {})
      } else {
        setAccessToken(null)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session) syncBackendToken(session).catch(() => {})
      else setAccessToken(null)
      if (event === "SIGNED_IN" && session) onSuccessRef.current()
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = React.useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      })

      if (oauthError) throw oauthError
      if (!data?.url) throw new Error("No authentication URL received from Supabase")

      if (__DEV__) console.log("[GoogleAuth] Redirect URL (add to Supabase Dashboard → Auth → URL Config):", redirectUrl)
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, {
        showTitle: false,
        enableBarCollapsing: true,
        preferEphemeralSession: false,
        createTask: false,
      })

      if (result.type !== "success") {
        if (result.type === "cancel" || result.type === "dismiss") setError(null)
        else setError("Sign-in was cancelled or failed. Please try again.")
        return
      }

      const url = result.url ?? ""
      const code = getAuthCodeFromUrl(url)
      if (!code) {
        setError("Sign-in could not be completed. The redirect did not contain an auth code. Please try again.")
        return
      }

      console.log("[GoogleAuth] Exchanging code for session (code length:", code?.length ?? 0, ")")
      let session: any = null
      try {
        const exchangeResult = await supabase.auth.exchangeCodeForSession(code)
        session = exchangeResult.data?.session ?? null
        if (exchangeResult.error) throw exchangeResult.error
      } catch (ex) {
        console.warn("[GoogleAuth] exchangeCodeForSession failed:", ex)
        // Fallback: try to parse access_token directly from returned redirect URL (fragment)
        // This can help if the PKCE code exchange cannot complete but tokens are present.
        const tokens = getOAuthTokensFromUrl(url ?? "")
        if (tokens?.access_token) {
          try {
            const setRes = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
            })
            session = setRes.data?.session ?? null
            if (setRes.error) throw setRes.error
          } catch (setErr) {
            console.warn("[GoogleAuth] setSession fallback failed:", setErr)
            throw ex
          }
        } else {
          throw ex
        }
      }
      if (!session) {
        setError("Could not establish session. Please try again.")
        return
      }

      setUser(session.user)
      try {
        await syncBackendToken(session)
      } catch (e) {
        const err = e as Error & { body?: string }
        const hint =
          typeof err.body === "string"
            ? (() => {
                try {
                  const j = JSON.parse(err.body)
                  return j.hint ?? j.error
                } catch {
                  return null
                }
              })()
            : null
        setError(
          hint ??
            (err instanceof Error ? err.message : "Backend sign-in failed. Check SUPABASE_JWT_SECRET in backend .env.")
        )
        return
      }
      onSuccessRef.current()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please try again."
      setError(msg)
      if (__DEV__) console.warn("[Google Auth]", err)
    } finally {
      setIsLoading(false)
    }
  }, [redirectUrl])

  const signOut = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      setUser(null)
      setAccessToken(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    signInWithGoogle,
    signOut,
    isLoading,
    error,
    user,
  }
}
