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
 * Get the PKCE auth code from the redirect URL (query string).
 * Used when Supabase is configured with flowType: "pkce"; Android preserves query params in deep links.
 */
export function getAuthCodeFromUrl(url: string): string | null {
  const queryRaw = url.includes("?") ? url.slice(url.indexOf("?") + 1) : ""
  const query = queryRaw.includes("#") ? queryRaw.slice(0, queryRaw.indexOf("#")) : queryRaw
  return new URLSearchParams(query).get("code")
}
