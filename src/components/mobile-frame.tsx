import * as React from "react"
import { Platform, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useTheme } from "@/theme/theme-provider"

export interface MobileFrameProps {
  children: React.ReactNode
}

export function MobileFrame({ children }: MobileFrameProps) {
  const { theme } = useTheme()

  if (Platform.OS !== "web") {
    return (
      <SafeAreaView edges={[]} style={[styles.nativeSafe, { backgroundColor: theme.colors.background }]}>
        {children}
      </SafeAreaView>
    )
  }

  return (
    <View style={[styles.webOuter, { backgroundColor: "#ffffff" }]}>
      <View style={styles.webFrame}>
        <View style={[styles.webBezel, { backgroundColor: "#000" }]}>
          <View style={styles.webScreen}>{children}</View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  nativeSafe: {
    flex: 1,
  },
  webOuter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  webFrame: {
    width: 375,
    height: 812,
    maxHeight: "95vh" as any,
  },
  webBezel: {
    flex: 1,
    borderRadius: 56,
    padding: 12,
  },
  webScreen: {
    flex: 1,
    borderRadius: 48,
    overflow: "hidden",
  },
})

