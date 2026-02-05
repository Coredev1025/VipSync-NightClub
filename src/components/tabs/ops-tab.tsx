import { Canvas, Group, Path, Skia } from "@shopify/react-native-skia"
import {
  ArrowUpRight,
  ChevronRight,
  Clock,
  DollarSign,
  List,
  Plus,
  Target,
  Users,
  Wine,
  X,
  Zap
} from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated"

import { useLiveFeed, type LiveFeedItem } from "@/contexts/live-feed-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { ModalSheet } from "@/components/ui/modal"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { SlowFlowText } from "@/components/ui/slow-flow-text"
import { canManageLiveFeed, canViewLiveFeed } from "@/constants/role-permissions"
import { useToast } from "@/hooks/use-toast"
import { resolveAvatar } from "@/lib/assets"
import { formatNumber, getInitials } from "@/lib/utils"
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

const TOP_LIVE_FEED = 5

type FeedType = LiveFeedItem["type"]

export function OpsTab({ userRole }: OpsTabProps = {}) {
  const { theme } = useTheme()
  const { toast } = useToast()
  const { feedItems, setFeedItems, addFeedItem } = useLiveFeed()
  const [activeFilter, setActiveFilter] = React.useState<string>("all")
  const [showAllFeedSheet, setShowAllFeedSheet] = React.useState(false)
  const [showAddFeedSheet, setShowAddFeedSheet] = React.useState(false)
  const [addFeedForm, setAddFeedForm] = React.useState<{ type: FeedType; title: string; description: string; time: string; table: string }>({
    type: "order",
    title: "",
    description: "",
    time: "Just now",
    table: "",
  })

  /** Nightclub permissions: only manager & owner can view Ops / Live Feed. */
  const canViewFeed = canViewLiveFeed(userRole)
  /** Manager & owner can add feed items. */
  const canManageFeed = canManageLiveFeed(userRole)

  const revenueGoal = 25000
  const currentRevenue = 10600
  const revenueProgress = (currentRevenue / revenueGoal) * 100
  const changeRate = 18
  const comparisonPeriod = "vs last Saturday"

  const filteredFeed = React.useMemo(() => {
    const list = activeFilter === "all" ? feedItems : feedItems.filter((item) => item.type === activeFilter)
    const getSortKey = (item: LiveFeedItem) =>
      item.createdAt ?? (item.id.startsWith("feed-") ? parseInt(item.id.replace("feed-", ""), 10) || 0 : 0)
    return [...list].sort((a, b) => getSortKey(b) - getSortKey(a))
  }, [activeFilter, feedItems])

  const topFeed = React.useMemo(() => filteredFeed.slice(0, TOP_LIVE_FEED), [filteredFeed])

  function handleAddFeed() {
    const title = addFeedForm.title.trim()
    const description = addFeedForm.description.trim()
    if (!title) {
      toast({ title: "Missing title", description: "Title is required." })
      return
    }
    const tableNum = addFeedForm.table.trim() ? parseInt(addFeedForm.table.trim(), 10) : undefined
    addFeedItem({
      type: addFeedForm.type,
      title,
      description: description || "—",
      time: addFeedForm.time.trim() || "Just now",
      ...(Number.isFinite(tableNum) && tableNum != null ? { table: tableNum } : {}),
    })
    setShowAddFeedSheet(false)
    setAddFeedForm({ type: "order", title: "", description: "", time: "Just now", table: "" })
    toast({ title: "Feed added", description: `${title} has been added to Live Feed.` })
  }

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
            Ops, Live Feed, and revenue are available to managers and owners only.
          </Text>
        </View>
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
            <RevenueDonutChart
              currentRevenue={currentRevenue}
              revenueGoal={revenueGoal}
              changeRate={changeRate}
              comparisonPeriod={comparisonPeriod}
              theme={theme}
            />
          </Card>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickStatCard
              icon={<Users size={18} color={theme.colors.neonCyan} />}
              label="Total Guests"
              value="156"
              trend="+12"
              tone="cyan"
              delay={60}
            />
            <QuickStatCard
              icon={<Wine size={18} color={theme.colors.neonPink} />}
              label="Bottles Sold"
              value="24"
              trend="+5"
              tone="pink"
              delay={90}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickStatCard
              icon={<Clock size={18} color={theme.colors.neonOrange} />}
              label="Avg Stay"
              value="2.5h"
              tone="orange"
              delay={120}
            />
            <QuickStatCard
              icon={<DollarSign size={18} color={theme.colors.neonGreen} />}
              label="Avg Spend"
              value="$442"
              trend="+$23"
              tone="green"
              delay={150}
            />
          </View>
        </MotiView>

        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: 1.15 }}
                transition={{ type: "timing", duration: 1100, loop: true }}
              >
                <Zap size={18} color={theme.colors.neonCyan} />
              </MotiView>
              <Text style={{ color: theme.colors.foreground, fontSize: 16, fontFamily: "Orbitron_900Black" }}>
                Live Feed
              </Text>
              <MotiView
                from={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 1000, loop: true }}
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.neonGreen }}
              />
            </View>
            {canManageFeed ? (
              <HapticPressable
                onPress={() => setShowAddFeedSheet(true)}
                style={{ padding: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}18` }}
                accessibilityLabel="Add feed item"
                accessibilityRole="button"
              >
                <Plus size={20} color={theme.colors.neonCyan} />
              </HapticPressable>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "center" }}>
            {["all", "order", "arrival", "alert"].map((filter) => {
              const isActive = activeFilter === filter
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: isActive ? `${theme.colors.neonPink}` : "rgba(0,0,0,0.20)",
                      borderColor: isActive ? "transparent" : theme.colors.border,
                      borderWidth: isActive ? 0 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: isActive ? "#fff" : theme.colors.mutedForeground, fontFamily: "Orbitron_900Black", textTransform: "capitalize", fontSize: 12 }}>
                    {filter}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <HapticPressable
            onPress={() => setShowAllFeedSheet(true)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: `${theme.colors.muted}22` }}
            accessibilityLabel="View all feed items"
            accessibilityRole="button"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <List size={18} color={theme.colors.neonCyan} />
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 13 }}>Details</Text>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>View all {filteredFeed.length} items</Text>
            </View>
            <ChevronRight size={18} color={theme.colors.mutedForeground} />
          </HapticPressable>

          <View style={{ gap: 10 }}>
            {topFeed.map((item, index) => (
              <FeedItemRow key={item.id} item={item} index={index} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* All Live Feed (Details) Sheet */}
      <ModalSheet open={showAllFeedSheet} onClose={() => setShowAllFeedSheet(false)} maxHeightPct={0.9} showHeader={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 12 }}>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 18 }}>All Live Feed</Text>
            <HapticPressable onPress={() => setShowAllFeedSheet(false)} style={{ padding: 8 }} accessibilityLabel="Close">
              <X size={22} color={theme.colors.foreground} />
            </HapticPressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {filteredFeed.map((item, index) => (
                <FeedItemRow key={item.id} item={item} index={index} />
              ))}
            </View>
          </ScrollView>
        </View>
      </ModalSheet>

      {/* Add Live Feed Sheet */}
      <ModalSheet open={showAddFeedSheet} onClose={() => setShowAddFeedSheet(false)} maxHeightPct={0.85} showHeader={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 12 }}>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 18 }}>Add Live Feed</Text>
            <HapticPressable onPress={() => setShowAddFeedSheet(false)} style={{ padding: 8 }} accessibilityLabel="Close">
              <X size={22} color={theme.colors.foreground} />
            </HapticPressable>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Type</Text>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {(["order", "arrival", "alert", "geo"] as const).map((t) => {
                    const isSelected = addFeedForm.type === t
                    const accentColor =
                      t === "order"
                        ? theme.colors.neonPink
                        : t === "arrival"
                          ? theme.colors.neonGreen
                          : t === "alert"
                            ? theme.colors.neonOrange
                            : theme.colors.neonCyan
                    return (
                      <Button
                        key={t}
                        size="sm"
                        variant="outline"
                        tone={t === "order" ? "pink" : t === "arrival" ? "green" : t === "alert" ? "orange" : "cyan"}
                        style={isSelected ? { backgroundColor: `${accentColor}33` } : undefined}
                        onPress={() => setAddFeedForm((prev) => ({ ...prev, type: t }))}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Button>
                    )
                  })}
                </View>
              </View>
              <View>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Title</Text>
                <Input
                  placeholder="e.g. New Order"
                  value={addFeedForm.title}
                  onChangeText={(text) => setAddFeedForm((prev) => ({ ...prev, title: text }))}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Description (optional)</Text>
                <Input
                  placeholder="e.g. 2x Ace of Spades - Table 1"
                  value={addFeedForm.description}
                  onChangeText={(text) => setAddFeedForm((prev) => ({ ...prev, description: text }))}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Time</Text>
                <Input
                  placeholder="e.g. Just now, 2 min ago"
                  value={addFeedForm.time}
                  onChangeText={(text) => setAddFeedForm((prev) => ({ ...prev, time: text }))}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Table (optional)</Text>
                <Input
                  placeholder="e.g. 1"
                  value={addFeedForm.table}
                  onChangeText={(text) => setAddFeedForm((prev) => ({ ...prev, table: text.replace(/\D/g, "") }))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Button variant="outline" tone="neutral" style={{ flex: 1 }} onPress={() => setShowAddFeedSheet(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" style={{ flex: 1 }} onPress={handleAddFeed}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Plus size={16} color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: "Orbitron_900Black" }}>Add Feed</Text>
                  </View>
                </Button>
              </View>
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

function FeedItemRow({ item, index }: { item: LiveFeedItem; index: number }) {
  const { theme } = useTheme()
  const config =
    item.type === "arrival"
      ? { tone: "green" as const, label: "Arrival" }
      : item.type === "alert"
        ? { tone: "orange" as const, label: "Alert" }
        : item.type === "geo"
          ? { tone: "cyan" as const, label: "Geo" }
          : { tone: "pink" as const, label: "Order" }

  const toneColor =
    config.tone === "pink"
      ? theme.colors.neonPink
      : config.tone === "cyan"
        ? theme.colors.neonCyan
        : config.tone === "green"
          ? theme.colors.neonGreen
          : theme.colors.neonOrange

  const hasAvatar = Boolean(item.avatar)

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 25).springify().damping(18).stiffness(250).mass(0.8)}
    >
      <Card variant="glass" style={{ overflow: "hidden" }}>
        <Pressable
          style={({ pressed }) => [
            styles.feedRow,
            {
              backgroundColor: pressed ? "rgba(255,255,255,0.06)" : "transparent",
              borderColor: `${toneColor}22`,
            },
          ]}
        >
          <View style={{ width: 48, height: 48, justifyContent: "center", alignItems: "center" }}>
            {hasAvatar && item.avatar ? (
              <NeonAvatar
                source={resolveAvatar(item.avatar)}
                fallback={getInitials(item.title)}
                size="md"
                glow={config.tone}
                showPulse
                showRing
              />
            ) : (
              <View style={[styles.initials, { borderColor: `${toneColor}55`, backgroundColor: `${toneColor}1a` }]}>
                <Text style={{ color: toneColor, fontFamily: "Orbitron_900Black" }}>{getInitials(item.title)}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <SlowFlowText
                  containerStyle={{ alignSelf: "stretch" }}
                  style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold" }}
                >
                  {item.title}
                </SlowFlowText>
                <SlowFlowText
                  containerStyle={{ alignSelf: "stretch" }}
                  style={{ color: theme.colors.mutedForeground, fontSize: 12 }}
                >
                  {item.description}
                </SlowFlowText>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {item.table ? (
                    <Text style={{ color: theme.colors.foreground, fontSize: 11, fontFamily: "Orbitron_700Bold" }}>
                      Table {item.table}
                    </Text>
                  ) : null}
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>
                    {item.time}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                <Badge tone={config.tone}>{config.label}</Badge>
              </View>
            </View>
          </View>
        </Pressable>
      </Card>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  filter: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  feedRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  initials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
})

