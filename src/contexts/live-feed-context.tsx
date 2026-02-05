import * as React from "react"

import { useLocalStorageState } from "@/components/guest/guest-storage"

export interface LiveFeedItem {
  id: string
  type: "order" | "arrival" | "alert" | "geo"
  title: string
  description: string
  time: string
  table?: number
  avatar?: string
  /** Unix ms; used for sorting newest first. Set automatically for new items. */
  createdAt?: number
}

export type LiveFeedItemInput = Omit<LiveFeedItem, "id">

export const LIVE_FEED_STORAGE_KEY = "vipsync_ops_live_feed_v1"

const now = Date.now()
const defaultFeed: LiveFeedItem[] = [
  { id: "1", type: "order", title: "New Order", description: "2x Ace of Spades - Table 1", time: "Just now", table: 1, createdAt: now },
  { id: "2", type: "arrival", title: "VIP Arrived", description: "Marcus Chen checked in at entrance", time: "2 min ago", avatar: "/images/avatars/man2.png", createdAt: now - 2 * 60 * 1000 },
  { id: "3", type: "geo", title: "Geo-fence Alert", description: "Williams Party within 500m", time: "5 min ago", createdAt: now - 5 * 60 * 1000 },
  { id: "4", type: "order", title: "Order Completed", description: "3x Dom Perignon delivered - Table 6", time: "8 min ago", table: 6, createdAt: now - 8 * 60 * 1000 },
  { id: "5", type: "alert", title: "Capacity Warning", description: "Table 2 is over capacity", time: "10 min ago", table: 2, createdAt: now - 10 * 60 * 1000 },
  { id: "6", type: "arrival", title: "Guest Expected", description: "Johnson Party - ETA 15 minutes", time: "12 min ago", createdAt: now - 12 * 60 * 1000 },
]

interface LiveFeedContextValue {
  feedItems: LiveFeedItem[]
  setFeedItems: React.Dispatch<React.SetStateAction<LiveFeedItem[]>>
  addFeedItem: (item: LiveFeedItemInput) => void
}

const LiveFeedContext = React.createContext<LiveFeedContextValue | null>(null)

export function LiveFeedProvider({ children }: { children: React.ReactNode }) {
  const [feedItems, setFeedItems] = useLocalStorageState<LiveFeedItem[]>(LIVE_FEED_STORAGE_KEY, defaultFeed)

  const addFeedItem = React.useCallback(
    (item: LiveFeedItemInput) => {
      const createdAt = Date.now()
      const newItem: LiveFeedItem = {
        ...item,
        id: `feed-${createdAt}`,
        createdAt,
      }
      setFeedItems((prev) => [newItem, ...prev])
    },
    [setFeedItems]
  )

  const value = React.useMemo<LiveFeedContextValue>(
    () => ({ feedItems, setFeedItems, addFeedItem }),
    [feedItems, setFeedItems, addFeedItem]
  )

  return <LiveFeedContext.Provider value={value}>{children}</LiveFeedContext.Provider>
}

export function useLiveFeed(): LiveFeedContextValue {
  const ctx = React.useContext(LiveFeedContext)
  if (!ctx) {
    throw new Error("useLiveFeed must be used within LiveFeedProvider")
  }
  return ctx
}

export function useLiveFeedOptional(): LiveFeedContextValue | null {
  return React.useContext(LiveFeedContext)
}
