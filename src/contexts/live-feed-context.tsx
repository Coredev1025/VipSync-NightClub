import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

export interface LiveFeedItem {
  id: string
  type: "order" | "arrival" | "alert" | "geo"
  title: string
  description: string
  time: string
  table?: number
  avatar?: string
  createdAt?: number
}

export type LiveFeedItemInput = Omit<LiveFeedItem, "id">
export const LIVE_FEED_STORAGE_KEY = "vipsync_ops_live_feed_v1"

export type LiveFeedItemUpdate = Partial<LiveFeedItemInput>

interface LiveFeedContextValue {
  feedItems: LiveFeedItem[]
  setFeedItems: React.Dispatch<React.SetStateAction<LiveFeedItem[]>>
  addFeedItem: (item: LiveFeedItemInput) => void
  updateFeedItem: (id: string, patch: LiveFeedItemUpdate) => Promise<void>
  removeFeedItem: (id: string) => Promise<void>
  clearFeed: () => Promise<void>
  refetch: () => Promise<void>
  isApiConnected: boolean
}

const LiveFeedContext = React.createContext<LiveFeedContextValue | null>(null)

function normalizeFeedItem(r: Record<string, unknown>): LiveFeedItem {
  return {
    id: String(r.id),
    type: r.type as LiveFeedItem["type"],
    title: String(r.title),
    description: String(r.description),
    time: String(r.time),
    table: r.table as number | undefined,
    avatar: r.avatar as string | undefined,
    createdAt: typeof r.createdAt === "number" ? r.createdAt : undefined,
  }
}

export function LiveFeedProvider({ children }: { children: React.ReactNode }) {
  const [feedItems, setFeedItems] = React.useState<LiveFeedItem[]>([])
  const connected = isApiConnected()
  const { hasBackendToken } = useApiAuth()

  const refetch = React.useCallback(async () => {
    if (!connected) return
    if (!getAccessToken()) return
    try {
      const res = await api.get<{ feedItems: Array<Record<string, unknown>> }>("/api/live-feed")
      setFeedItems((res?.feedItems ?? []).map(normalizeFeedItem))
    } catch {
      // keep local state on error
    }
  }, [connected, setFeedItems])

  React.useEffect(() => {
    if (connected && hasBackendToken) refetch()
  }, [connected, hasBackendToken, refetch])

  const addFeedItem = React.useCallback(
    async (item: LiveFeedItemInput) => {
      const createdAt = Date.now()
      const optimisticItem: LiveFeedItem = {
        id: `local-${createdAt}-${Math.random().toString(36).slice(2, 9)}`,
        ...item,
        createdAt,
      }
      // Always add to local state so Ops page shows feed following table changes
      setFeedItems((prev) => [optimisticItem, ...prev])
      if (!connected || !getAccessToken()) {
        if (__DEV__) console.warn("[LiveFeed] addFeedItem: saved locally only (no API connection or token).")
        return
      }
      try {
        const created = await api.post<LiveFeedItem>("/api/live-feed", item)
        const newItem = normalizeFeedItem({ ...created, createdAt: created.createdAt ?? createdAt })
        setFeedItems((prev) => prev.map((x) => (x.id === optimisticItem.id ? newItem : x)))
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (__DEV__) console.warn("[LiveFeed] addFeedItem failed:", msg)
        // Item already in state (optimistic); keep it
      }
    },
    [connected, setFeedItems]
  )

  const updateFeedItem = React.useCallback(
    async (id: string, patch: LiveFeedItemUpdate) => {
      if (!connected) return
      setFeedItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
      try {
        const updated = await api.patch<LiveFeedItem>(`/api/live-feed/${id}`, patch)
        setFeedItems((prev) => prev.map((item) => (item.id === id ? normalizeFeedItem({ ...updated, createdAt: item.createdAt }) : item)))
      } catch {
        setFeedItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
      }
    },
    [connected, setFeedItems]
  )

  const removeFeedItem = React.useCallback(
    async (id: string) => {
      if (!connected) return
      setFeedItems((prev) => prev.filter((item) => item.id !== id))
      try {
        await api.delete(`/api/live-feed/${id}`)
      } catch {
        refetch()
      }
    },
    [connected, setFeedItems, refetch]
  )

  const clearFeed = React.useCallback(async () => {
    if (connected) {
      try {
        await api.delete("/api/live-feed/clear")
      } catch {
        // still clear locally
      }
    }
    setFeedItems([])
  }, [connected])

  const value = React.useMemo<LiveFeedContextValue>(
    () => ({ feedItems, setFeedItems, addFeedItem, updateFeedItem, removeFeedItem, clearFeed, refetch, isApiConnected: connected }),
    [feedItems, setFeedItems, addFeedItem, updateFeedItem, removeFeedItem, clearFeed, refetch, connected]
  )

  return <LiveFeedContext.Provider value={value}>{children}</LiveFeedContext.Provider>
}

export function useLiveFeed(): LiveFeedContextValue {
  const ctx = React.useContext(LiveFeedContext)
  if (!ctx) throw new Error("useLiveFeed must be used within LiveFeedProvider")
  return ctx
}

export function useLiveFeedOptional(): LiveFeedContextValue | null {
  return React.useContext(LiveFeedContext)
}
