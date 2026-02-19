import Constants from "expo-constants"

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromExtra && typeof fromExtra === "string") return fromExtra.replace(/\/$/, "")
  if (fromEnv && typeof fromEnv === "string") return fromEnv.replace(/\/$/, "")
  // Fallback: Android emulator only. For iOS simulator use 127.0.0.1; for physical device use your PC's LAN IP.
  return "http://10.0.2.2:3000"
}

/** True if an API base URL is configured (does not verify the server is reachable). */
export function isApiConnected(): boolean {
  const url = getApiBaseUrl()
  return url.length > 0
}

/** Ping backend /health to verify it's reachable. Use when debugging "frontend not connected" issues. */
export async function checkApiReachable(): Promise<boolean> {
  const base = getApiBaseUrl()
  if (!base) return false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${base}/health`, { method: "GET", signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch (e) {
    // Log why backend is not reachable (timeout, network error, wrong host, etc.)
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[API] Backend not reachable at", base, "—", msg)
    }
    return false
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  /** Query params for GET requests (e.g. { limit: 50, offset: 0 }) */
  params?: Record<string, string | number | undefined>
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const base = getApiBaseUrl()
  const pathPart = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`
  if (!params || Object.keys(params).length === 0) return pathPart
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v))
  }
  const q = search.toString()
  return q ? `${pathPart}${pathPart.includes("?") ? "&" : "?"}${q}` : pathPart
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const base = getApiBaseUrl()
  if (!base && !path.startsWith("http")) {
    throw new Error("[API] No backend URL configured. Set EXPO_PUBLIC_API_URL in .env (see CONNECTION.md).")
  }
  const url = buildUrl(path, options.params)
  const { method = "GET", body } = options
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    try {
      console.log("[API] Request:", method, url, accessToken ? "(with token)" : "(no token)")
    } catch {}
  }
  const res = await fetch(url, {
    method,
    headers,
    ...(body != null && method !== "GET" ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(text || `HTTP ${res.status}`) as Error & { status?: number; body?: string }
    err.status = res.status
    err.body = text
    throw err
  }
  if (res.status === 204) return undefined as T
  const contentType = res.headers.get("content-type")
  if (contentType?.includes("application/json")) return res.json() as Promise<T>
  return undefined as T
}

export const api = {
  get: <T>(path: string, options?: { params?: Record<string, string | number | undefined> }) =>
    request<T>(path, { method: "GET", params: options?.params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
}
