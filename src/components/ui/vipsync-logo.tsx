import { MotiView } from "moti"
import * as React from "react"
import { StyleSheet, Text, View } from "react-native"

import { useTheme } from "@/theme/theme-provider"

export interface VIPsyncLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showTagline?: boolean
  animate?: boolean
}

function getFontSize(size: VIPsyncLogoProps["size"]) {
  if (size === "sm") return 18
  if (size === "lg") return 32
  if (size === "xl") return 44
  return 24
}

export function VIPsyncLogo({ size = "md", showTagline, animate }: VIPsyncLogoProps) {
  const { theme } = useTheme()
  const fontSize = getFontSize(size)

  const content = (
    <View style={styles.container}>
      <Text style={[styles.brand, { fontSize }]}>
        <Text style={{ color: theme.colors.neonPink }}>VIP</Text>
        <Text style={{ color: theme.colors.neonCyan }}>sync</Text>
      </Text>
      {showTagline ? (
        <Text style={[styles.tagline, { color: theme.colors.mutedForeground }]}>
          Nightclub Command Center
        </Text>
      ) : null}
    </View>
  )

  if (!animate) return content

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 16, stiffness: 180 }}
    >
      {content}
    </MotiView>
  )
}

export function VIPsyncLogoCompact() {
  return <VIPsyncLogo size="sm" />
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  brand: {
    fontFamily: "Orbitron_900Black",
    letterSpacing: 0.4,
  },
  tagline: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
})

