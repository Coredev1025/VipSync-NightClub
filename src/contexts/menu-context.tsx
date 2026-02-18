import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

export interface TableServiceItem {
  id: string
  title: string
  price: string
  capacity?: string
  desc?: string
  limitedOffer?: boolean
  limitedDateStart?: string
  limitedDate?: string
  iconKey?: string
  discountOffer?: boolean
  discountPrice?: string
  discountTimeLimitStart?: string
  discountTimeLimit?: string
}

export interface BarDrinkItem {
  id: string
  title: string
  desc?: string
  price: string
  iconKey?: string
  iconColor?: string
  limitedOffer?: boolean
  limitedDateStart?: string
  limitedDate?: string
  discountOffer?: boolean
  discountPrice?: string
  discountTimeLimitStart?: string
  discountTimeLimit?: string
}

interface MenuContextValue {
  tableItems: TableServiceItem[]
  barItems: BarDrinkItem[]
  setTableItems: React.Dispatch<React.SetStateAction<TableServiceItem[]>>
  setBarItems: React.Dispatch<React.SetStateAction<BarDrinkItem[]>>
  addTableItem: (item?: Partial<TableServiceItem>) => void
  addBarItem: (item?: Partial<BarDrinkItem>) => void
  updateTableItem: (id: string, updates: Partial<TableServiceItem>) => void
  updateBarItem: (id: string, updates: Partial<BarDrinkItem>) => void
  removeTableItem: (id: string) => void
  removeBarItem: (id: string) => void
  saveTableItem: (item: TableServiceItem) => Promise<void>
  saveBarItem: (item: BarDrinkItem) => Promise<void>
  deleteTableItem: (id: string) => Promise<void>
  deleteBarItem: (id: string) => Promise<void>
  refetch: () => Promise<void>
  isConnected: boolean
}

const MenuContext = React.createContext<MenuContextValue | null>(null)

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [tableItems, setTableItems] = React.useState<TableServiceItem[]>([])
  const [barItems, setBarItems] = React.useState<BarDrinkItem[]>([])
  const connected = isApiConnected()
  const { hasBackendToken } = useApiAuth()

  const refetch = React.useCallback(async () => {
    if (!connected || !getAccessToken()) return
    try {
      const [tableRes, barRes] = await Promise.all([
        api.get<{ items: TableServiceItem[] }>("/api/menu/table"),
        api.get<{ items: BarDrinkItem[] }>("/api/menu/bar"),
      ])
      if (tableRes?.items != null) setTableItems(Array.isArray(tableRes.items) ? tableRes.items : [])
      if (barRes?.items != null) setBarItems(Array.isArray(barRes.items) ? barRes.items : [])
    } catch {
      // keep current state
    }
  }, [connected])

  React.useEffect(() => {
    if (connected && hasBackendToken) refetch()
  }, [connected, hasBackendToken, refetch])

  const addTableItem = React.useCallback((item?: Partial<TableServiceItem>) => {
    const id = `table_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    setTableItems((prev) => [
      ...prev,
      {
        id,
        title: item?.title ?? "",
        price: item?.price ?? "",
        capacity: item?.capacity,
        desc: item?.desc,
        limitedOffer: item?.limitedOffer,
        limitedDateStart: item?.limitedDateStart,
        limitedDate: item?.limitedDate,
        discountOffer: item?.discountOffer,
        discountPrice: item?.discountPrice,
        discountTimeLimitStart: item?.discountTimeLimitStart,
        discountTimeLimit: item?.discountTimeLimit,
      },
    ])
  }, [])

  const addBarItem = React.useCallback((item?: Partial<BarDrinkItem>) => {
    const id = `bar_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    setBarItems((prev) => [
      ...prev,
      {
        id,
        title: item?.title ?? "",
        desc: item?.desc,
        price: item?.price ?? "",
        iconColor: item?.iconColor,
        limitedOffer: item?.limitedOffer,
        limitedDateStart: item?.limitedDateStart,
        limitedDate: item?.limitedDate,
        discountOffer: item?.discountOffer,
        discountPrice: item?.discountPrice,
        discountTimeLimitStart: item?.discountTimeLimitStart,
        discountTimeLimit: item?.discountTimeLimit,
      },
    ])
  }, [])

  const updateTableItem = React.useCallback((id: string, updates: Partial<TableServiceItem>) => {
    setTableItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }, [])

  const updateBarItem = React.useCallback((id: string, updates: Partial<BarDrinkItem>) => {
    setBarItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }, [])

  const removeTableItem = React.useCallback((id: string) => {
    setTableItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const removeBarItem = React.useCallback((id: string) => {
    setBarItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const saveTableItem = React.useCallback(
    async (item: TableServiceItem) => {
      if (!connected) return
      const payload = {
        title: item.title,
        price: item.price,
        capacity: item.capacity,
        desc: item.desc,
        limitedOffer: item.limitedOffer,
        limitedDateStart: item.limitedDateStart,
        limitedDate: item.limitedDate,
        discountOffer: item.discountOffer,
        discountPrice: item.discountPrice,
        discountTimeLimitStart: item.discountTimeLimitStart,
        discountTimeLimit: item.discountTimeLimit,
      }
      if (isUuid(item.id)) {
        const updated = await api.patch<TableServiceItem>(`/api/menu/table/${item.id}`, payload)
        setTableItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
      } else {
        const created = await api.post<TableServiceItem>("/api/menu/table", payload)
        setTableItems((prev) => prev.map((i) => (i.id === item.id ? created : i)))
      }
    },
    [connected]
  )

  const saveBarItem = React.useCallback(
    async (item: BarDrinkItem) => {
      if (!connected) return
      const payload = {
        title: item.title,
        desc: item.desc,
        price: item.price,
        limitedOffer: item.limitedOffer,
        limitedDateStart: item.limitedDateStart,
        limitedDate: item.limitedDate,
        discountOffer: item.discountOffer,
        discountPrice: item.discountPrice,
        discountTimeLimitStart: item.discountTimeLimitStart,
        discountTimeLimit: item.discountTimeLimit,
      }
      if (isUuid(item.id)) {
        const updated = await api.patch<BarDrinkItem>(`/api/menu/bar/${item.id}`, payload)
        setBarItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
      } else {
        const created = await api.post<BarDrinkItem>("/api/menu/bar", payload)
        setBarItems((prev) => prev.map((i) => (i.id === item.id ? created : i)))
      }
    },
    [connected]
  )

  const deleteTableItem = React.useCallback(
    async (id: string) => {
      if (!connected || !isUuid(id)) {
        removeTableItem(id)
        return
      }
      await api.delete(`/api/menu/table/${id}`)
      removeTableItem(id)
    },
    [connected, removeTableItem]
  )

  const deleteBarItem = React.useCallback(
    async (id: string) => {
      if (!connected || !isUuid(id)) {
        removeBarItem(id)
        return
      }
      await api.delete(`/api/menu/bar/${id}`)
      removeBarItem(id)
    },
    [connected, removeBarItem]
  )

  const value = React.useMemo<MenuContextValue>(
    () => ({
      tableItems,
      barItems,
      setTableItems,
      setBarItems,
      addTableItem,
      addBarItem,
      updateTableItem,
      updateBarItem,
      removeTableItem,
      removeBarItem,
      saveTableItem,
      saveBarItem,
      deleteTableItem,
      deleteBarItem,
      refetch,
      isConnected: connected,
    }),
    [
      tableItems,
      barItems,
      addTableItem,
      addBarItem,
      updateTableItem,
      updateBarItem,
      removeTableItem,
      removeBarItem,
      saveTableItem,
      saveBarItem,
      deleteTableItem,
      deleteBarItem,
      refetch,
      connected,
    ]
  )

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu(): MenuContextValue {
  const ctx = React.useContext(MenuContext)
  if (!ctx) throw new Error("useMenu must be used within MenuProvider")
  return ctx
}

export function useMenuOptional(): MenuContextValue | null {
  return React.useContext(MenuContext)
}
