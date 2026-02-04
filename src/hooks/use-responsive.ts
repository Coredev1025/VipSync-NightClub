import { useWindowDimensions } from "react-native"

import { BASE_WIDTH, getBreakpoint, moderateScale, scale, scaleFont } from "@/lib/responsive"

/**
 * Hook for responsive layout and scaling.
 * Re-renders on window size change (orientation, split screen, etc.).
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions()

  const breakpoint = getBreakpoint(width)
  const isSmallScreen = width < 375
  const isMediumScreen = width >= 375 && width < 414
  const isLargeScreen = width >= 414
  const isTablet = width >= 768

  return {
    width,
    height,
    breakpoint,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
    /** Scale dimension by width (use for spacing, icons) */
    scale: (size: number) => scale(size, width),
    /** Moderate scale (use for fonts, mixed layout) */
    moderateScale: (size: number, factor?: number) => moderateScale(size, factor, width),
    /** Scale font size */
    scaleFont: (size: number) => scaleFont(size, width),
    /** Width as percentage of base (e.g. 0.9 = 90% of BASE_WIDTH) */
    widthPct: (pct: number) => width * pct,
    /** Horizontal padding that scales with screen */
    horizontalPadding: moderateScale(16, 0.5, width),
  }
}
