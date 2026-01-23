"use client"

import React from "react"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NeonAvatarProps {
  src?: string
  fallback: string
  size?: "sm" | "md" | "lg" | "xl"
  status?: "online" | "busy" | "away" | "offline"
  glow?: "pink" | "cyan" | "green" | "orange" | "purple"
  showRing?: boolean
  showPulse?: boolean
  badge?: React.ReactNode
  className?: string
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
}

const statusColors = {
  online: "bg-neon-green",
  busy: "bg-neon-red",
  away: "bg-neon-orange",
  offline: "bg-muted-foreground",
}

const glowClasses = {
  pink: "avatar-glow-pink",
  cyan: "avatar-glow-cyan",
  green: "avatar-glow-green",
  orange: "shadow-[0_0_0_2px_oklch(0.72_0.24_50/0.8),0_0_15px_oklch(0.72_0.24_50/0.5)]",
  purple: "shadow-[0_0_0_2px_oklch(0.65_0.24_300/0.8),0_0_15px_oklch(0.65_0.24_300/0.5)]",
}

const ringColors = {
  pink: "border-neon-pink/50",
  cyan: "border-neon-cyan/50",
  green: "border-neon-green/50",
  orange: "border-neon-orange/50",
  purple: "border-neon-purple/50",
}

export function NeonAvatar({
  src,
  fallback,
  size = "md",
  status,
  glow = "pink",
  showRing = true,
  showPulse = false,
  badge,
  className = "",
}: NeonAvatarProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Animated outer ring */}
      {showRing && (
        <motion.div
          className={`absolute -inset-1 rounded-full border-2 ${ringColors[glow]} opacity-60`}
          animate={showPulse ? { scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Pulsing glow background */}
      {showPulse && (
        <motion.div
          className="absolute -inset-2 rounded-full blur-md opacity-40"
          style={{ backgroundColor: `var(--neon-${glow})` }}
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
      
      <Avatar className={`${sizes[size]} ${glowClasses[glow]} relative z-10 border-2 border-background`}>
        <AvatarImage src={src || "/placeholder.svg"} className="object-cover" />
        <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
          {fallback}
        </AvatarFallback>
      </Avatar>
      
      {/* Status indicator */}
      {status && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusColors[status]}`}
        >
          {status === "online" && (
            <motion.span
              className="absolute inset-0 rounded-full bg-neon-green"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.span>
      )}
      
      {/* Custom badge */}
      {badge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 z-20"
        >
          {badge}
        </motion.div>
      )}
    </motion.div>
  )
}

// Group avatar component
interface AvatarGroupProps {
  avatars: Array<{ src?: string; fallback: string; status?: NeonAvatarProps["status"] }>
  max?: number
  size?: "sm" | "md"
  glow?: NeonAvatarProps["glow"]
}

export function NeonAvatarGroup({ avatars, max = 4, size = "sm", glow = "cyan" }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className="flex -space-x-2">
      {visibleAvatars.map((avatar, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative"
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <NeonAvatar
            src={avatar.src}
            fallback={avatar.fallback}
            size={size}
            status={avatar.status}
            glow={glow}
            showRing={false}
            showPulse={false}
          />
        </motion.div>
      ))}
      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${sizes[size]} rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold text-muted-foreground`}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  )
}

// Profile avatar with decorative elements
interface ProfileAvatarProps extends Omit<NeonAvatarProps, "size"> {
  level?: number
  role?: string
}

export function ProfileAvatar({ level, role, ...props }: ProfileAvatarProps) {
  return (
    <div className="relative">
      {/* Decorative rotating ring */}
      <motion.div
        className="absolute -inset-3 rounded-full border border-dashed border-neon-pink/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Decorative dots */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-neon-cyan"
          style={{
            top: "50%",
            left: "50%",
            transform: `rotate(${angle}deg) translateY(-40px) translateX(-50%)`,
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      
      <NeonAvatar {...props} size="xl" showPulse />
      
      {/* Level badge */}
      {level && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple text-xs font-bold text-white glow-pink"
        >
          LVL {level}
        </motion.div>
      )}
      
      {/* Role badge */}
      {role && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground font-medium"
        >
          {role}
        </motion.div>
      )}
    </div>
  )
}
