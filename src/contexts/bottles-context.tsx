import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

export interface Bottle {
  id: string
  name: string
  price: number
  stock: number
  createdAt: string
  imageKey?: string
  imageUri?: string
}

export type BottleCreate = Omit<Bottle, "id" | "createdAt">
export type BottleUpdate = Partial<Omit<Bottle, "id" | "createdAt">>

interface BottlesContextValue {
  bottles: Bottle[]
  isLoading: boolean
  error: string | null
  isApiConnected: boolean
  addBottle: (b: BottleCreate) => Promise<Bottle>
  updateBottle: (id: string, u: BottleUpdate) => Promise<void>
  deleteBottle: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const BottlesContext = React.createContext<BottlesContextValue | null>(null)

export function BottlesProvider({ children }: { children: React.ReactNode }) {
  const connected = isApiConnected()
  const { hasBackendToken } = useApiAuth()
  const [bottles, setBottles] = React.useState<Bottle[]>([])
  const [isLoading, setIsLoading] = React.useState(connected)
  const [error, setError] = React.useState<string | null>(null)

  const refetch = React.useCallback(async () => {
    if (!connected) return
    if (!getAccessToken()) {
      setError(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<{ bottles: Bottle[] }>("/api/bottles")
      setBottles(res?.bottles ?? [])
    } catch (err) {
      const message =
        err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401
          ? "Please sign in again to load bottles."
          : err instanceof Error
            ? err.message
            : "Failed to load bottles"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [connected])

  React.useEffect(() => {
    if (connected && hasBackendToken) refetch()
  }, [connected, hasBackendToken, refetch])

  const addBottle = React.useCallback(
    async (b: BottleCreate): Promise<Bottle> => {
      if (!connected) throw new Error("API not connected")
      const newBottle = await api.post<Bottle>("/api/bottles", b)
      setBottles((prev) => [newBottle, ...prev])
      return newBottle
    },
    [connected]
  )

  const updateBottle = React.useCallback(
    async (id: string, u: BottleUpdate) => {
      if (!connected) throw new Error("API not connected")
      const updated = await api.patch<Bottle>(`/api/bottles/${id}`, u)
      setBottles((prev) => prev.map((x) => (x.id === id ? updated : x)))
    },
    [connected]
  )

  const deleteBottle = React.useCallback(
    async (id: string) => {
      if (!connected) throw new Error("API not connected")
      await api.delete(`/api/bottles/${id}`)
      setBottles((prev) => prev.filter((b) => b.id !== id))
    },
    [connected]
  )

  const value = React.useMemo(
    () => ({
      bottles,
      isLoading,
      error,
      isApiConnected: connected,
      addBottle,
      updateBottle,
      deleteBottle,
      refetch,
    }),
    [bottles, isLoading, error, connected, addBottle, updateBottle, deleteBottle, refetch]
  )

  return <BottlesContext.Provider value={value}>{children}</BottlesContext.Provider>
}

export function useBottles(): BottlesContextValue {
  const ctx = React.useContext(BottlesContext)
  if (!ctx) throw new Error("useBottles must be used within BottlesProvider")
  return ctx
}
