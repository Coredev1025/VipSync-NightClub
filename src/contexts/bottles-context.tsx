import * as React from "react"

export interface Bottle {
  id: string
  name: string
  price: number
  stock: number
  createdAt: string // ISO
  /** Key into assets bottleImages (e.g. ace, champagne, wine, cocktail) */
  imageKey?: string
  /** Custom image from device (insert image). Shown instead of imageKey when set. */
  imageUri?: string
}

export type BottleCreate = Omit<Bottle, "id" | "createdAt">
export type BottleUpdate = Partial<Omit<Bottle, "id" | "createdAt">>

const initialBottles: Bottle[] = [
  { id: "b1", name: "Ace of Spades", price: 550, stock: 3, createdAt: new Date().toISOString(), imageKey: "ace" },
  { id: "b2", name: "Dom Pérignon", price: 320, stock: 8, createdAt: new Date().toISOString(), imageKey: "champagne" },
  { id: "b3", name: "Grey Goose", price: 280, stock: 12, createdAt: new Date().toISOString(), imageKey: "cocktail" },
  { id: "b4", name: "Patrón Silver", price: 180, stock: 6, createdAt: new Date().toISOString(), imageKey: "cocktail" },
]

interface BottlesContextValue {
  bottles: Bottle[]
  addBottle: (b: BottleCreate) => Bottle
  updateBottle: (id: string, u: BottleUpdate) => void
  deleteBottle: (id: string) => void
}

const BottlesContext = React.createContext<BottlesContextValue | null>(null)

export function BottlesProvider({ children }: { children: React.ReactNode }) {
  const [bottles, setBottles] = React.useState<Bottle[]>(initialBottles)

  const addBottle = React.useCallback((b: BottleCreate): Bottle => {
    const newBottle: Bottle = {
      ...b,
      id: `b${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setBottles((prev) => [...prev, newBottle])
    return newBottle
  }, [])

  const updateBottle = React.useCallback((id: string, u: BottleUpdate) => {
    setBottles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...u } : b))
    )
  }, [])

  const deleteBottle = React.useCallback((id: string) => {
    setBottles((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({ bottles, addBottle, updateBottle, deleteBottle }),
    [bottles, addBottle, updateBottle, deleteBottle]
  )

  return (
    <BottlesContext.Provider value={value}>
      {children}
    </BottlesContext.Provider>
  )
}

export function useBottles(): BottlesContextValue {
  const ctx = React.useContext(BottlesContext)
  if (!ctx) {
    throw new Error("useBottles must be used within BottlesProvider")
  }
  return ctx
}
