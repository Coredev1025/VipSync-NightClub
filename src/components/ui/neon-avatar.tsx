import { Image } from "expo-image"
import { MotiView } from "moti"
import * as React from "react"
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native"

import { useTheme } from "@/theme/theme-provider"

export type NeonGlow = "pink" | "cyan" | "green" | "orange" | "purple"
export type NeonAvatarSize = "sm" | "md" | "lg" | "xl"
export type NeonStatus = "online" | "offline"

export interface NeonAvatarProps {
  src?: string
  source?: unknown
  fallback: string
  size?: NeonAvatarSize
  glow?: NeonGlow
  status?: NeonStatus
  showRing?: boolean
  showPulse?: boolean
  style?: StyleProp<ViewStyle>
}

function getSizePx(size: NeonAvatarSize) {
  if (size === "sm") return 32
  if (size === "md") return 40
  if (size === "xl") return 64
  return 48
}

function getGlowColor(theme: ReturnType<typeof useTheme>["theme"], glow: NeonGlow) {
  if (glow === "cyan") return theme.colors.neonCyan
  if (glow === "green") return theme.colors.neonGreen
  if (glow === "orange") return theme.colors.neonOrange
  if (glow === "purple") return theme.colors.neonPurple
  return theme.colors.neonPink
}

export function NeonAvatar({
  src,
  source,
  fallback,
  size = "md",
  glow = "pink",
  status,
  showRing,
  showPulse,
  style,
}: NeonAvatarProps) {
  const { theme } = useTheme()
  const px = getSizePx(size)
  const glowColor = getGlowColor(theme, glow)

  return (
    <View style={[{ width: px, height: px }, style]}>
      {showPulse ? (
        <MotiView
          from={{ opacity: 0.25, scale: 0.95 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ type: "timing", duration: 1400, loop: true }}
          style={[
            styles.pulse,
            { borderColor: `${glowColor}77`, borderRadius: px / 2 },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.avatar,
          {
            width: px,
            height: px,
            borderRadius: px / 2,
            borderColor: showRing ? `${glowColor}cc` : theme.colors.border,
          },
        ]}
      >
        {source || src ? (
          <Image
            // expo-image supports either module numbers or remote URIs
            source={source ? (source as any) : { uri: src as string }}
            style={{ width: px, height: px, borderRadius: px / 2 }}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.fallback, { width: px, height: px, borderRadius: px / 2 }]}>
            <Text style={[styles.fallbackText, { color: theme.colors.foreground }]}>
              {fallback.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {status === "online" ? (
        <View
          style={[
            styles.status,
            { backgroundColor: theme.colors.neonGreen, borderColor: theme.colors.card },
          ]}
        />
      ) : null}
    </View>
  )
}

export interface NeonAvatarGroupProps {
  avatars: Array<{ src?: string; source?: unknown; fallback: string; status?: NeonStatus }>
  max?: number
  size?: NeonAvatarSize
  glow?: NeonGlow
}

export function NeonAvatarGroup({
  avatars,
  max = 3,
  size = "sm",
  glow = "cyan",
}: NeonAvatarGroupProps) {
  const shown = avatars.slice(0, max)
  const px = getSizePx(size)
  const overlap = Math.max(10, Math.floor(px * 0.35))

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {shown.map((a, idx) => (
        <View key={`${a.fallback}-${idx}`} style={{ marginLeft: idx === 0 ? 0 : -overlap }}>
          <NeonAvatar
            src={a.src}
            source={a.source}
            fallback={a.fallback}
            size={size}
            glow={glow}
            status={a.status}
            showRing
          />
        </View>
      ))}
    </View>
  )
}

export interface ProfileAvatarProps {
  src?: string
  source?: unknown
  fallback: string
  glow?: NeonGlow
  level?: number
}

export function ProfileAvatar({
  src,
  source,
  fallback,
  glow = "pink",
  level,
}: ProfileAvatarProps) {
  const { theme } = useTheme()
  const glowColor = getGlowColor(theme, glow)
  const sizePx = 84

  return (
    <View style={{ width: sizePx, height: sizePx }}>
      <View
        style={[
          styles.profileRing,
          {
            borderColor: `${glowColor}aa`,
          },
        ]}
      >
        <NeonAvatar src={src} source={source} fallback={fallback} size="xl" glow={glow} showRing />
      </View>
      {typeof level === "number" ? (
        <View style={[styles.level, { backgroundColor: theme.colors.neonPink }]}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  pulse: {
    position: "absolute",
    inset: 0,
    borderWidth: 2,
  },
  avatar: {
    borderWidth: 2,
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontFamily: "Orbitron_800ExtraBold",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  status: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  profileRing: {
    borderRadius: 28,
    padding: 6,
    borderWidth: 2,
  },
  level: {
    position: "absolute",
    right: -6,
    bottom: -10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  levelText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Orbitron_800ExtraBold",
  },
})

