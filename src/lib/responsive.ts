import { Dimensions, PixelRatio } from "react-native"

/**
 * Reference width from design (e.g. iPhone 14 / common mobile).
 * Used to scale layout and typography across different screen sizes.
 */
export const BASE_WIDTH = 375
export const BASE_HEIGHT = 812

/** Breakpoints (width in px) for layout decisions */
export const BREAKPOINTS = {
  /** Small phones (e.g. iPhone SE, narrow devices) */
  sm: 320,
  /** Medium phones (default) */
  md: 375,
  /** Large phones */
  lg: 414,
  /** Tablets / large devices */
  xl: 768,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

/**
 * Scale a value proportionally to screen width.
 * Use for spacing, icon sizes, and non-text dimensions that should grow with screen.
 */
export function scale(size: number, width: number = Dimensions.get("window").width): number {
  const scaleFactor = width / BASE_WIDTH
  const newSize = size * scaleFactor
  return Math.round(PixelRatio.roundToNearestPixel(newSize))
}

/**
 * Scale with a factor to avoid blowing up on large screens.
 * factor 0.5 = halfway between no scaling and full scaling.
 */
export function moderateScale(
  size: number,
  factor: number = 0.5,
  width: number = Dimensions.get("window").width
): number {
  const scaleFactor = 1 + (width / BASE_WIDTH - 1) * factor
  const newSize = size * scaleFactor
  return Math.round(PixelRatio.roundToNearestPixel(newSize))
}

/**
 * Scale font size; use moderate scaling so text doesn't get huge on tablets.
 */
export function scaleFont(size: number, width: number = Dimensions.get("window").width): number {
  return moderateScale(size, 0.4, width)
}

/**
 * Get current breakpoint key from width.
 */
export function getBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINTS.xl) return "xl"
  if (width >= BREAKPOINTS.lg) return "lg"
  if (width >= BREAKPOINTS.md) return "md"
  return "sm"
}
