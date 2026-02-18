import * as React from "react"
import { api, isApiConnected, setAccessToken } from "@/lib/api"
import { supabase } from "@/lib/supabase"

export interface AuthUser {
  id: string
  email?: string
  name?: string
  picture?: string
  mode?: string
  proRole?: string
}

export interface SupabaseAuthState {
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

/**
 * Provides current Supabase session, sign-out, and backend token sync.
 * Does not provide sign-in (e.g. use magic link or other provider from elsewhere).
 */
export function useSupabaseAuth(): SupabaseAuthState {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [user, setUser] = React.useState<AuthUser | null>(null)

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session) syncBackendToken(session).catch(() => {})
      else setAccessToken(null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
    signOut,
    isLoading,
    error,
    user,
  }
}
