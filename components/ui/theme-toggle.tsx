"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <motion.button
        className="p-2.5 rounded-xl hover:bg-muted transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 text-muted-foreground" />
      </motion.button>
    )
  }

  // Use resolvedTheme to get the actual theme (handles system theme)
  const currentTheme = resolvedTheme || theme
  const isDark = currentTheme === "dark"

  const toggleTheme = () => {
    if (isDark) {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2.5 rounded-xl hover:bg-muted transition-colors relative"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-muted-foreground" />
        )}
      </motion.div>
    </motion.button>
  )
}
