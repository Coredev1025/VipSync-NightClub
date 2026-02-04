# Responsive Design

This app is built to work across different mobile device sizes (small phones, large phones, tablets).

## Patterns

- **Layout**: Prefer `flex: 1`, `flexDirection: "row"`, and percentage or flex-based widths instead of fixed pixel widths where possible.
- **Safe areas**: Use `SafeAreaProvider` (root) and `useSafeAreaInsets()` for notches, status bar, and home indicator. Avoid hardcoded padding for safe areas.
- **Dimensions**: Use `useWindowDimensions()` from React Native so layout updates on orientation change, split screen, or window resize. Avoid `Dimensions.get("window")` in render (it doesn’t update).
- **Scaling**: Use `useResponsive()` from `@/hooks/use-responsive` when you need:
  - `scale(size)` – proportional to screen width (spacing, icons)
  - `moderateScale(size, factor)` – damped scaling (default factor 0.5)
  - `scaleFont(size)` – for font sizes
  - `horizontalPadding` – consistent horizontal padding that scales
  - `isSmallScreen`, `isTablet`, etc. – for breakpoint-specific UI

## Reference

- Base design width: **375px** (see `src/lib/responsive.ts`).
- Breakpoints: `sm` 320, `md` 375, `lg` 414, `xl` 768.

## Key files

- `src/lib/responsive.ts` – scale helpers, breakpoints, base dimensions
- `src/hooks/use-responsive.ts` – `useResponsive()` hook
- `src/providers/app-providers.tsx` – `SafeAreaProvider` wraps the app
