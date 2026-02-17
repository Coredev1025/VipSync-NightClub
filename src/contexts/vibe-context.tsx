import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

export interface VibeState {
  djName: string
  djStatus: "ON DECKS" | "OFF DECKS" | "SCHEDULED" | "BREAK"
  genres: string
  djInitials: string
  scheduledTime?: string
}

export interface VibeEvent {
  id: string
  djName: string
  date: string
  time: string
  genres: string
  status: "upcoming" | "live"
}

const emptyVibe: VibeState = {
  djName: "",
  djStatus: "OFF DECKS",
  genres: "",
  djInitials: "",
}

interface VibeContextValue {
  vibe: VibeState
  setVibe: React.Dispatch<React.SetStateAction<VibeState>>
  vibeEvents: VibeEvent[]
  addVibeEvent: (event: Omit<VibeEvent, "id">) => Promise<VibeEvent>
  updateVibeEvent: (id: string, patch: Partial<Omit<VibeEvent, "id">>) => Promise<void>
  deleteVibeEvent: (id: string) => Promise<void>
  setVibeEvents: React.Dispatch<React.SetStateAction<VibeEvent[]>>
  refetch: () => Promise<void>
  isApiConnected: boolean
}

const VibeContext = React.createContext<VibeContextValue | null>(null)

export function VibeProvider({ children }: { children: React.ReactNode }) {
  const [vibe, setVibeLocal] = React.useState<VibeState>(emptyVibe)
  const [vibeEvents, setVibeEvents] = React.useState<VibeEvent[]>([])
  const connected = isApiConnected()
  const { hasBackendToken } = useApiAuth()

  const refetch = React.useCallback(async () => {
    if (!connected) return
    if (!getAccessToken()) return
    try {
      const [vibeRes, eventsRes] = await Promise.all([
        api.get<VibeState>("/api/vibe"),
        api.get<{ events: VibeEvent[] }>("/api/vibe/events"),
      ])
      if (vibeRes) setVibeLocal(vibeRes)
      if (eventsRes?.events != null) setVibeEvents(Array.isArray(eventsRes.events) ? eventsRes.events : [])
    } catch {
      // keep current state on error
    }
  }, [connected, setVibeLocal, setVibeEvents])

  React.useEffect(() => {
    if (connected && hasBackendToken) refetch()
  }, [connected, hasBackendToken, refetch])

  const setVibe = React.useCallback(
    (action: React.SetStateAction<VibeState>) => {
      setVibeLocal((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        if (connected) api.patch("/api/vibe", next).catch(() => {})
        return next
      })
    },
    [connected, setVibeLocal]
  )

  const addVibeEvent = React.useCallback(
    async (event: Omit<VibeEvent, "id">): Promise<VibeEvent> => {
      if (!connected) throw new Error("API not connected")
      const created = await api.post<VibeEvent>("/api/vibe/events", event)
      setVibeEvents((prev) => [created, ...prev])
      return created
    },
    [connected, setVibeEvents]
  )

  const updateVibeEvent = React.useCallback(
    async (id: string, patch: Partial<Omit<VibeEvent, "id">>) => {
      if (!connected) throw new Error("API not connected")
      const updated = await api.patch<VibeEvent>(`/api/vibe/events/${id}`, patch)
      setVibeEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
    },
    [connected, setVibeEvents]
  )

  const deleteVibeEvent = React.useCallback(
    async (id: string) => {
      if (!connected) throw new Error("API not connected")
      await api.delete(`/api/vibe/events/${id}`)
      setVibeEvents((prev) => prev.filter((e) => e.id !== id))
    },
    [connected, setVibeEvents]
  )

  const value = React.useMemo(
    () => ({
      vibe,
      setVibe,
      vibeEvents,
      addVibeEvent,
      updateVibeEvent,
      deleteVibeEvent,
      setVibeEvents,
      refetch,
      isApiConnected: connected,
    }),
    [vibe, setVibe, vibeEvents, addVibeEvent, updateVibeEvent, deleteVibeEvent, refetch, connected]
  )

  return <VibeContext.Provider value={value}>{children}</VibeContext.Provider>
}

export function useVibe(): VibeContextValue {
  const ctx = React.useContext(VibeContext)
  if (!ctx) throw new Error("useVibe must be used within VibeProvider")
  return ctx
}

export function useVibeOptional(): VibeContextValue | null {
  return React.useContext(VibeContext)
}
