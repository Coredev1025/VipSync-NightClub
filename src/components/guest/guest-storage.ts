import AsyncStorage from "@react-native-async-storage/async-storage"
import * as React from "react"

export async function readJsonFromStorage<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function writeJsonToStorage<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

export async function removeFromStorage(key: string): Promise<void> {
  await AsyncStorage.removeItem(key)
}

export function useStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(initialValue)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true
    readJsonFromStorage<T>(key)
      .then((stored) => {
        if (!isMounted) return
        if (stored !== null) setValue(stored)
        setHasLoaded(true)
      })
      .catch(() => setHasLoaded(true))
    return () => {
      isMounted = false
    }
  }, [key])

  React.useEffect(() => {
    if (!hasLoaded) return
    writeJsonToStorage(key, value).catch(() => {})
  }, [hasLoaded, key, value])

  return [value, setValue] as const
}

// Backward-compatible naming from the Next.js prototype.
export const useLocalStorageState = useStorageState

