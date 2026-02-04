import * as React from "react"
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native"

import { useTheme } from "@/theme/theme-provider"

export type BadgeTone = "neutral" | "pink" | "cyan" | "green" | "orange" | "destructive"

export interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  style?: StyleProp<ViewStyle>
}

export function Badge({ children, tone = "neutral", style }: BadgeProps) {
  const { theme } = useTheme()
  const toneColor =
    tone === "pink"
      ? theme.colors.neonPink
      : tone === "cyan"
        ? theme.colors.neonCyan
        : tone === "green"
          ? theme.colors.neonGreen
          : tone === "orange"
            ? theme.colors.neonOrange
            : tone === "destructive"
              ? "#ff3b30"
              : theme.colors.mutedForeground

  const bg = tone === "neutral" ? theme.colors.muted : `${toneColor}26`
  const border = tone === "neutral" ? theme.colors.border : `${toneColor}55`

  return (
    <View style={[styles.base, { backgroundColor: bg, borderColor: border }, style]}>
      <Text
        style={[
          styles.text,
          { color: tone === "neutral" ? theme.colors.mutedForeground : toneColor },
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
})

