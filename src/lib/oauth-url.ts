/**
 * Parse OAuth redirect URL for access_token and refresh_token.
 * Supabase (and many OAuth providers) send tokens in the URL fragment (#).
 * On some platforms (e.g. Android) the fragment may not be delivered; tokens
 * can also appear in the query string (?). We check both, with fragment taking precedence.
 */
export function getOAuthTokensFromUrl(url: string): {
  access_token: string | null
  refresh_token: string | null
} {
  const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : ""
  const queryRaw = url.includes("?") ? url.slice(url.indexOf("?") + 1) : ""
  const query = queryRaw.includes("#") ? queryRaw.slice(0, queryRaw.indexOf("#")) : queryRaw

  const fromHash = new URLSearchParams(hash)
  const fromQuery = new URLSearchParams(query)

  return {
    access_token: fromHash.get("access_token") || fromQuery.get("access_token"),
    refresh_token: fromHash.get("refresh_token") || fromQuery.get("refresh_token"),
  }
}

/**
 * Get the authorization code from the redirect URL (query string).
 * Supabase redirects with ?code=... when using the default auth flow.
 */
export function getAuthCodeFromUrl(url: string): string | null {
  try {
    const hashStart = url.indexOf("#")
    const queryStart = url.indexOf("?")
    const queryEnd = hashStart >= 0 ? hashStart : url.length
    const queryRaw = queryStart >= 0 ? url.slice(queryStart + 1, queryEnd) : ""
    return new URLSearchParams(queryRaw).get("code")
  } catch {
    return null
  }
}

/**
 * Get error params from OAuth redirect URL (Supabase redirects with error in fragment or query).
 */
export function getAuthErrorFromUrl(url: string): { error?: string; description?: string } | null {
  try {
    const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : ""
    const queryRaw = url.includes("?") ? url.slice(url.indexOf("?") + 1) : ""
    const query = queryRaw.includes("#") ? queryRaw.slice(0, queryRaw.indexOf("#")) : queryRaw
    const params = new URLSearchParams(hash || query)
    const error = params.get("error") || params.get("error_code")
    const description = params.get("error_description")
    if (error) return { error, description: description ?? undefined }
    return null
  } catch {
    return null
  }
}
