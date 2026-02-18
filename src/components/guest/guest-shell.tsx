import { CheckCircle, LogOut, Map, MessageSquare, Search, Sparkles, User, X } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
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

import type { GuestTabId } from "@/components/guest/guest-types"
// Guest pages: all tab content from guest/tabs
import { GuestAccountTab } from "@/components/guest/tabs/guest-account-tab"
import { GuestHomeTab } from "@/components/guest/tabs/guest-home-tab"
import { ChatsTab, MapTab } from "@/components/tabs"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { VIPsyncLogoCompact } from "@/components/ui/vipsync-logo"
import { useResponsive } from "@/hooks/use-responsive"
import { resolveAvatar } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

const tabs = [
  { id: "home" as const, label: "Home", icon: Sparkles },
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "map" as const, label: "Map", icon: Map },
  { id: "account" as const, label: "Me", icon: User },
]

// Tab button with width spacing like pro mode (70 inactive / 100 active)
function GuestTabButton({
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
  const width = useSharedValue(isActive ? 100 : 70)

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
            {badge != null && badge > 0 ? (
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

export interface GuestShellProps {
  /** When provided (e.g. signed-in user mode), sign out clears auth and returns to login */
  onLogout?: () => void
}

export function GuestShell({ onLogout }: GuestShellProps = {}) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { horizontalPadding } = useResponsive()

  const [activeTab, setActiveTab] = React.useState<GuestTabId>("home")
  const [showSearch, setShowSearch] = React.useState(false)
  const [showGuestMenu, setShowGuestMenu] = React.useState(false)
  const avatarRef = React.useRef<View>(null)

  const openGuestMenu = React.useCallback(() => {
    setShowGuestMenu(true)
  }, [])

  const closeGuestMenu = React.useCallback(() => {
    setShowGuestMenu(false)
  }, [])

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <GuestHomeTab />
      case "chat":
        return <ChatsTab userMode />
      case "map":
        return <MapTab guestMode />
      case "account":
        return <GuestAccountTab onLogout={onLogout} />
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Ambient blobs */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <MotiView
          from={{ translateX: 0, translateY: 0, scale: 1, opacity: 0.16 }}
          animate={{ translateX: 28, translateY: 18, scale: 1.1, opacity: 0.22 }}
          transition={{ type: "timing", duration: 9000, loop: true }}
          style={[
            styles.blob,
            { top: -60, left: -60, backgroundColor: `${theme.colors.neonPink}22` },
          ]}
        />
        <MotiView
          from={{ translateX: 0, translateY: 0, scale: 1.1, opacity: 0.14 }}
          animate={{ translateX: -28, translateY: -16, scale: 1, opacity: 0.22 }}
          transition={{ type: "timing", duration: 9000, loop: true, delay: 4500 }}
          style={[
            styles.blob,
            { bottom: -70, right: -70, backgroundColor: `${theme.colors.neonCyan}22` },
          ]}
        />
      </View>

      {/* Header - Fixed at top, same style as pro mode */}
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

              <View ref={avatarRef}>
                <HapticPressable
                  onPress={openGuestMenu}
                  style={styles.avatarBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Guest menu"
                >
                  <View style={[styles.avatarWrapper, { borderColor: `${theme.colors.neonPink}cc` }]}>
                    <NeonAvatar
                      source={resolveAvatar("/images/avatars/man1.png")}
                      fallback="GU"
                      size="sm"
                      glow="pink"
                      showRing
                    />
                  </View>
                </HapticPressable>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Guest menu dropdown - fixed just below header to remove gap */}
      {showGuestMenu && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 200 }]}
            onPress={closeGuestMenu}
            accessibilityLabel="Close guest menu"
            accessibilityRole="button"
          />
          <Animated.View
            entering={FadeIn.duration(150).springify()}
            exiting={FadeOut.duration(100)}
            style={[
              styles.guestMenuDropdown,
              {
                position: "absolute",
                top: Math.max(insets.top, 0) + 56,
                right: horizontalPadding + 16,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                zIndex: 201,
                paddingTop: 4,
              },
            ]}
            pointerEvents="box-none"
          >
            <Text style={[styles.guestMenuTitle, { color: theme.colors.foreground }]}>
              Guest menu
            </Text>
            <View style={styles.guestMenuActions}>
              <HapticPressable
                onPress={() => {
                  closeGuestMenu()
                  setActiveTab("account")
                }}
                neonBorder
                borderColor={`${theme.colors.neonPink}AA`}
                style={[styles.menuAction, { backgroundColor: theme.colors.muted }]}
              >
                <User size={18} color={theme.colors.mutedForeground} />
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold" }}>Account</Text>
              </HapticPressable>
              <HapticPressable
                onPress={() => {
                  closeGuestMenu()
                  if (onLogout) {
                    onLogout()
                  } else {
                    setActiveTab("home")
                  }
                }}
                neonBorder
                borderColor="#ff3b30AA"
                style={[styles.menuAction, { backgroundColor: "rgba(255,59,48,0.10)" }]}
              >
                <LogOut size={18} color="#ff3b30" />
                <Text style={{ color: "#ff3b30", fontFamily: "Orbitron_900Black" }}>
                  {onLogout ? "Sign out" : "Clear session"}
                </Text>
              </HapticPressable>
            </View>
          </Animated.View>
        </>
      )}

      {/* Main content - reserve space for header + bottom nav + safe area, same animation as pro mode */}
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

      {/* Bottom navigation - Fixed at bottom, same style as pro mode */}
      <View
        style={[
          styles.navWrap,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.navBlurBackground,
            {
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <View style={styles.navContent}>
            <View style={styles.navCard}>
              <View style={styles.navRow}>
                {tabs.map((t, index) => (
                  <GuestTabButton
                    key={t.id}
                    isActive={t.id === activeTab}
                    icon={t.icon}
                    label={t.label}
                    badge={undefined}
                    onPress={() => setActiveTab(t.id)}
                    theme={theme}
                    delay={index * 60}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Search overlay - same style as pro mode */}
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
                <Search size={18} color={theme.colors.mutedForeground} style={styles.searchBarIcon} />
                <Input
                  placeholder="Search events, tables, info..."
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
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  iconBtnStandalone: {
    width: 40,
    height: 40,
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
  searchOverlay: {
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
    borderRadius: 20,
    overflow: "hidden",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  searchBarIcon: {
    marginLeft: 6,
  },
  searchBarInput: {
    flex: 1,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  searchBarInputText: {
    fontSize: 14,
  },
  searchBarClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
  guestMenuDropdown: {
    position: "absolute",
    minWidth: 220,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  guestMenuTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 16,
    marginBottom: 12,
  },
  guestMenuActions: {
    gap: 10,
  },
})

