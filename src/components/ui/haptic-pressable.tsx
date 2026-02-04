import * as React from "react"
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native"
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated"

import { useHapticFeedback } from "@/hooks/use-haptic-feedback"
import { useTheme } from "@/theme/theme-provider"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface HapticPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>
  neonBorder?: boolean
  borderColor?: string
  children: React.ReactNode
}

/**
 * Pressable component with haptic feedback and optional neon borders
 * Uses Reanimated for smooth 60fps animations
 */
export function HapticPressable({
  style,
  neonBorder = false,
  borderColor,
  children,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: HapticPressableProps) {
  const { theme } = useTheme()
  const { trigger: haptic, triggerRelease: hapticRelease } = useHapticFeedback()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })

  const handlePressIn = (e: any) => {
    haptic()
    scale.value = withSpring(0.92, { damping: 12, stiffness: 280 })
    opacity.value = withSpring(0.78, { damping: 12, stiffness: 280 })
    onPressIn?.(e)
  }

  const handlePressOut = (e: any) => {
    hapticRelease()
    scale.value = withSpring(1, { damping: 12, stiffness: 280 })
    opacity.value = withSpring(1, { damping: 12, stiffness: 280 })
    onPressOut?.(e)
  }

  const handlePress = (e: any) => {
    // Haptic already fired on press down - no need to fire again on release
    onPress?.(e)
  }

  const borderStyle = neonBorder
    ? {
        borderWidth: 1.5,
        borderColor: borderColor || `${theme.colors.neonPink}AA`,
      }
    : {}

  return (
    <AnimatedPressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, borderStyle, style]}
    >
      {children}
    </AnimatedPressable>
  )
}
