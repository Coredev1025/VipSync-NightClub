import * as React from "react"
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native"
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated"

import { useHapticFeedback } from "@/hooks/use-haptic-feedback"
import { useTheme } from "@/theme/theme-provider"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type ButtonVariant = "solid" | "outline" | "ghost" | "gradient"
export type ButtonTone = "neutral" | "pink" | "cyan" | "green" | "orange" | "destructive"
export type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  isLoading?: boolean
  variant?: ButtonVariant
  tone?: ButtonTone
  size?: ButtonSize
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

function getPadding(size: ButtonSize) {
  if (size === "icon") return { height: 44, width: 44, paddingHorizontal: 0 }
  if (size === "sm") return { height: 36, paddingHorizontal: 14 }
  if (size === "lg") return { height: 56, paddingHorizontal: 18 }
  return { height: 44, paddingHorizontal: 16 }
}

export function Button({
  children,
  onPress,
  disabled,
  isLoading,
  variant = "solid",
  tone = "neutral",
  size = "md",
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useTheme()
  const { trigger: haptic, triggerRelease: hapticRelease } = useHapticFeedback()
  const pad = getPadding(size)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

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
              : theme.colors.foreground

  const bg =
    variant === "solid"
      ? tone === "neutral"
        ? theme.colors.muted
        : `${toneColor}33`
      : "transparent"

  // Enhanced neon borders - more visible and glowing
  const border =
    variant === "outline" || variant === "solid"
      ? tone === "neutral"
        ? `${theme.colors.foreground}88`
        : `${toneColor}AA` // More visible neon border
      : variant === "ghost"
        ? "transparent"
        : `${toneColor}AA`

  const textColor =
    variant === "solid" && tone !== "neutral" ? theme.colors.background : toneColor

  const renderedChildren =
    typeof children === "string" || typeof children === "number" ? (
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {children}
      </Text>
    ) : (
      children
    )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : opacity.value,
    }
  })

  const handlePressIn = () => {
    if (disabled || isLoading) return
    haptic()
    scale.value = withSpring(0.92, { damping: 12, stiffness: 280 })
    opacity.value = withSpring(0.78, { damping: 12, stiffness: 280 })
  }

  const handlePressOut = () => {
    hapticRelease()
    scale.value = withSpring(1, { damping: 12, stiffness: 280 })
    opacity.value = withSpring(1, { damping: 12, stiffness: 280 })
  }

  const handlePress = () => {
    if (disabled || isLoading) return
    // Haptic already fired on press down - no need to fire again on release
    onPress?.()
  }

  const content = (
    <View style={[styles.inner, pad]}>
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        renderedChildren
      )}
    </View>
  )

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        animatedStyle,
        {
          borderColor: variant === "gradient" ? `${theme.colors.neonPink}AA` : border,
          backgroundColor: variant === "gradient" ? theme.colors.neonPink : bg,
          borderWidth: variant === "ghost" ? 0 : 1.5,
        },
        style,
      ]}
    >
      {variant === "gradient" ? (
        <View style={[styles.inner, pad]}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            typeof children === "string" || typeof children === "number" ? (
              <Text style={[styles.text, { color: "#fff" }]} numberOfLines={1}>
                {children}
              </Text>
            ) : (
              children
            )
          )}
        </View>
      ) : (
        content
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
})

