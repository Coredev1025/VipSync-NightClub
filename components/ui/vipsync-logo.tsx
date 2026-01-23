"use client"

import { motion } from "framer-motion"

interface VIPsyncLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  animate?: boolean
  showTagline?: boolean
}

const sizes = {
  sm: { text: "text-xl", icon: 24 },
  md: { text: "text-2xl", icon: 32 },
  lg: { text: "text-4xl", icon: 48 },
  xl: { text: "text-6xl", icon: 64 },
}

export function VIPsyncLogo({ size = "md", animate = true, showTagline = false }: VIPsyncLogoProps) {
  const { text, icon } = sizes[size]

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center gap-1">
        {/* Animated Icon */}
        <motion.div
          initial={animate ? { scale: 0, rotate: -180 } : {}}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative"
        >
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            {/* Outer ring with gradient */}
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="url(#logoGradient)"
              strokeWidth="3"
              fill="none"
              initial={animate ? { pathLength: 0, opacity: 0 } : {}}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="animate-path-glow"
              style={{ filter: "drop-shadow(0 0 8px oklch(0.72 0.28 330 / 0.8))" }}
            />
            
            {/* Inner decorative ring */}
            <motion.circle
              cx="32"
              cy="32"
              r="22"
              stroke="url(#logoGradient2)"
              strokeWidth="1"
              strokeDasharray="4 4"
              fill="none"
              initial={animate ? { rotate: 0 } : {}}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
            
            {/* V shape */}
            <motion.path
              d="M20 22L32 42L44 22"
              stroke="url(#logoGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={animate ? { pathLength: 0 } : {}}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            
            {/* Sync wave lines */}
            <motion.path
              d="M24 48C26 44 30 44 32 48C34 52 38 52 40 48"
              stroke="oklch(0.78 0.18 200)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              initial={animate ? { pathLength: 0, opacity: 0 } : {}}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            />
            
            {/* Pulse dot */}
            <motion.circle
              cx="32"
              cy="32"
              r="3"
              fill="oklch(0.78 0.18 200)"
              initial={animate ? { scale: 0 } : {}}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            />
            
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.72 0.28 330)" />
                <stop offset="50%" stopColor="oklch(0.65 0.24 300)" />
                <stop offset="100%" stopColor="oklch(0.78 0.18 200)" />
              </linearGradient>
              <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(0.72 0.28 330 / 0.5)" />
                <stop offset="100%" stopColor="oklch(0.78 0.18 200 / 0.5)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Glow effect behind icon */}
          <motion.div
            className="absolute inset-0 rounded-full bg-neon-pink/20 blur-xl -z-10"
            animate={animate ? { opacity: [0.3, 0.6, 0.3], scale: [0.8, 1.1, 0.8] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={animate ? { opacity: 0, x: -20 } : {}}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`${text} font-black tracking-tight relative`}
        >
          <span className="relative">
            <motion.span
              className="text-neon-pink text-glow-pink drop-shadow-[0_0_20px_rgba(255,0,150,0.8)]"
              animate={animate ? { opacity: [1, 0.9, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              VIP
            </motion.span>
            <motion.span
              className="text-neon-cyan text-glow-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]"
              animate={animate ? { opacity: [1, 0.9, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            >
              sync
            </motion.span>
          </span>
          
          {/* Shimmer overlay */}
          {animate && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
          )}
        </motion.div>
      </div>

      {/* Tagline */}
      {showTagline && (
        <motion.p
          initial={animate ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-white/90 text-xs tracking-[0.3em] uppercase mt-2 font-semibold drop-shadow-lg backdrop-blur-sm px-3 py-1 rounded-full bg-black/30 border border-white/10"
        >
          Command Center
        </motion.p>
      )}
    </div>
  )
}

// Compact logo for header
export function VIPsyncLogoCompact({ animate = true }: { animate?: boolean }) {
  return (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <svg
          width={28}
          height={28}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="url(#compactGradient)"
            strokeWidth="3"
            fill="none"
            style={{ filter: "drop-shadow(0 0 4px oklch(0.72 0.28 330 / 0.6))" }}
          />
          <path
            d="M20 22L32 42L44 22"
            stroke="url(#compactGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="3"
            fill="oklch(0.78 0.18 200)"
            animate={animate ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <defs>
            <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.72 0.28 330)" />
              <stop offset="100%" stopColor="oklch(0.78 0.18 200)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight">
        <span className="text-neon-pink text-glow-pink">VIP</span>
        <span className="text-neon-cyan text-glow-cyan">sync</span>
      </span>
    </motion.div>
  )
}
