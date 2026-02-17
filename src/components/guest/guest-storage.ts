import * as React from "react"

/** No-op: no localStorage. Returns null (in-memory only). */
export async function readJsonFromStorage<T>(_key: string): Promise<T | null> {
  return null
}

/** No-op: no localStorage. */
export async function writeJsonToStorage<T>(_key: string, _value: T): Promise<void> {}

/** No-op: no localStorage. */
export async function removeFromStorage(_key: string): Promise<void> {}

/** In-memory state only (no persistence). Same API as before for compatibility. */
export function useStorageState<T>(_key: string, initialValue: T) {
  return React.useState<T>(initialValue) as [T, React.Dispatch<React.SetStateAction<T>>]
}

// Backward-compatible naming from the Next.js prototype.
export const useLocalStorageState = useStorageState
