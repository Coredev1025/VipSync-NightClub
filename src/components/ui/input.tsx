import * as React from "react"
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native"
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { useTheme } from "@/theme/theme-provider"

export interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>
}

// Helper function to lighten a hex color
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent))
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent))
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

export const Input = React.forwardRef<TextInput, InputProps>(function Input(
  { containerStyle, style, onFocus, onBlur, ...props },
  ref
) {
  const { theme } = useTheme()
  const isFocused = useSharedValue(0)

  const normalBorderColor = theme.colors.border
  const focusedBorderColor = lightenColor(theme.colors.border, 0.6)

  const handleFocus = React.useCallback(
    (e: any) => {
      isFocused.value = withTiming(1, { duration: 200 })
      onFocus?.(e)
    },
    [onFocus, isFocused]
  )

  const handleBlur = React.useCallback(
    (e: any) => {
      isFocused.value = withTiming(0, { duration: 200 })
      onBlur?.(e)
    },
    [onBlur, isFocused]
  )

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      isFocused.value,
      [0, 1],
      [normalBorderColor, focusedBorderColor]
    )
    return {
      borderColor,
    }
  })

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.colors.input },
        animatedBorderStyle,
        containerStyle,
      ]}
    >
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.foreground }, style]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
  },
  input: {
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: "Inter_400Regular",
  },
})

