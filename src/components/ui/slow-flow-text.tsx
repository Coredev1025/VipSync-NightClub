import * as React from "react"
import {
  LayoutChangeEvent,
  StyleProp,
  Text,
  TextProps,
  View,
  ViewStyle
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated"

const TRAVEL_DURATION_MS = 8000
const PAUSE_MS = 1500

export interface SlowFlowTextProps extends Omit<TextProps, "children"> {
  children: string
  containerStyle?: StyleProp<ViewStyle>
}

/**
 * Renders text that, when it overflows its container, animates with a slow
 * horizontal scroll (marquee) so the full content can be read.
 */
export function SlowFlowText({
  children,
  containerStyle,
  style,
  ...textProps
}: SlowFlowTextProps) {
  const containerWidth = useSharedValue(0)
  const translateX = useSharedValue(0)
  const [layout, setLayout] = React.useState({ container: 0, content: 0 })

  const onContainerLayout = React.useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    containerWidth.value = w
    setLayout((prev) => ({ ...prev, container: w }))
  }, [])

  const onContentLayout = React.useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setLayout((prev) => ({ ...prev, content: w }))
  }, [])

  const travelDistance =
    layout.container > 0 && layout.content > layout.container
      ? layout.content - layout.container
      : 0

  React.useEffect(() => {
    if (travelDistance <= 0) {
      translateX.value = 0
      return
    }
    translateX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: PAUSE_MS / 2 }),
        withTiming(-travelDistance, { duration: TRAVEL_DURATION_MS }),
        withTiming(-travelDistance, { duration: PAUSE_MS }),
        withTiming(0, { duration: TRAVEL_DURATION_MS }),
        withTiming(0, { duration: PAUSE_MS / 2 })
      ),
      -1,
      false
    )
  }, [travelDistance])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View
      style={[{ overflow: "hidden" }, containerStyle]}
      onLayout={onContainerLayout}
    >
      <Animated.View
        style={[{ alignSelf: "flex-start" }, animatedStyle]}
        onLayout={onContentLayout}
      >
        <Text style={style} {...textProps}>
          {children}
        </Text>
      </Animated.View>
    </View>
  )
}
