import * as Haptics from "expo-haptics"
import { useCallback } from "react"

/**
 * Hook for providing heavy haptic feedback on button presses.
 * Returns: [trigger] for press-in, and optionally triggerRelease for press-out
 * so the full press feels "heavy" (down + release).
 */
export function useHapticFeedback() {
  const trigger = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  }, [])

  const triggerRelease = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [])

  return { trigger, triggerRelease }
}
