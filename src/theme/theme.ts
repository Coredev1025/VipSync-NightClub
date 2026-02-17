export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string

  neonPink: string
  neonCyan: string
  neonGreen: string
  neonOrange: string
  neonPurple: string
}

export interface ThemeTypography {
  title: string
  body: string
}

export interface Theme {
  colors: ThemeColors
  typography: ThemeTypography
}

export type ThemeScheme = "dark"

// Color token map: Canvas, Surface, Neon Blue, Neon Gold, Neon Purple, Neon Pink
const dark: Theme = {
  colors: {
    // Canvas – primary background
    background: "#050505",
    foreground: "#f4f0ff",
    // Surface – cards, inputs, elevated surfaces
    card: "#101015",
    cardForeground: "#f4f0ff",
    muted: "#101015",
    mutedForeground: "#d4d4e4",
    border: "#202030",
    input: "#101015",

    neonPink: "#FF2A6D",
    neonCyan: "#00F0FF",
    neonGreen: "#00F0FF",
    neonOrange: "#FFD700",
    neonPurple: "#BC13FE",
  },
  typography: {
    title: "Orbitron_900Black",
    body: "Inter_400Regular", // Inter font for body text
  },
}

export function getTheme(_scheme?: ThemeScheme): Theme {
  return dark
}

// Helper function to get Orbitron font family based on weight
export function getOrbitronFont(weight: "400" | "500" | "600" | "700" | "800" | "900" = "900"): string {
  const fontMap = {
    "400": "Orbitron_400Regular",
    "500": "Orbitron_500Medium",
    "600": "Orbitron_600SemiBold",
    "700": "Orbitron_700Bold",
    "800": "Orbitron_800ExtraBold",
    "900": "Orbitron_900Black",
  }
  return fontMap[weight]
}

