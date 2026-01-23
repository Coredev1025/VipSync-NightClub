"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VIPsyncLogo } from "@/components/ui/vipsync-logo"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("INITIALIZING")

  useEffect(() => {
    const loadingTexts = [
      "INITIALIZING",
      "CONNECTING SERVERS",
      "LOADING VENUE DATA",
      "SYNCING TABLES",
      "PREPARING INTERFACE",
      "READY TO LAUNCH",
    ]

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1.5
        
        // Update loading text based on progress
        const textIndex = Math.min(
          Math.floor((newProgress / 100) * loadingTexts.length),
          loadingTexts.length - 1
        )
        setLoadingText(loadingTexts[textIndex])
        
        if (newProgress >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 800)
          return 100
        }
        return newProgress
      })
    }, 35)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
      >
        {/* Nightclub Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 z-0"
          style={{ backgroundImage: "url('/images/splash-bg.jpg')" }}
        />
        
        {/* Dark overlay for better content readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 z-[5]" />
        
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 z-[10]"
          animate={{
            background: [
              "radial-gradient(ellipse at 20% 20%, oklch(0.72 0.28 330 / 0.12) 0%, transparent 50%)",
              "radial-gradient(ellipse at 80% 80%, oklch(0.78 0.18 200 / 0.12) 0%, transparent 50%)",
              "radial-gradient(ellipse at 50% 50%, oklch(0.65 0.24 300 / 0.12) 0%, transparent 50%)",
              "radial-gradient(ellipse at 20% 20%, oklch(0.72 0.28 330 / 0.12) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full z-[15]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? "var(--neon-pink)" : "var(--neon-cyan)",
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Scan lines effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-[15]">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
              initial={{ y: "-100%" }}
              animate={{ y: "100vh" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Rotating outer rings */}
        <motion.div
          className="absolute w-[500px] h-[500px] border border-neon-pink/10 rounded-full z-[15]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] border border-neon-cyan/10 rounded-full z-[15]"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] border border-dashed border-neon-purple/20 rounded-full z-[15]"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        {/* Main Content */}
        <div className="relative z-20 flex flex-col items-center">
          {/* Logo with extra effects */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mb-8"
          >
            <VIPsyncLogo size="xl" animate showTagline />
          </motion.div>

          {/* Animated progress container */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative"
          >
            {/* Progress bar background */}
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/20 shadow-lg">
              {/* Progress fill */}
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, var(--neon-pink), var(--neon-purple), var(--neon-cyan))",
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </div>

            {/* Progress percentage */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-between items-center mt-3"
            >
              <span className="text-xs font-mono text-white/80 drop-shadow-md">
                {loadingText}
              </span>
              <span className="text-xs font-mono text-neon-cyan drop-shadow-lg font-bold">
                {Math.floor(progress)}%
              </span>
            </motion.div>
          </motion.div>

          {/* Status indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-8 flex gap-4"
          >
            {[
              { label: "Server", delay: 0 },
              { label: "Database", delay: 0.1 },
              { label: "Realtime", delay: 0.2 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + item.delay }}
                className="flex items-center gap-2"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-neon-green"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: progress > 30 + i * 20 ? [0.7, 1, 0.7] : 0.3,
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
                <span className="text-[10px] text-white/70 uppercase tracking-wider drop-shadow-md">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Corner decorations */}
        <svg className="absolute top-4 left-4 w-16 h-16 text-neon-pink/20" viewBox="0 0 100 100">
          <motion.path
            d="M0 50 L0 0 L50 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </svg>
        <svg className="absolute bottom-4 right-4 w-16 h-16 text-neon-cyan/20" viewBox="0 0 100 100">
          <motion.path
            d="M100 50 L100 100 L50 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </svg>

        {/* Cyber grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none cyber-grid z-[15]"
        />
      </motion.div>
    </AnimatePresence>
  )
}
