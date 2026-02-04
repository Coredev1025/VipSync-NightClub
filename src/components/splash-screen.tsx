import { Image } from "expo-image"
import { Check } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { StyleSheet, Text, View, useWindowDimensions } from "react-native"

import { VIPsyncLogo } from "@/components/ui/vipsync-logo"
import { useTheme } from "@/theme/theme-provider"

const splashBg = require("../../assets/vipsync/images/splash-bg.jpg")

export interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const [progress, setProgress] = React.useState(0)
  const [loadingText, setLoadingText] = React.useState("INITIALIZING")

  React.useEffect(() => {
    const loadingTexts = [
      "INITIALIZING",
      "CONNECTING SERVERS",
      "LOADING VENUE DATA",
      "SYNCING TABLES",
      "PREPARING INTERFACE",
      "READY TO LAUNCH",
    ]

    const id = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.5
        const idx = Math.min(
          Math.floor((next / 100) * loadingTexts.length),
          loadingTexts.length - 1
        )
        setLoadingText(loadingTexts[idx]!)

        if (next >= 100) {
          clearInterval(id)
          setTimeout(onComplete, 800)
          return 100
        }
        return next
      })
    }, 35)

    return () => clearInterval(id)
  }, [onComplete])

  const progressWidth = clamp(Math.round(width * 0.76), 260, 320)

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Image source={splashBg} style={StyleSheet.absoluteFillObject} contentFit="cover" />

      {/* HUD rings */}
      <Ring size={640} borderColor="rgba(255,255,255,0.10)" />
      <Ring size={520} borderColor="rgba(0,220,255,0.10)" delay={900} />
      <Ring size={420} borderColor="rgba(255,33,182,0.08)" delay={1400} />

      {/* Ambient blobs */}
      <MotiView
        from={{ opacity: 0.25, translateX: 0, translateY: 0, scale: 1 }}
        animate={{ opacity: 0.4, translateX: 20, translateY: 12, scale: 1.1 }}
        transition={{ type: "timing", duration: 4000, loop: true }}
        style={[
          styles.blob,
          { backgroundColor: `${theme.colors.neonPink}22`, top: -40, left: -40 },
        ]}
      />
      <MotiView
        from={{ opacity: 0.25, translateX: 0, translateY: 0, scale: 1.1 }}
        animate={{ opacity: 0.35, translateX: -20, translateY: -12, scale: 1 }}
        transition={{ type: "timing", duration: 4000, loop: true, delay: 1800 }}
        style={[
          styles.blob,
          { backgroundColor: `${theme.colors.neonCyan}22`, bottom: -50, right: -50 },
        ]}
      />

      {/* Particles */}
      {Array.from({ length: 16 }).map((_, i) => {
        const isPink = i % 2 === 0
        const left = `${(i * 13) % 100}%` as const
        const top = `${(i * 19) % 100}%` as const
        return (
          <MotiView
            key={i}
            from={{ opacity: 0.25, translateY: 0, scale: 1 }}
            animate={{ opacity: 0.7, translateY: -22, scale: 1.4 }}
            transition={{ type: "timing", duration: 2400 + (i % 4) * 300, loop: true, delay: i * 120 }}
            style={[
              styles.particle,
              {
                left,
                top,
                backgroundColor: isPink ? theme.colors.neonPink : theme.colors.neonCyan,
              },
            ]}
          />
        )
      })}

      <View style={styles.content}>
        <View style={styles.brandArea}>
          <View style={styles.brandLockup}>
            <MotiView
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 16, stiffness: 180 }}
              style={styles.brandRow}
            >
              <MotiView
                from={{ opacity: 0.65, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1.02 }}
                transition={{ type: "timing", duration: 1600, loop: true }}
                style={[
                  styles.markOuter,
                  { borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(0,0,0,0.32)" },
                ]}
              >
                <View style={[styles.markInner, { backgroundColor: theme.colors.neonPurple }]}>
                  <Check size={18} color="#001018" />
                </View>
              </MotiView>

              <VIPsyncLogo size="xl" animate={false} />
            </MotiView>

            <View style={[styles.pill, { backgroundColor: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.18)" }]}>
              <Text style={[styles.pillText, { color: "rgba(255,255,255,0.82)" }]}>COMMAND CENTER</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusArea}>
          <View style={[styles.progressWrap, { width: progressWidth }]}>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Loading progress"
              accessibilityValue={{ min: 0, max: 100, now: Math.floor(progress) }}
              style={[styles.progressTrack, { backgroundColor: "rgba(255,255,255,0.14)" }]}
            >
              <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: theme.colors.neonCyan }]} />
            </View>

            <View style={styles.progressMeta}>
              <Text style={[styles.loadingText, { color: "rgba(255,255,255,0.75)" }]}>
                {loadingText}
              </Text>
              <Text style={[styles.percent, { color: theme.colors.neonCyan }]}>
                {Math.floor(progress)}%
              </Text>
            </View>

            <View style={styles.indicatorsRow}>
              <StatusIndicator label="SERVER" />
              <StatusIndicator label="DATABASE" />
              <StatusIndicator label="REALTIME" />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

function Ring(props: { size: number; borderColor: string; delay?: number }) {
  const offset = Math.round(props.size * 0.5)
  return (
    <MotiView
      from={{ rotate: "0deg", opacity: 0.7 }}
      animate={{ rotate: "360deg", opacity: 1 }}
      transition={{ type: "timing", duration: 18000, loop: true, delay: props.delay ?? 0 }}
      style={[
        styles.ring,
        {
          width: props.size,
          height: props.size,
          marginLeft: -offset,
          marginTop: -offset,
          borderColor: props.borderColor,
        },
      ]}
      pointerEvents="none"
    />
  )
}

function StatusIndicator(props: { label: string }) {
  const { theme } = useTheme()
  return (
    <View style={styles.indicator}>
      <MotiView
        from={{ opacity: 0.55, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ type: "timing", duration: 1200, loop: true }}
        style={[styles.dot, { backgroundColor: theme.colors.neonGreen }]}
      />
      <Text style={[styles.indicatorText, { color: "rgba(255,255,255,0.72)" }]}>{props.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    paddingTop: 48,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  ring: {
    position: "absolute",
    left: "50%",
    top: "50%",
    borderWidth: 1,
    borderRadius: 9999,
  },
  brandArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLockup: {
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markOuter: {
    width: 52,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  markInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontFamily: "Orbitron_800ExtraBold",
    letterSpacing: 2.2,
  },
  statusArea: {
    alignItems: "center",
  },
  blob: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  progressWrap: {
    width: 300,
  },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressMeta: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 11,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1.8,
  },
  percent: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  indicatorsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
})

