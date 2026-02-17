import * as React from "react"
import { Platform, StyleSheet, Text, View } from "react-native"
import { MotiView } from "moti"

import { useTheme } from "@/theme/theme-provider"

export interface ToastOptions {
  title: string
  description?: string
  durationMs?: number
  /** e.g. "destructive" for error styling; optional, UI can ignore if not supported */
  variant?: string
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { theme } = useTheme()
  const [active, setActive] = React.useState<ToastOptions | null>(null)

  const toast = React.useCallback((options: ToastOptions) => {
    setActive(options)
  }, [])

  React.useEffect(() => {
    if (!active) return
    const ms = active.durationMs ?? 2400
    const id = setTimeout(() => setActive(null), ms)
    return () => clearTimeout(id)
  }, [active])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {active ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: "timing", duration: 220 }}
            style={[
              styles.toast,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.title, { color: theme.colors.foreground }]}>
              {active.title}
            </Text>
            {active.description ? (
              <Text style={[styles.desc, { color: theme.colors.mutedForeground }]}>
                {active.description}
              </Text>
            ) : null}
          </MotiView>
        </View>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const value = React.useContext(ToastContext)
  if (!value) throw new Error("useToast must be used within ToastProvider")
  return value
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
    top: Platform.select({ ios: 60, default: 24 }),
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  desc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
})

