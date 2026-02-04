import { BlurView } from "expo-blur"
import * as React from "react"
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"

import { useTheme } from "@/theme/theme-provider"

export type CardVariant = "solid" | "glass"

export interface CardProps extends ViewProps {
  variant?: CardVariant
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function Card({ variant = "solid", style, children, ...props }: CardProps) {
  const { theme } = useTheme()
  const borderColor = theme.colors.border

  if (variant === "glass") {
    const glassBg = "rgba(18, 10, 30, 0.75)"
    return (
      <BlurView
        intensity={24}
        tint="dark"
        style={[styles.base, { borderColor, backgroundColor: glassBg }, style]}
      >
        <View {...props} style={styles.content}>
          {children}
        </View>
      </BlurView>
    )
  }

  return (
    <View
      {...props}
      style={[
        styles.base,
        { backgroundColor: theme.colors.card, borderColor },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    padding: 0,
  },
})

