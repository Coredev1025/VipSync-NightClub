import { Activity, Bell, CheckCircle, Home, LogOut, Map, MessageSquare, Search, Sparkles, User, X } from "lucide-react-native"
import * as React from "react"
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideInRight,
    SlideOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ChatsTab, HomeTab, MapTab, OpsTab, ProfileTab, type MapTabUserRole } from "@/components/tabs"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { VIPsyncLogoCompact } from "@/components/ui/vipsync-logo"
import { getTabsForRole, type NightclubRole, type StaffTabId } from "@/constants/role-permissions"
import { useResponsive } from "@/hooks/use-responsive"
import { resolveAvatar } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

type TabType = "home" | "chats" | "map" | "ops" | "profile"

const ALL_TABS: Array<{ id: TabType; label: string; icon: React.ComponentType<{ size?: number; color?: string }>; badge?: number }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "chats", label: "Chats", icon: MessageSquare, badge: 3 },
  { id: "map", label: "Map", icon: Map },
  { id: "ops", label: "Ops", icon: Activity, badge: 2 },
  { id: "profile", label: "Profile", icon: User },
]

// Reanimated ambient blobs for 60fps background animation
function AmbientBlobs({ theme }: { theme: ReturnType<typeof useTheme>["theme"] }) {
  const blob1TranslateX = useSharedValue(0)
  const blob1TranslateY = useSharedValue(0)
  const blob1Scale = useSharedValue(1)
  const blob1Opacity = useSharedValue(0.18)

  const blob2TranslateX = useSharedValue(0)
  const blob2TranslateY = useSharedValue(0)
  const blob2Scale = useSharedValue(1.1)
  const blob2Opacity = useSharedValue(0.16)

  React.useEffect(() => {
    const d = 9000
    blob1TranslateX.value = withRepeat(
      withSequence(withTiming(28, { duration: d }), withTiming(0, { duration: d })),
      -1,
      false
    )
    blob1TranslateY.value = withRepeat(
      withSequence(withTiming(18, { duration: d }), withTiming(0, { duration: d })),
      -1,
      false
    )
    blob1Scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: d }), withTiming(1, { duration: d })),
      -1,
      false
    )
    blob1Opacity.value = withRepeat(
      withSequence(withTiming(0.22, { duration: d }), withTiming(0.18, { duration: d })),
      -1,
      false
    )

    const timeoutId = setTimeout(() => {
      blob2TranslateX.value = withRepeat(
        withSequence(withTiming(-28, { duration: d }), withTiming(0, { duration: d })),
        -1,
        false
      )
      blob2TranslateY.value = withRepeat(
        withSequence(withTiming(-16, { duration: d }), withTiming(0, { duration: d })),
        -1,
        false
      )
      blob2Scale.value = withRepeat(
        withSequence(withTiming(1, { duration: d }), withTiming(1.1, { duration: d })),
        -1,
        false
      )
      blob2Opacity.value = withRepeat(
        withSequence(withTiming(0.22, { duration: d }), withTiming(0.16, { duration: d })),
        -1,
        false
      )
    }, 4500)
    return () => clearTimeout(timeoutId)
  }, [])

  const blob1Style = useAnimatedStyle(() => {
    "worklet"
    return {
      transform: [
        { translateX: blob1TranslateX.value },
        { translateY: blob1TranslateY.value },
        { scale: blob1Scale.value },
      ],
      opacity: blob1Opacity.value,
    }
  }, [])

  const blob2Style = useAnimatedStyle(() => {
    "worklet"
    return {
      transform: [
        { translateX: blob2TranslateX.value },
        { translateY: blob2TranslateY.value },
        { scale: blob2Scale.value },
      ],
      opacity: blob2Opacity.value,
    }
  }, [])

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View
        style={[
          styles.blob,
          { top: -60, left: -60, backgroundColor: `${theme.colors.neonPink}22` },
          blob1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          { bottom: -70, right: -70, backgroundColor: `${theme.colors.neonCyan}22` },
          blob2Style,
        ]}
      />
    </View>
  )
}

// Reanimated pulsing dot for 60fps notification indicator
function PulsingDot({ color, size = 10 }: { color: string; size?: number }) {
  const scale = useSharedValue(1)

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    "worklet"
    return {
      transform: [{ scale: scale.value }],
    }
  }, [])

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
      ]}
    />
  )
}

export interface AppShellProps {
  onLogout?: () => void
  /** Pro user role (promoter/door/manager/owner) – controls map/edit visibility (e.g. promoter vs manager/owner). */
  userRole?: MapTabUserRole
}

export function AppShell({ onLogout, userRole }: AppShellProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { horizontalPadding } = useResponsive()

  const allowedTabIds = React.useMemo(
    () => getTabsForRole(userRole as NightclubRole | undefined),
    [userRole]
  )
  const tabs = React.useMemo(
    () => ALL_TABS.filter((t) => allowedTabIds.includes(t.id as StaffTabId)),
    [allowedTabIds]
  )

  const [activeTab, setActiveTab] = React.useState<TabType>("home")
  React.useEffect(() => {
    if (!allowedTabIds.includes(activeTab as StaffTabId)) {
      setActiveTab((allowedTabIds[0] ?? "home") as TabType)
    }
  }, [allowedTabIds, activeTab])
  const [pendingChatOrder, setPendingChatOrder] = React.useState<{
    tableNumber: number
    guest: string
    items: string
  } | null>(null)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [avatarLayout, setAvatarLayout] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const avatarRef = React.useRef<View>(null)

  const handleOrderSynced = React.useCallback(
    (order: { tableNumber: number; guest: string; items: string }) => {
      setPendingChatOrder(order)
      setActiveTab("map")
    },
    []
  )

  const handleConsumePendingOrder = React.useCallback(() => {
    setPendingChatOrder(null)
  }, [])

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab userRole={userRole} />
      case "chats":
        return <ChatsTab onOrderSynced={handleOrderSynced} />
      case "map":
        return (
          <MapTab
            pendingChatOrder={pendingChatOrder}
            onConsumePendingOrder={handleConsumePendingOrder}
            userRole={userRole}
          />
        )
      case "ops":
        return <OpsTab userRole={userRole} />
      case "profile":
        return (
          <ProfileTab
            proMode
            onLogout={onLogout}
            canManageClubSettings={userRole === "owner" || userRole === "manager"}
          />
        )
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Ambient blobs - using Reanimated for 60fps */}
      <AmbientBlobs theme={theme} />

      {/* Header - Fixed at top of screen */}
      <Animated.View
        entering={SlideInDown.duration(200).springify()}
        style={[
          styles.headerWrap,
          { 
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingTop: Math.max(insets.top, 0),
            paddingBottom: 0,
            paddingHorizontal: horizontalPadding,
            borderBottomWidth: 0,
            zIndex: 100,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <HapticPressable
                onPress={() => {}}
                style={[styles.checkmarkBtn, { backgroundColor: theme.colors.neonCyan }]}
                accessibilityRole="button"
                accessibilityLabel="Menu"
              >
                <CheckCircle size={18} color={theme.colors.background} />
              </HapticPressable>
              <VIPsyncLogoCompact />
            </View>

            <View style={styles.headerRight}>
              <HapticPressable
                onPress={() => setShowSearch((v) => !v)}
                style={styles.iconBtnStandalone}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Search size={18} color={theme.colors.foreground} />
              </HapticPressable>

              <HapticPressable
                onPress={() => setShowNotifications((v) => !v)}
                style={styles.notificationBtn}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Bell size={18} color="rgba(180, 180, 190, 0.75)" />
                <View style={styles.notificationBadge}>
                  <PulsingDot color={theme.colors.neonPink} size={10} />
                </View>
              </HapticPressable>

              <HapticPressable
                onPress={() => {
                  avatarRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    setAvatarLayout({ x: pageX, y: pageY, width, height })
                    setShowUserMenu(true)
                  })
                }}
                style={styles.avatarBtn}
                accessibilityRole="button"
                accessibilityLabel="User menu"
              >
                <View ref={avatarRef} collapsable={false} style={[styles.avatarWrapper, { borderColor: `${theme.colors.neonPink}cc` }]}>
                  <NeonAvatar
                    source={resolveAvatar("/images/avatars/man1.png")}
                    fallback="JD"
                    size="sm"
                    glow="pink"
                    showRing
                  />
                </View>
              </HapticPressable>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Main content - reserve space for bottom nav + safe area */}
      <View style={{ flex: 1, paddingTop: 56 + Math.max(insets.top, 0), paddingBottom: 70 + Math.max(insets.bottom, 12) }}>
        <Animated.View
          key={activeTab}
          entering={SlideInRight.duration(300).springify().damping(20).stiffness(90).mass(0.8)}
          exiting={SlideOutLeft.duration(250).springify().damping(20).stiffness(90).mass(0.8)}
          style={{ flex: 1 }}
        >
          {renderTab()}
        </Animated.View>
      </View>

      {/* Bottom navigation - Fixed at bottom, above safe area */}
      <View 
        style={[
          styles.navWrap, 
          { 
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.colors.background,
          }
        ]}
      >
        <View
          style={[
            styles.navBlurBackground,
            {
              backgroundColor: theme.colors.background,
            }
          ]}
        >
          <View style={styles.navContent}>
            <View style={styles.navCard}>
              <View style={styles.navRow}>
                {tabs.map((t, index) => {
                  const isActive = t.id === activeTab
                  const Icon = t.icon
                  return (
                    <TabButton
                      key={t.id}
                      isActive={isActive}
                      icon={Icon}
                      label={t.label}
                      badge={t.badge}
                      onPress={() => setActiveTab(t.id)}
                      theme={theme}
                      delay={index * 60}
                    />
                  )
                })}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Search overlay - rendered on top so backdrop receives outside taps */}
      {showSearch && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 101 }]}
            onPress={() => setShowSearch(false)}
            accessibilityLabel="Close search overlay"
            accessibilityRole="button"
          />
          <Animated.View
            entering={FadeIn.duration(200).springify()}
            exiting={FadeOut.duration(150)}
            style={[styles.searchOverlay, { top: Math.max(insets.top, 0) + 60, zIndex: 102 }]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.searchBarRow}>
                <Search size={20} color={theme.colors.mutedForeground} style={styles.searchBarIcon} />
                <Input
                  placeholder="Search tables, guests, orders..."
                  containerStyle={[styles.searchBarInput, { backgroundColor: "transparent", borderWidth: 0 }]}
                  style={styles.searchBarInputText}
                />
                <HapticPressable
                  onPress={() => setShowSearch(false)}
                  style={[styles.searchBarClear, { backgroundColor: theme.colors.muted }]}
                  accessibilityLabel="Close search"
                >
                  <X size={18} color={theme.colors.mutedForeground} />
                </HapticPressable>
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* Notifications overlay - rendered on top so backdrop receives outside taps */}
      {showNotifications && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 101 }]}
            onPress={() => setShowNotifications(false)}
            accessibilityLabel="Close notifications overlay"
            accessibilityRole="button"
          />
          <Animated.View
            entering={FadeIn.duration(200).springify()}
            exiting={FadeOut.duration(150)}
            style={[styles.notificationsOverlay, { top: 60, zIndex: 102 }]}
            pointerEvents="box-none"
          >
            <Card variant="solid" style={[styles.overlayCard, { borderColor: theme.colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Sparkles size={16} color={theme.colors.neonPink} />
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }}>
                    Notifications
                  </Text>
                </View>
                <HapticPressable onPress={() => setShowNotifications(false)} neonBorder borderColor={`${theme.colors.neonPink}AA`} style={[styles.smallBtn, { backgroundColor: theme.colors.card }]}>
                  <X size={16} color={theme.colors.mutedForeground} />
                </HapticPressable>
              </View>
              <View style={{ marginTop: 12, gap: 10 }}>
                <NotificationItem title="VIP Arriving" message="Marcus Chen - ETA 5 min" time="Just now" tone="pink" />
                <NotificationItem title="Table Request" message="Table 7 needs bottle service" time="2 min ago" tone="cyan" />
                <NotificationItem title="Capacity Alert" message="VIP Section at 85% capacity" time="10 min ago" tone="orange" />
              </View>
            </Card>
          </Animated.View>
        </>
      )}

      <AccountModal
        open={showUserMenu}
        onClose={() => {
          setShowUserMenu(false)
          setAvatarLayout(null)
        }}
        avatarLayout={avatarLayout}
        onNavigateToProfile={() => {
          setShowUserMenu(false)
          setActiveTab("profile")
        }}
        onLogout={() => {
          setShowUserMenu(false)
          onLogout?.()
        }}
      />
    </View>
  )
}

// Reanimated tab button component for 60fps animations
function TabButton({
  isActive,
  icon: Icon,
  label,
  badge,
  onPress,
  theme,
  delay,
}: {
  isActive: boolean
  icon: React.ComponentType<{ size?: number; color?: string }>
  label: string
  badge?: number
  onPress: () => void
  theme: ReturnType<typeof useTheme>["theme"]
  delay: number
}) {
  const iconScale = useSharedValue(isActive ? 1.1 : 1)
  const width = useSharedValue(isActive ? 100 : 70) // Base width for unselected tabs

  React.useEffect(() => {
    iconScale.value = withSpring(isActive ? 1.1 : 1, { damping: 15, stiffness: 300 })
    width.value = withSpring(isActive ? 100 : 70, { damping: 15, stiffness: 300 })
  }, [isActive])

  const iconAnimatedStyle = useAnimatedStyle(() => {
    "worklet"
    return {
      transform: [{ scale: iconScale.value }],
    }
  }, [isActive])

  const widthAnimatedStyle = useAnimatedStyle(() => {
    "worklet"
    return {
      width: width.value,
    }
  }, [isActive])

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(300)}>
      <Animated.View style={widthAnimatedStyle}>
        <HapticPressable
          onPress={onPress}
          neonBorder={false}
          style={[
            styles.tabBtn,
            {
              backgroundColor: isActive ? theme.colors.neonPink : "transparent",
              borderColor: isActive ? theme.colors.neonPink : "transparent",
            },
          ]}
        >
        <View style={{ height: 22, alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={iconAnimatedStyle}>
            <Icon size={18} color={isActive ? "#ffffff" : theme.colors.mutedForeground} />
          </Animated.View>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.neonPink }]}>
              <Text style={{ color: "#fff", fontSize: 10, fontFamily: "Orbitron_900Black" }}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text 
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ 
            color: isActive ? "#ffffff" : theme.colors.mutedForeground, 
            fontSize: 11, 
            fontFamily: "Orbitron_800ExtraBold",
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      </HapticPressable>
      </Animated.View>
    </Animated.View>
  )
}

function AccountModal({
  open,
  onClose,
  avatarLayout,
  onNavigateToProfile,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  avatarLayout: { x: number; y: number; width: number; height: number } | null
  onNavigateToProfile: () => void
  onLogout: () => void
}) {
  const { theme } = useTheme()
  const { width: screenWidth } = useWindowDimensions()

  if (!avatarLayout) return null

  // Position flush to the bottom of the avatar
  const modalTop = avatarLayout.y + avatarLayout.height + 4
  const modalRight = screenWidth - avatarLayout.x - avatarLayout.width

  return (
    <Modal transparent visible={open} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={FadeIn.duration(180).springify()}
          exiting={FadeOut.duration(150)}
          style={[
            styles.accountModal,
            {
              top: modalTop,
              right: modalRight,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 16 }}>
            Account
          </Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            <HapticPressable
              onPress={onNavigateToProfile}
              neonBorder
              borderColor={`${theme.colors.neonPink}AA`}
              style={[styles.menuAction, { backgroundColor: theme.colors.muted }]}
            >
              <User size={18} color={theme.colors.mutedForeground} />
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold" }}>Profile</Text>
            </HapticPressable>
            <HapticPressable
              onPress={onLogout}
              neonBorder
              borderColor="#ff3b30AA"
              style={[styles.menuAction, { backgroundColor: "rgba(255,59,48,0.10)" }]}
            >
              <LogOut size={18} color="#ff3b30" />
              <Text style={{ color: "#ff3b30", fontFamily: "Orbitron_900Black" }}>Logout</Text>
            </HapticPressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

function NotificationItem({
  title,
  message,
  time,
  tone,
}: {
  title: string
  message: string
  time: string
  tone: "pink" | "cyan" | "orange"
}) {
  const { theme } = useTheme()
  const color =
    tone === "pink"
      ? theme.colors.neonPink
      : tone === "cyan"
        ? theme.colors.neonCyan
        : theme.colors.neonOrange

  return (
    <HapticPressable
      neonBorder
      borderColor={`${color}AA`}
      style={[
        styles.notif,
        { backgroundColor: `${color}12` },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <PulsingDot color={color} size={8} />
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }}>{title}</Text>
        </View>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{time}</Text>
      </View>
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginTop: 6, marginLeft: 18 }}>
        {message}
      </Text>
    </HapticPressable>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  blob: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 999,
  },
  headerWrap: {
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    minHeight: 56,
  },
  headerCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnStandalone: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    borderRadius: 20,
    borderWidth: 3,
    padding: 2,
  },
  dot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
  },
  notificationsOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
  },
  overlayCard: {
    padding: 12,
  },
  searchBarContainer: {
    borderWidth: 1,
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBarIcon: {
    marginLeft: 8,
  },
  searchBarInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  searchBarInputText: {
    fontSize: 15,
  },
  searchBarClear: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notif: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  navWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1000,
  },
  navBlurBackground: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 0,
    width: "100%",
  },
  navContent: {
    paddingHorizontal: 0,
  },
  navCard: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 0,
    borderWidth: 0,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  tabBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  menuAction: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  accountModal: {
    position: "absolute",
    width: 200,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    zIndex: 1000,
  },
})

