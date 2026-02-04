import * as React from "react"

import { getTheme, type Theme, type ThemeScheme } from "./theme"

export interface ThemeContextValue {
  scheme: ThemeScheme
  theme: Theme
  setPreference: (_preference: ThemeScheme) => void
  toggle: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const scheme: ThemeScheme = "dark"
  const theme = React.useMemo(() => getTheme(scheme), [])

  const setPreference = React.useCallback(() => {
    // No-op: app is dark-only
  }, [])

  const toggle = React.useCallback(() => {
    // No-op: app is dark-only
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ scheme, theme, setPreference, toggle }),
    [theme, setPreference, toggle]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const value = React.useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used within ThemeProvider")
  return value
}

