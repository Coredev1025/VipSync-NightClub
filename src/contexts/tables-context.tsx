import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

export type TableStatus = "open" | "occupied" | "booked" | "pending"

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
}

export type TableUpdate = Partial<Omit<Table, "id">>
export type TableCreate = Omit<Table, "id">

const defaultTables: Table[] = [
  {
    id: "1",
    number: 5,
    x: 8,
    y: 5,
    status: "occupied",
    capacity: 12,
    currentGuests: 10,
    guestName: "Marcus Thompson",
    spend: 1200,
    pendingSpend: 600,
    itemsSummary: "1x Ace, 2x Goose",
    primaryStaff: "Mike Tyson",
    backupStaff: "Jessica Stone",
    assignedTo: "Sarah M.",
    promoter: "",
    server: "",
    guestAvatarKey: "man3",
    promoterAvatarKey: "man2",
    bottleGirlAvatarKey: "woman1",
    isVip: true,
  },
  {
    id: "2",
    number: 2,
    x: 55,
    y: 5,
    status: "occupied",
    capacity: 10,
    currentGuests: 8,
    guestName: "Elite Group",
    spend: 4200,
    pendingSpend: 400,
    primaryStaff: "Mike J.",
    backupStaff: "Lisa Wang",
    assignedTo: "Mike J.",
    promoter: "",
    server: "",
  },
  { id: "3", number: 3, x: 8, y: 63, status: "pending", capacity: 6, currentGuests: 0, guestName: "Reservation", eta: "15m" },
  { id: "4", number: 4, x: 75, y: 63, status: "open", capacity: 8, currentGuests: 0 },
  { id: "dj", number: 0, x: 85, y: 50, status: "occupied", capacity: 1, currentGuests: 1, guestName: "DJ Booth", isDjBooth: true, djSetTime: "10pm–2am" },
]

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
  const [tables, setTables] = React.useState<Table[]>(() => (connected ? [] : defaultTables))
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
      setTables(res?.tables ?? defaultTables)
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
