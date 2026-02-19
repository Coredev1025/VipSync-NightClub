import * as React from "react"
import { setAccessToken } from "@/lib/api"
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
 * Provides current Supabase user only. Backend JWT sync is handled by AuthSyncListener
 * so we avoid duplicate syncs and refreshSession() loops that cause request storms.
 */
export function useSupabaseAuth(): SupabaseAuthState {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [user, setUser] = React.useState<AuthUser | null>(null)

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (!session) setAccessToken(null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) setAccessToken(null)
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
