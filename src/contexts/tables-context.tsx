import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

export type TableStatus = "open" | "occupied" | "booked" | "pending"

/** User-mode bidding state when this map table is linked to a VIP bidding table. */
export interface TableVipBidding {
  vipName: string
  currentBid: number
  leader: string
  nextBidAmount: number
}

/** User-mode booking info when this map table is linked to a VIP booking table. */
export interface TableVipBooking {
  vipName: string
  minSpend: number
}

export interface Table {
  id: string
  number: number
  x: number
  y: number
  status: TableStatus
  capacity: number
  currentGuests: number
  guestName?: string
  spend?: number
  pendingSpend?: number
  itemsSummary?: string
  primaryStaff?: string
  backupStaff?: string
  assignedTo?: string
  promoter?: string
  server?: string
  eta?: string
  guestAvatarKey?: string
  promoterAvatarKey?: string
  bottleGirlAvatarKey?: string
  isVip?: boolean
  isDjBooth?: boolean
  djSetTime?: string
  /** Set when this table is linked to a VIP bidding table (user mode). */
  vipBidding?: TableVipBidding
  /** Set when this table is linked to a VIP booking table (user mode). */
  vipBooking?: TableVipBooking
  /** Manager: VIP table record id for edit/delete. */
  vipTableId?: string
  /** Manager: "bidding" | "booking". */
  vipType?: "bidding" | "booking"
}

export type TableUpdate = Partial<Omit<Table, "id">>
export type TableCreate = Omit<Table, "id">

interface TablesContextValue {
  tables: Table[]
  setTables: React.Dispatch<React.SetStateAction<Table[]>>
  updateTable: (id: string, patch: TableUpdate) => Promise<void>
  addTable: (table: TableCreate) => Promise<Table>
  deleteTable: (id: string) => Promise<void>
  refetch: () => Promise<void>
  isApiConnected: boolean
  isLoading: boolean
}

const TablesContext = React.createContext<TablesContextValue | null>(null)

export function TablesProvider({ children }: { children: React.ReactNode }) {
  const connected = isApiConnected()
  const { hasBackendToken } = useApiAuth()
  const [tables, setTables] = React.useState<Table[]>(() => [])
  const [isLoading, setIsLoading] = React.useState(connected)

  const refetch = React.useCallback(async () => {
    if (!connected) return
    if (!getAccessToken()) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await api.get<{ tables: Table[] }>("/api/tables")
      setTables(res?.tables ?? [])
    } catch {
      // keep current on error
    } finally {
      setIsLoading(false)
    }
  }, [connected])

  React.useEffect(() => {
    if (connected && hasBackendToken) refetch()
  }, [connected, hasBackendToken, refetch])

  const updateTable = React.useCallback(
    async (id: string, patch: TableUpdate) => {
      setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      if (connected) {
        try {
          const updated = await api.patch<Table>(`/api/tables/${id}`, patch)
          setTables((prev) => prev.map((t) => (t.id === id ? updated : t)))
        } catch {
          setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
        }
      }
    },
    [connected]
  )

  const addTable = React.useCallback(
    async (table: TableCreate): Promise<Table> => {
      if (connected) {
        const created = await api.post<Table>("/api/tables", table)
        setTables((prev) => [...prev, created])
        return created
      }
      const newTable: Table = { ...table, id: `local-${Date.now()}` }
      setTables((prev) => [...prev, newTable])
      return newTable
    },
    [connected]
  )

  const deleteTable = React.useCallback(
    async (id: string) => {
      setTables((prev) => prev.filter((t) => t.id !== id))
      if (connected) {
        try {
          await api.delete(`/api/tables/${id}`)
        } catch {
          refetch()
        }
      }
    },
    [connected, refetch]
  )

  const value = React.useMemo(
    () => ({
      tables,
      setTables,
      updateTable,
      addTable,
      deleteTable,
      refetch,
      isApiConnected: connected,
      isLoading,
    }),
    [tables, updateTable, addTable, deleteTable, refetch, connected, isLoading]
  )

  return <TablesContext.Provider value={value}>{children}</TablesContext.Provider>
}

export function useTables(): TablesContextValue {
  const ctx = React.useContext(TablesContext)
  if (!ctx) throw new Error("useTables must be used within TablesProvider")
  return ctx
}

export function useTablesOptional(): TablesContextValue | null {
  return React.useContext(TablesContext)
}
