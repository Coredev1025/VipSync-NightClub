"use client"

import React from "react"

export function readJsonFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJsonToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeFromStorage(key: string) {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(key)
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(initialValue)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    const stored = readJsonFromStorage<T>(key)
    if (stored !== null) setValue(stored)
    setHasLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  React.useEffect(() => {
    if (!hasLoaded) return
    writeJsonToStorage(key, value)
  }, [hasLoaded, key, value])

  return [value, setValue] as const
}

