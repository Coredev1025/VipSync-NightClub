import { Canvas, Group, Path, Skia } from "@shopify/react-native-skia"
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Clock,
  DollarSign,
  List,
  Target,
  Users,
  Wine,
  Zap
} from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated"

import { useLiveFeedOptional, type LiveFeedItem } from "@/contexts/live-feed-context"
import { useTablesOptional } from "@/contexts/tables-context"
import { Card } from "@/components/ui/card"
import { ModalSheet } from "@/components/ui/modal"
import { api, isApiConnected } from "@/lib/api"
import { formatNumber } from "@/lib/utils"
import { useTheme } from "@/theme/theme-provider"
import type { MapTabUserRole } from "./map-tab"

export interface OpsTabProps {
  /** When door or promoter, Ops tab is hidden; if reached, shows access restricted. */
  userRole?: MapTabUserRole
}

/**
 * Revenue Donut Chart Component - Displays revenue progress as a donut chart
 * Shows "Current Revenue" vs "Remaining to Goal" segments
 */
function RevenueDonutChart({
  currentRevenue,
  revenueGoal,
  changeRate,
  comparisonPeriod,
  theme,
}: {
  currentRevenue: number
  revenueGoal: number
  changeRate: number // Percentage change (positive for increase, negative for decrease)
  comparisonPeriod: string // e.g., "vs last Saturday"
  theme: ReturnType<typeof useTheme>["theme"]
}) {
  const size = 200
  const strokeWidth = 32
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const progress = Math.min(100, Math.max(0, (currentRevenue / revenueGoal) * 100))
  const remaining = 100 - progress

  // Animation values
  const [animatedProgress, setAnimatedProgress] = React.useState(0)
  const scaleAnimation = useSharedValue(0.8)
  const pulseAnimation = useSharedValue(1)
  const opacityAnimation = useSharedValue(0)

  // Animate progress on mount
  React.useEffect(() => {
    scaleAnimation.value = withSpring(1, { damping: 12, stiffness: 100 })
    opacityAnimation.value = withTiming(1, { duration: 400 })
    
    // Animate progress from 0 to actual progress
    const duration = 1500
    const steps = 60
    const stepDuration = duration / steps
    const stepIncrement = progress / steps
    let currentStep = 0
    
    const interval = setInterval(() => {
      currentStep++
      const newProgress = Math.min(progress, stepIncrement * currentStep)
      setAnimatedProgress(newProgress)
      
      if (currentStep >= steps) {
        clearInterval(interval)
        setAnimatedProgress(progress)
      }
    }, stepDuration)
    
    return () => clearInterval(interval)
  }, [progress])

  // Pulse animation for percentage change
  React.useEffect(() => {
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    )
  }, [])

  // Helper function to convert degrees to radians
  const degToRad = (deg: number) => (deg * Math.PI) / 180

  // Helper function to get point on circle
  const getPointOnCircle = (angle: number, r: number) => {
    const rad = degToRad(angle)
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    }
  }

  // Create animated donut chart paths using arc segments
  const currentRevenuePath = React.useMemo(() => {
    const path = Skia.Path.Make()
    const startAngle = -90 // Start from top
    const sweepAngle = (animatedProgress / 100) * 360
    
    if (sweepAngle <= 0) return path
    
    // Create arc using addArc with rectangle bounds
    const rect = Skia.XYWHRect(
      center - radius,
      center - radius,
      radius * 2,
      radius * 2
    )
    
    // Skia addArc: rect, startAngle, sweepAngle
    path.addArc(rect, startAngle, sweepAngle)
    
    return path
  }, [animatedProgress, center, radius])

  const remainingPath = React.useMemo(() => {
    const path = Skia.Path.Make()
    const startAngle = -90 + (animatedProgress / 100) * 360
    const sweepAngle = ((100 - animatedProgress) / 100) * 360
    
    if (sweepAngle <= 0) return path
    
    // Create arc using addArc with rectangle bounds
    const rect = Skia.XYWHRect(
      center - radius,
      center - radius,
      radius * 2,
      radius * 2
    )
    
    path.addArc(rect, startAngle, sweepAngle)
    
    return path
  }, [animatedProgress, center, radius])

  const remainingAmount = revenueGoal - currentRevenue
  const isIncrease = changeRate >= 0
  const rateColor = isIncrease ? theme.colors.neonGreen : theme.colors.neonPink

  // Animated styles
  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
    opacity: opacityAnimation.value,
  }))

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }))

  return (
    <View style={{ alignItems: "center", gap: 20 }}>
      {/* Donut Chart - Centered with Animation */}
      <Animated.View 
        style={[
          { width: size, height: size, position: "relative", alignSelf: "center" },
          animatedCircleStyle
        ]}
        entering={FadeIn.duration(400).delay(100)}
      >
        <Canvas style={{ width: size, height: size }}>
          <Group>
            {/* Current Revenue segment - Cyan */}
            <Path
              path={currentRevenuePath}
              style="stroke"
              strokeWidth={strokeWidth}
              color={theme.colors.neonCyan}
              strokeCap="round"
            />
            {/* Remaining to Goal segment - Dark grey */}
            <Path
              path={remainingPath}
              style="stroke"
              strokeWidth={strokeWidth}
              color={Skia.Color("rgba(255,255,255,0.15)")}
              strokeCap="round"
            />
          </Group>
        </Canvas>
        
        {/* Center Content - Revenue Details with Animations */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center", gap: 4 }}>
            <Animated.Text
              entering={FadeInDown.duration(500).delay(300).springify()}
              style={{
                color: theme.colors.neonCyan,
                fontSize: 28,
                fontFamily: "Orbitron_900Black",
              }}
            >
              {formatNumber(currentRevenue, { prefix: "$" })}
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(500).delay(500).springify()}
              style={{
                color: theme.colors.mutedForeground,
                fontSize: 11,
                fontFamily: "Orbitron_700Bold",
              }}
            >
              {Math.round(animatedProgress)}% Complete
            </Animated.Text>
            <Animated.View
              style={animatedPulseStyle}
              entering={FadeInDown.duration(500).delay(700).springify()}
            >
              <Text
                style={{
                  color: rateColor,
                  fontSize: 18,
                  fontFamily: "Orbitron_900Black",
                  marginTop: 2,
                }}
              >
                {isIncrease ? "+" : ""}
                {changeRate.toFixed(0)}%
              </Text>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {/* Revenue Detail Indicators */}
      <View style={{ width: "100%", gap: 12 }}>
        {/* Current Revenue Indicator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: `${theme.colors.neonCyan}15`,
            borderWidth: 1,
            borderColor: `${theme.colors.neonCyan}33`,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: theme.colors.neonCyan,
              }}
            />
            <Text style={{ color: theme.colors.foreground, fontSize: 13, fontFamily: "Orbitron_700Bold" }}>
              Current Revenue
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                color: theme.colors.neonCyan,
                fontSize: 16,
                fontFamily: "Orbitron_900Black",
              }}
            >
              {formatNumber(currentRevenue, { prefix: "$" })}
            </Text>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontSize: 10,
                fontFamily: "Orbitron_500Medium",
              }}
            >
              {progress.toFixed(1)}% of goal
            </Text>
          </View>
        </View>

        {/* Remaining to Goal Indicator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            />
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, fontFamily: "Orbitron_700Bold" }}>
              Remaining to Goal
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                color: theme.colors.foreground,
                fontSize: 16,
                fontFamily: "Orbitron_900Black",
              }}
            >
              {formatNumber(remainingAmount, { prefix: "$" })}
            </Text>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontSize: 10,
                fontFamily: "Orbitron_500Medium",
              }}
            >
              {remaining.toFixed(1)}% remaining
            </Text>
          </View>
        </View>

        {/* Goal Indicator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: `${theme.colors.neonGreen}10`,
            borderWidth: 1,
            borderColor: `${theme.colors.neonGreen}22`,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Target size={14} color={theme.colors.neonGreen} />
            <Text style={{ color: theme.colors.foreground, fontSize: 13, fontFamily: "Orbitron_700Bold" }}>
              Tonight&apos;s Goal
            </Text>
          </View>
          <Text
            style={{
              color: theme.colors.neonGreen,
              fontSize: 16,
              fontFamily: "Orbitron_900Black",
            }}
          >
            {formatNumber(revenueGoal, { prefix: "$" })}
          </Text>
        </View>
      </View>
    </View>
  )
}

/** Nightclub permissions: only manager & owner can view Ops. */
function canViewOps(role: MapTabUserRole | undefined): boolean {
  return role === "manager" || role === "owner"
}

export function OpsTab({ userRole }: OpsTabProps = {}) {
  const { theme } = useTheme()
  const canViewFeed = canViewOps(userRole)
  const liveFeed = useLiveFeedOptional()
  const feedItems = liveFeed?.feedItems ?? []
  const tables = useTablesOptional()?.tables ?? []

  const [revenueData, setRevenueData] = React.useState<{
    goalAmount: number
    currentAmount: number
    changeRate: number
    comparisonLabel: string
  } | null>(null)
  const [quickStats, setQuickStats] = React.useState<{
    totalGuests: number
    tablesSold: number
    bottlesSold: number
    avgStayMinutes: number
    avgSpendPerGuest: number
  } | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [showLiveFeedDetailSheet, setShowLiveFeedDetailSheet] = React.useState(false)
  const [selectedFeedItem, setSelectedFeedItem] = React.useState<LiveFeedItem | null>(null)
  const connected = isApiConnected()
  React.useEffect(() => {
    if (!connected || !canViewFeed) {
      setRevenueData(null)
      setQuickStats(null)
      setLoadError(null)
      return
    }

    setRevenueData(null)
    setQuickStats(null)
    setLoadError(null)
    api
      .get<{
        goalAmount: number
        currentAmount: number
        changeRate: number
        comparisonLabel: string
      }>("/api/ops/revenue")
      .then((data) => {
        if (data)
          setRevenueData({
            goalAmount: data.goalAmount,
            currentAmount: data.currentAmount,
            changeRate: data.changeRate,
            comparisonLabel: data.comparisonLabel ?? "vs last Saturday",
          })
      })
      .catch(() => {
        setLoadError((prev) => prev ?? "Could not load ops revenue stats.")
      })

    api
      .get<{
        totalGuests: number
        tablesSold: number
        bottlesSold: number
        avgStayMinutes: number
        avgSpendPerGuest: number
      }>("/api/ops/quick-stats")
      .then((data) => {
        if (data) {
          setQuickStats({
            totalGuests: data.totalGuests ?? 0,
            tablesSold: data.tablesSold ?? 0,
            bottlesSold: data.bottlesSold ?? 0,
            avgStayMinutes: data.avgStayMinutes ?? 0,
            avgSpendPerGuest: data.avgSpendPerGuest ?? 0,
          })
        }
      })
      .catch(() => {
        setLoadError((prev) => prev ?? "Could not load ops quick stats.")
      })
  }, [connected, canViewFeed, feedItems.length, tables])

  const hasRevenueData =
    revenueData &&
    typeof revenueData.goalAmount === "number" &&
    typeof revenueData.currentAmount === "number" &&
    typeof revenueData.changeRate === "number"
  const isLoading = connected && canViewFeed && !hasRevenueData && !loadError

  if (!canViewFeed) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <View style={{ alignItems: "center", gap: 12, maxWidth: 280 }}>
          <View style={{ padding: 16, borderRadius: 20, backgroundColor: `${theme.colors.neonCyan}18`, borderWidth: 1, borderColor: `${theme.colors.neonCyan}44` }}>
            <Zap size={40} color={theme.colors.neonCyan} />
          </View>
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 18, textAlign: "center" }}>
            Access restricted
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
            Ops and revenue are available to managers and owners only.
          </Text>
        </View>
      </View>
    )
  }

  if (!connected) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          Backend is not connected. Ops statistics are unavailable.
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {/* <Image 
        source={images.bgOps} 
        style={StyleSheet.absoluteFillObject} 
        contentFit="cover"
        cachePolicy="memory"
        priority="high"
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.8)" }]} /> */}

      <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
        <MotiView
          from={{ opacity: 0, translateY: -14 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MotiView
              from={{ rotate: "0deg" }}
              animate={{ rotate: "0deg" }}
              transition={{ loop: true }}
            >
              <Target size={18} color={theme.colors.neonPink} />
            </MotiView>
            <Text style={{ color: theme.colors.foreground, fontSize: 16, fontFamily: "Orbitron_900Black" }}>
              Tonight&apos;s Revenue
            </Text>
          </View>

          <Card variant="glass" style={{ padding: 16, overflow: "hidden" }}>
            {hasRevenueData ? (
              <RevenueDonutChart
                currentRevenue={revenueData!.currentAmount}
                revenueGoal={revenueData!.goalAmount}
                changeRate={revenueData!.changeRate}
                comparisonPeriod={revenueData!.comparisonLabel ?? "vs last Saturday"}
                theme={theme}
              />
            ) : (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 32,
                  gap: 12,
                }}
              >
                <ActivityIndicator size="small" color={theme.colors.neonCyan} />
                <Text
                  style={{
                    color: theme.colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  {loadError ?? "Loading tonight's revenue statistics…"}
                </Text>
              </View>
            )}
          </Card>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickStatCard
              icon={<Users size={18} color={theme.colors.neonCyan} />}
              label="Total Guests"
              value={
                quickStats && typeof quickStats.totalGuests === "number"
                  ? formatNumber(quickStats.totalGuests)
                  : "—"
              }
              tone="cyan"
              delay={60}
            />
            <QuickStatCard
              icon={<Target size={18} color={theme.colors.neonCyan} />}
              label="Tables Sold"
              value={
                quickStats && typeof quickStats.tablesSold === "number"
                  ? formatNumber(quickStats.tablesSold)
                  : "—"
              }
              tone="cyan"
              delay={75}
            />
            <QuickStatCard
              icon={<Wine size={18} color={theme.colors.neonPink} />}
              label="Bottles Sold"
              value={
                quickStats && typeof quickStats.bottlesSold === "number"
                  ? formatNumber(quickStats.bottlesSold)
                  : "—"
              }
              tone="pink"
              delay={90}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickStatCard
              icon={<Clock size={18} color={theme.colors.neonOrange} />}
              label="Avg Stay"
              value={
                quickStats && typeof quickStats.avgStayMinutes === "number"
                  ? `${(quickStats.avgStayMinutes / 60).toFixed(1)}h`
                  : "—"
              }
              tone="orange"
              delay={120}
            />
            <QuickStatCard
              icon={<DollarSign size={18} color={theme.colors.neonGreen} />}
              label="Avg Spend"
              value={
                quickStats && typeof quickStats.avgSpendPerGuest === "number"
                  ? formatNumber(quickStats.avgSpendPerGuest, { prefix: "$" })
                  : "—"
              }
              tone="green"
              delay={150}
            />
          </View>

          {canViewFeed && liveFeed ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 220, delay: 180 }}
              style={{ gap: 8 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Activity size={18} color={theme.colors.neonCyan} />
                <Text style={{ color: theme.colors.foreground, fontSize: 16, fontFamily: "Orbitron_900Black" }}>
                  Live feed
                </Text>
              </View>
              <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonCyan}44` }}>
                <Pressable
                  onPress={() => setShowLiveFeedDetailSheet(true)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: `${theme.colors.muted}22`,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <List size={18} color={theme.colors.neonCyan} />
                    <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 13 }}>Details</Text>
                    <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
                      View all {feedItems.length} items
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.mutedForeground} />
                </Pressable>
                <View style={{ gap: 10, maxHeight: 220 }}>
                  {feedItems.length === 0 ? (
                    <View style={{ paddingVertical: 24, paddingHorizontal: 8, alignItems: "center" }}>
                      <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>
                        Bottles, promoter and bottle girl changes will appear here.
                      </Text>
                    </View>
                  ) : (
                    feedItems.slice(0, 5).map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setSelectedFeedItem(item)
                          setShowLiveFeedDetailSheet(true)
                        }}
                        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                      >
                        <Card
                          variant="glass"
                          style={{
                            padding: 12,
                            borderColor: `${theme.colors.neonCyan}44`,
                          }}
                        >
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 14 }} numberOfLines={1}>
                                  {item.title}
                                </Text>
                                {item.table != null ? (
                                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>T{item.table}</Text>
                                ) : null}
                              </View>
                              <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }} numberOfLines={2}>
                                {item.description}
                              </Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                                <Clock size={12} color={theme.colors.mutedForeground} />
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{item.time}</Text>
                              </View>
                            </View>
                          </View>
                        </Card>
                      </Pressable>
                    ))
                  )}
                </View>
              </Card>
            </MotiView>
          ) : null}
        </MotiView>
      </ScrollView>

      {/* Live feed detail sheet */}
      <ModalSheet
        open={showLiveFeedDetailSheet}
        onClose={() => {
          setShowLiveFeedDetailSheet(false)
          setSelectedFeedItem(null)
        }}
        maxHeightPct={0.9}
        showHeader={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 12 }}>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 18 }}>Live feed</Text>
            <Pressable
              onPress={() => {
                setShowLiveFeedDetailSheet(false)
                setSelectedFeedItem(null)
              }}
              style={{ padding: 8 }}
            >
              <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold" }}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {feedItems.length === 0 ? (
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 14, textAlign: "center", paddingVertical: 24 }}>
                  No feed items yet.
                </Text>
              ) : (
                feedItems.map((item) => (
                  <Card
                    key={item.id}
                    variant="glass"
                    style={{
                      padding: 12,
                      borderColor: selectedFeedItem?.id === item.id ? theme.colors.neonCyan : `${theme.colors.neonCyan}44`,
                      borderWidth: selectedFeedItem?.id === item.id ? 2 : 1,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 14 }} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.table != null ? (
                            <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>Table {item.table}</Text>
                          ) : null}
                        </View>
                        <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>{item.description}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                          <Clock size={12} color={theme.colors.mutedForeground} />
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{item.time}</Text>
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>·</Text>
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{item.type}</Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </ModalSheet>
    </View>
  )
}

function QuickStatCard({
  icon,
  label,
  value,
  trend,
  tone,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: string
  tone: "pink" | "cyan" | "green" | "orange"
  delay: number
}) {
  const { theme } = useTheme()
  const toneColor =
    tone === "pink"
      ? theme.colors.neonPink
      : tone === "cyan"
        ? theme.colors.neonCyan
        : tone === "green"
          ? theme.colors.neonGreen
          : theme.colors.neonOrange

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 220, delay }}
      style={{ flex: 1 }}
    >
      <Card variant="glass" style={{ padding: 14, borderColor: `${toneColor}44` }}>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {icon}
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Orbitron_700Bold" }}>
                {label}
              </Text>
            </View>
            {trend ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ArrowUpRight size={12} color={theme.colors.neonGreen} />
                <Text style={{ color: theme.colors.neonGreen, fontSize: 12, fontFamily: "Orbitron_900Black" }}>
                  {trend}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: toneColor, fontSize: 24, fontFamily: "Orbitron_900Black" }}>
            {value}
          </Text>
        </View>
      </Card>
    </MotiView>
  )
}

const styles = StyleSheet.create({})

