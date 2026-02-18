import * as Clipboard from "expo-clipboard"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import {
    ArrowLeft,
    Building2,
    Camera,
    ChevronRight,
    Copy,
    Crown,
    Gift,
    Loader2,
    LogOut,
    MapPin,
    Settings,
    Share2,
    Shield,
    Sparkles,
    Star,
    Table,
    TrendingUp,
    Trophy,
    User,
    Users,
    Wine,
    X,
    Zap,
} from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { ModalCard, ModalSheet } from "@/components/ui/modal"
import { ProfileAvatar } from "@/components/ui/neon-avatar"
import { useToast } from "@/hooks/use-toast"
import { images, resolveAvatar } from "@/lib/assets"
import { api, isApiConnected } from "@/lib/api"
import { formatNumber } from "@/lib/utils"
import { getProfile, patchProfile } from "@/lib/profile-sync"
import { uploadAvatar } from "@/lib/upload-avatar"
import { useTheme } from "@/theme/theme-provider"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  color: "orange" | "pink" | "cyan"
}

const achievements: Achievement[] = [
  {
    id: "1",
    title: "Top Seller",
    description: "Sold 100+ tables this month",
    icon: <Trophy size={18} />,
    unlocked: true,
    color: "orange",
  },
  {
    id: "2",
    title: "Revenue King",
    description: "Generated $50K+ revenue",
    icon: <Crown size={18} />,
    unlocked: true,
    color: "pink",
  },
  {
    id: "3",
    title: "Night Owl",
    description: "Worked 20+ nights",
    icon: <Star size={18} />,
    unlocked: false,
    progress: 75,
    color: "cyan",
  },
]

type SettingsSection = "account" | "privacy" | "club"

const BASE_MENU_ITEMS: { key: SettingsSection; icon: React.ReactNode; label: string; badge?: string; color: "cyan" | "pink" | "green"; proOnly?: boolean; managerOnly?: boolean }[] = [
  { key: "account", icon: <Settings size={18} />, label: "Account Settings", color: "cyan" },
  { key: "privacy", icon: <Shield size={18} />, label: "Privacy & Security", color: "green" },
  { key: "club", icon: <Building2 size={18} />, label: "Manage Club Settings", color: "cyan", proOnly: true, managerOnly: true },
]

export interface ProfileTabProps {
  /** When true (pro/club staff mode), shows pro-only menu items that pass managerOnly filter */
  proMode?: boolean
  /** When false (owner or user mode), hides table sold, revenue, level progress, and achievements. */
  showProStats?: boolean
  /** When true (owner/manager only), shows Manage Club Settings. Door & promoter do not see it. */
  canManageClubSettings?: boolean
  onLogout?: () => void
}

export function ProfileTab({ proMode = true, showProStats = true, canManageClubSettings = false, onLogout }: ProfileTabProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { toast } = useToast()
  const [heroName, setHeroName] = React.useState<string>("")
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [settingsSection, setSettingsSection] = React.useState<SettingsSection>("account")

  const menuItems = React.useMemo(
    () =>
      BASE_MENU_ITEMS.filter(
        (item) => (!item.proOnly || proMode) && (!item.managerOnly || canManageClubSettings)
      ),
    [proMode, canManageClubSettings]
  )

  const openSettings = React.useCallback((section: SettingsSection) => {
    setSettingsSection(section)
    setSettingsOpen(true)
  }, [])

  const closeSettings = React.useCallback(() => setSettingsOpen(false), [])

  React.useEffect(() => {
    let isMounted = true
    getProfile()
      .then((profile) => {
        if (!isMounted || !profile) return
        const settings = profile.settings_account as Partial<AccountData> | undefined
        const nameFromSettings = (settings?.displayName as string | undefined)?.trim()
        const nameFromProfile = (profile.name as string | undefined)?.trim()
        const nextName = nameFromSettings || nameFromProfile || ""
        setHeroName(nextName)
      })
      .catch(() => {
        if (!isMounted) return
        setHeroName("")
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Ops quick-stats (same as Ops tab: Total Guests, Tables Sold, Bottles Sold)
  const [quickStats, setQuickStats] = React.useState<{
    totalGuests: number
    tablesSold: number
    bottlesSold: number
    avgStayMinutes: number
    avgSpendPerGuest: number
  } | null>(null)

  React.useEffect(() => {
    let isMounted = true
    if (!isApiConnected() || !showProStats) return

    api
      .get<{
        totalGuests: number
        tablesSold: number
        bottlesSold: number
        avgStayMinutes: number
        avgSpendPerGuest: number
      }>("/api/ops/quick-stats")
      .then((data) => {
        if (!isMounted || !data) return
        setQuickStats({
          totalGuests: data.totalGuests ?? 0,
          tablesSold: data.tablesSold ?? 0,
          bottlesSold: data.bottlesSold ?? 0,
          avgStayMinutes: data.avgStayMinutes ?? 0,
          avgSpendPerGuest: data.avgSpendPerGuest ?? 0,
        })
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [showProStats])

  const statsLoading = isApiConnected() && showProStats && !quickStats

  const totalGuestsValue =
    quickStats && typeof quickStats.totalGuests === "number"
      ? formatNumber(quickStats.totalGuests)
      : "—"
  const tablesSoldValue =
    quickStats && typeof quickStats.tablesSold === "number"
      ? formatNumber(quickStats.tablesSold)
      : "—"
  const bottlesSoldValue =
    quickStats && typeof quickStats.bottlesSold === "number"
      ? formatNumber(quickStats.bottlesSold)
      : "—"

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 22 }}>
      <View style={{ position: "relative" }}>
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 200, overflow: "hidden" }}>
          <Image 
            source={images.nightclubBg} 
            style={StyleSheet.absoluteFillObject} 
            contentFit="cover"
            cachePolicy="memory"
            priority="high"
          />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} />

          {Array.from({ length: 12 }).map((_, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0.25, translateY: 0, scale: 1 }}
              animate={{ opacity: 0.7, translateY: -18, scale: 1.4 }}
              transition={{ type: "timing", duration: 2200 + (i % 4) * 250, loop: true, delay: i * 140 }}
              style={[
                styles.particle,
                { left: `${(i * 17) % 100}%` as any, top: `${(i * 13) % 100}%` as any },
              ]}
            />
          ))}
        </MotiView>

        <View style={{ paddingHorizontal: 16, marginTop: -68 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
            <ProfileAvatar source={resolveAvatar("/images/avatars/man1.png")} fallback="JD" glow="pink" level={showProStats ? 3 : undefined} />
            <MotiView from={{ opacity: 0, translateX: -10 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 200 }} style={{ flex: 1, paddingBottom: 10 }}>
              <Text
                style={{
                  color: theme.colors.foreground,
                  fontSize: 24,
                  fontFamily: "Orbitron_900Black",
                }}
              >
                {heroName}
              </Text>
              {showProStats ? (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <View style={[styles.pill, { backgroundColor: `${theme.colors.neonPink}22`, borderColor: `${theme.colors.neonPink}55` }]}>
                    <Zap size={12} color={theme.colors.neonPink} />
                    <Text style={styles.pillText}>Elite Promoter</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: `${theme.colors.neonGreen}22`, borderColor: `${theme.colors.neonGreen}55` }]}>
                    <TrendingUp size={12} color={theme.colors.neonGreen} />
                    <Text style={[styles.pillText, { color: theme.colors.neonGreen }]}>Top 5%</Text>
                  </View>
                </View>
              ) : null}
            </MotiView>
          </View>
        </View>
      </View>

      {showProStats ? (
        <>
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 140 }} style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard icon={<Users size={18} color={theme.colors.neonCyan} />} label="Total Guests" value={totalGuestsValue} tone="cyan" flex={1} />
              <StatCard icon={<Table size={18} color={theme.colors.neonCyan} />} label="Tables Sold" value={tablesSoldValue} tone="cyan" flex={1} />
              <StatCard icon={<Wine size={18} color={theme.colors.neonPink} />} label="Bottles Sold" value={bottlesSoldValue} tone="pink" flex={1} />
            </View>
            {statsLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
                <ActivityIndicator size="small" color={theme.colors.neonCyan} />
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                  Loading your performance stats…
                </Text>
              </View>
            ) : null}
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 220 }} style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Card variant="glass" style={{ padding: 16, borderColor: `${theme.colors.neonPink}55`, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Trophy size={20} color={theme.colors.neonPink} />
                  <Text style={{ color: theme.colors.foreground, fontSize: 16, fontFamily: "Orbitron_900Black" }}>
                    Level Progress
                  </Text>
                </View>
                <Badge tone="cyan">Level 3 → 4</Badge>
              </View>

              <View style={{ height: 12, borderRadius: 999, overflow: "hidden", backgroundColor: `${theme.colors.muted}cc`, marginTop: 4 }}>
                <View style={{ width: "65%", height: "100%", backgroundColor: theme.colors.neonPink, borderRadius: 999 }} />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                  <Text style={{ color: theme.colors.neonGreen, fontSize: 14, fontFamily: "Orbitron_900Black" }}>65</Text>
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>/ 100 XP</Text>
                </View>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                  35 more tables to reach Level 4
                </Text>
              </View>
            </Card>
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300 }} style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <MotiView from={{ rotate: "0deg" }} animate={{ rotate: "360deg" }} transition={{ type: "timing", duration: 8000, loop: true }}>
                <Trophy size={18} color={theme.colors.neonOrange} />
              </MotiView>
              <Text style={{ color: theme.colors.foreground, fontSize: 16, fontFamily: "Orbitron_900Black" }}>
                Achievements
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {achievements.map((a, i) => (
                <AchievementRow key={a.id} achievement={a} index={i} />
              ))}
            </View>
          </MotiView>
        </>
      ) : null}

      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 360 }} style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Text style={{ color: theme.colors.foreground, fontSize: 16, fontFamily: "Orbitron_900Black", marginBottom: 10 }}>
          Settings
        </Text>
        <Card variant="glass" style={{ overflow: "hidden" }}>
          {menuItems.map((item, idx) => (
            <MotiView key={item.key} from={{ opacity: 0, translateX: -10 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 380 + idx * 60 }}>
              <Pressable
                onPress={() => openSettings(item.key)}
                style={({ pressed }) => [
                  styles.menuRow,
                  {
                    borderBottomColor: `${theme.colors.border}66`,
                    backgroundColor: pressed ? `${theme.colors.muted}aa` : "transparent",
                  },
                ]}
              >
                <View style={{ width: 28, alignItems: "center" }}>
                  <View style={{ opacity: 0.9 }}>
                    {React.isValidElement(item.icon)
                      ? React.cloneElement(item.icon as any, {
                          color:
                            item.color === "pink"
                              ? theme.colors.neonPink
                              : item.color === "cyan"
                                ? theme.colors.neonCyan
                                : item.color === "green"
                                  ? theme.colors.neonGreen
                                  : theme.colors.neonOrange,
                        })
                      : item.icon}
                  </View>
                </View>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", flex: 1 }}>
                  {item.label}
                </Text>
                {item.badge ? (
                  <View style={[styles.badgeBubble, { backgroundColor: theme.colors.neonPink }]}>
                    <Text style={{ color: "#fff", fontFamily: "Orbitron_900Black", fontSize: 11 }}>{item.badge}</Text>
                  </View>
                ) : null}
                <ChevronRight size={16} color={theme.colors.mutedForeground} />
              </Pressable>
            </MotiView>
          ))}
        </Card>
      </MotiView>

      <ModalSheet open={settingsOpen} onClose={closeSettings} maxHeightPct={1} showHeader={false}>
        <SettingsSheetContent
          section={settingsSection}
          onClose={closeSettings}
          onBack={closeSettings}
          toast={toast}
          insets={insets}
        />
      </ModalSheet>

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Card variant="glass" style={{ padding: 16, borderColor: `${theme.colors.neonPink}55`, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[styles.giftTile, { borderColor: `${theme.colors.neonPink}66` }]}>
              <Gift size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.foreground, fontSize: 16, fontFamily: "Orbitron_900Black" }}>
                Invite Friends
              </Text>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
                Earn 500 points per referral
              </Text>
            </View>
            <HapticPressable neonBorder borderColor={`${theme.colors.neonPink}AA`} style={[styles.iconPill, { backgroundColor: `${theme.colors.neonPink}22` }]} onPress={() => {}}>
              <Share2 size={18} color={theme.colors.neonPink} />
            </HapticPressable>
          </View>

          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync("VIPSYNC-JOHN2024")
            }}
            style={({ pressed }) => [
              styles.codeRow,
              { 
                backgroundColor: pressed 
                  ? `${theme.colors.neonPurple}33` 
                  : `${theme.colors.border}cc`,
                borderWidth: 1,
                borderColor: `${theme.colors.neonPurple}44`,
              },
            ]}
          >
            <Text style={{ color: `${theme.colors.neonPurple}ee`, fontFamily: "Orbitron_900Black" }}>VIPSYNC-JOHN2024</Text>
            <Copy size={16} color={`${theme.colors.neonPurple}aa`} />
          </Pressable>
        </Card>
      </View>

      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 500 }} style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Pressable
          onPress={() => setShowLogoutConfirm(true)}
          style={({ pressed }) => [
            styles.logout,
            {
              borderColor: "rgba(255,59,48,0.45)",
              backgroundColor: pressed ? "rgba(255,59,48,0.12)" : "transparent",
            },
          ]}
        >
          <LogOut size={18} color="#ff3b30" />
          <Text style={{ color: "#ff3b30", fontFamily: "Orbitron_900Black" }}>Log Out</Text>
        </Pressable>
      </MotiView>

      <ModalCard open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}>
        <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 16 }}>
          Confirm Logout
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, marginTop: 8, lineHeight: 18 }}>
          Are you sure you want to log out? You&apos;ll need to sign in again to access your account.
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Button variant="outline" tone="neutral" style={{ flex: 1 }} onPress={() => setShowLogoutConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            tone="destructive"
            style={{ flex: 1 }}
            onPress={() => {
              setShowLogoutConfirm(false)
              onLogout?.()
            }}
          >
            Log Out
          </Button>
        </View>
      </ModalCard>
      </ScrollView>
    </View>
  )
}

interface SettingsSheetContentProps {
  section: SettingsSection
  onClose: () => void
  onBack: () => void
  toast: (opts: { title: string; description?: string }) => void
  insets: { top: number; bottom: number }
}

const SETTINGS_TITLES: Record<SettingsSection, string> = {
  account: "Account Settings",
  privacy: "Privacy & Security",
  club: "Manage Club Settings",
}

const SETTINGS_HEADER_ICONS: Record<SettingsSection, React.ReactNode> = {
  account: <Settings size={20} />,
  privacy: <Shield size={20} />,
  club: <Building2 size={20} />,
}

function SettingsSheetContent({ section, onClose, onBack, toast, insets }: SettingsSheetContentProps) {
  const { theme } = useTheme()
  const title = SETTINGS_TITLES[section]
  const HeaderIcon = SETTINGS_HEADER_ICONS[section]
  const iconColor =
    section === "account" || section === "club"
      ? theme.colors.neonCyan
      : theme.colors.neonGreen

  return (
    <View style={{ flex: 1, minHeight: 300, paddingBottom: insets.bottom + 16 }}>
      <View style={[styles.settingsHeader, { paddingTop: Math.max(insets.top, 12), borderBottomColor: theme.colors.border }]}>
        <HapticPressable onPress={onBack} style={styles.settingsBack} accessibilityLabel="Back">
          <ArrowLeft size={22} color={theme.colors.foreground} />
        </HapticPressable>
        <View style={styles.settingsTitleRow}>
          {React.isValidElement(HeaderIcon) ? React.cloneElement(HeaderIcon as React.ReactElement<{ color?: string }>, { color: iconColor }) : HeaderIcon}
          <Text style={[styles.settingsTitle, { color: theme.colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <HapticPressable onPress={onClose} style={styles.settingsBack} accessibilityLabel="Close">
          <X size={22} color={theme.colors.foreground} />
        </HapticPressable>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {section === "account" && <AccountSettingsContent toast={toast} />}
        {section === "privacy" && <PrivacySettingsContent toast={toast} />}
        {section === "club" && <ClubSettingsContent toast={toast} />}
      </ScrollView>
    </View>
  )
}

interface AccountData {
  displayName: string
  email: string
  avatarUri?: string
}

async function loadAccountSettings(): Promise<AccountData> {
  const profile = await getProfile()
  const fromApi = profile?.settings_account as Partial<AccountData> | undefined
  const displayName =
    (fromApi?.displayName as string | undefined)?.trim() ||
    (profile?.name as string | undefined)?.trim() ||
    ""
  const email = (fromApi?.email as string | undefined) ?? (profile?.email as string | undefined) ?? ""
  const avatarUri = (fromApi?.avatarUri as string | undefined) ?? ""
  return { displayName, email, avatarUri }
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"
}

function AnimatedLoaderIcon() {
  const rotation = useSharedValue(0)
  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 800 }), -1, false)
    return () => {
      rotation.value = 0
    }
  }, [rotation])
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))
  return (
    <Animated.View style={animatedStyle}>
      <Loader2 size={22} color="#fff" />
    </Animated.View>
  )
}

function AccountSettingsContent({ toast }: { toast: (opts: { title: string; description?: string }) => void }) {
  const { theme } = useTheme()
  const [displayName, setDisplayName] = React.useState("")
  const [avatarUri, setAvatarUri] = React.useState<string>("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true
    loadAccountSettings().then((data) => {
      if (!isMounted) return
      setDisplayName(data.displayName)
      setAvatarUri(data.avatarUri ?? "")
    })
    return () => { isMounted = false }
  }, [])

  const pickAvatar = React.useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        toast({ title: "Permission needed", description: "Allow photo access to change avatar." })
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (!result.canceled && result.assets[0]?.uri) setAvatarUri(result.assets[0].uri)
    } catch (_) {
      toast({ title: "Error", description: "Could not open photo library." })
    }
  }, [toast])

  const handleSave = React.useCallback(async () => {
    setSaving(true)
    let finalAvatarUri = avatarUri.trim()
    try {
      const profile = await getProfile()
      if (profile?.id && finalAvatarUri && (finalAvatarUri.startsWith("file://") || finalAvatarUri.startsWith("content://"))) {
        const uploadedUrl = await uploadAvatar(profile.id, finalAvatarUri)
        if (uploadedUrl) finalAvatarUri = uploadedUrl
      }
      const payload = {
        displayName: displayName.trim() || "",
        avatarUri: finalAvatarUri,
      }
      await patchProfile({
        ...(finalAvatarUri ? { picture: finalAvatarUri } : {}),
        settings_account: payload,
      })
      if (finalAvatarUri !== avatarUri) setAvatarUri(finalAvatarUri)
      toast({ title: "Saved", description: "Account settings updated." })
    } catch (_) {
      toast({ title: "Error", description: "Could not save settings." })
    } finally {
      setTimeout(() => setSaving(false), 3000)
    }
  }, [displayName, avatarUri, toast])

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 10 }}>
        <View style={styles.avatarSettingRow}>
          <HapticPressable onPress={pickAvatar} style={styles.avatarTouchArea}>
            <View style={[styles.avatarCircle, { borderColor: `${theme.colors.neonPurple}88` }]}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: `${theme.colors.neonPink}18` }]}>
                  <Camera size={40} color={`${theme.colors.neonPink}99`} strokeWidth={1.5} />
                  <Text style={[styles.avatarPlaceholderInitials, { color: theme.colors.mutedForeground }]}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.avatarCameraBadge, { backgroundColor: theme.colors.neonPink }]}>
              <Camera size={18} color="#fff" strokeWidth={2.5} />
            </View>
          </HapticPressable>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={[styles.settingsLabel, { color: theme.colors.mutedForeground }]}>Display name</Text>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          containerStyle={{ borderColor: theme.colors.border }}
        />
      </View>
      <Button
        variant="solid"
        tone="cyan"
        onPress={handleSave}
        disabled={saving}
        style={{ marginTop: 8 }}
      >
        {saving ? (
          <AnimatedLoaderIcon />
        ) : (
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Save changes</Text>
        )}
      </Button>
    </View>
  )
}

interface PrivacyPrefs {
  profileVisible: boolean
}

const DEFAULT_PRIVACY_PREFS: PrivacyPrefs = { profileVisible: true }

async function loadPrivacyPrefs(): Promise<PrivacyPrefs> {
  const profile = await getProfile()
  const fromApi = profile?.settings_privacy as Partial<PrivacyPrefs> | undefined
  if (fromApi && typeof fromApi === "object") {
    return { ...DEFAULT_PRIVACY_PREFS, ...fromApi }
  }
  return { ...DEFAULT_PRIVACY_PREFS }
}

function PrivacySettingsContent({ toast }: { toast: (opts: { title: string }) => void }) {
  const { theme } = useTheme()
  const [prefs, setPrefs] = React.useState<PrivacyPrefs>(DEFAULT_PRIVACY_PREFS)

  React.useEffect(() => {
    let isMounted = true
    loadPrivacyPrefs().then((data) => {
      if (!isMounted) return
      setPrefs(data)
    })
    return () => { isMounted = false }
  }, [])

  const update = React.useCallback(async (key: keyof PrivacyPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try {
      await patchProfile({ settings_privacy: next })
      toast({ title: "Updated" })
    } catch (_) {
      toast({ title: "Could not save" })
    }
  }, [prefs, toast])

  return (
    <View style={{ gap: 16 }}>
      <Text style={[styles.settingsHint, { color: theme.colors.mutedForeground }]}>
        Control your visibility and security options.
      </Text>
      <View style={[styles.settingsSwitchRow, { borderBottomColor: theme.colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <User size={18} color={theme.colors.neonGreen} />
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 14 }}>
            Profile visible to venues
          </Text>
        </View>
        <Switch
          value={prefs.profileVisible}
          onValueChange={(v) => update("profileVisible", v)}
          trackColor={{ false: theme.colors.muted, true: `${theme.colors.neonGreen}88` }}
          thumbColor={prefs.profileVisible ? theme.colors.neonGreen : theme.colors.mutedForeground}
        />
      </View>
    </View>
  )
}

interface ClubSettingsData {
  menuUrl: string
  floorPlanUri?: string
}

const DEFAULT_CLUB_SETTINGS: ClubSettingsData = { menuUrl: "https://tokyopearl.com/menu.pdf", floorPlanUri: "" }

async function loadClubSettings(): Promise<ClubSettingsData> {
  const profile = await getProfile()
  const fromApi = profile?.settings_club as Partial<ClubSettingsData> | undefined
  if (fromApi && typeof fromApi === "object") {
    return { ...DEFAULT_CLUB_SETTINGS, ...fromApi }
  }
  return { ...DEFAULT_CLUB_SETTINGS }
}

function ClubSettingsContent({ toast }: { toast: (opts: { title: string; description?: string }) => void }) {
  const { theme } = useTheme()
  const [menuUrl, setMenuUrl] = React.useState(DEFAULT_CLUB_SETTINGS.menuUrl)
  const [floorPlanUri, setFloorPlanUri] = React.useState<string>("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true
    loadClubSettings().then((data) => {
      if (!isMounted) return
      setMenuUrl(data.menuUrl)
      setFloorPlanUri(data.floorPlanUri ?? "")
    })
    return () => { isMounted = false }
  }, [])

  const handleScan = React.useCallback(() => {
    toast({ title: "Scan", description: "Menu URL / PDF scan would open here." })
  }, [toast])

  const handleUploadFloorPlan = React.useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        toast({ title: "Permission needed", description: "Allow photo access to upload floor plan." })
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      })
      if (!result.canceled && result.assets[0]?.uri) setFloorPlanUri(result.assets[0].uri)
    } catch (_) {
      toast({ title: "Error", description: "Could not open photo library." })
    }
  }, [toast])

  const handleSave = React.useCallback(async () => {
    setSaving(true)
    const payload = { menuUrl: menuUrl.trim() || DEFAULT_CLUB_SETTINGS.menuUrl, floorPlanUri: floorPlanUri.trim() || undefined }
    try {
      await patchProfile({ settings_club: payload })
      toast({ title: "Saved", description: "Club settings updated." })
    } catch (_) {
      toast({ title: "Error", description: "Could not save club settings." })
    } finally {
      setTimeout(() => setSaving(false), 800)
    }
  }, [menuUrl, floorPlanUri, toast])

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} color={theme.colors.neonCyan} />
          <Text style={{ color: theme.colors.neonCyan, fontFamily: "Orbitron_800ExtraBold", fontSize: 14 }}>
            GEMINI MENU IMPORT
          </Text>
        </View>
        <Text style={[styles.settingsLabel, { color: theme.colors.mutedForeground }]}>MENU URL OR PDF LINK</Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Input
            value={menuUrl}
            onChangeText={setMenuUrl}
            placeholder="https://..."
            containerStyle={{ flex: 1, borderColor: theme.colors.border }}
          />
          <Button variant="solid" tone="cyan" onPress={handleScan} style={{ minWidth: 80 }}>
            <Text style={{ color: "#fff", fontFamily: "Orbitron_700Bold", fontSize: 12 }}>SCAN</Text>
          </Button>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ color: theme.colors.neonCyan, fontFamily: "Orbitron_800ExtraBold", fontSize: 14 }}>
          FLOOR MAP
        </Text>
        <HapticPressable
          onPress={handleUploadFloorPlan}
          style={[
            styles.clubFloorUpload,
            {
              borderColor: `${theme.colors.neonCyan}55`,
              backgroundColor: `${theme.colors.neonCyan}11`,
            },
          ]}
        >
          {floorPlanUri ? (
            <Image source={{ uri: floorPlanUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            <>
              <MapPin size={40} color={theme.colors.neonCyan} />
              <Text style={{ color: theme.colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 8 }}>
                Upload Floor Plan
              </Text>
            </>
          )}
        </HapticPressable>
      </View>

      <Button
        variant="solid"
        tone="green"
        onPress={handleSave}
        disabled={saving}
        style={{ marginTop: 8 }}
      >
        {saving ? (
          <AnimatedLoaderIcon />
        ) : (
          <Text style={{ color: "#fff", fontFamily: "Orbitron_700Bold", fontSize: 14 }}>SAVE CLUB SETTINGS</Text>
        )}
      </Button>
    </View>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone,
  trend,
  flex: flexRatio = 1,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "pink" | "cyan" | "green"
  trend?: string
  flex?: number
}) {
  const { theme } = useTheme()
  const toneColor =
    tone === "pink" ? theme.colors.neonPink : tone === "green" ? theme.colors.neonGreen : theme.colors.neonCyan

  return (
    <Card
      variant="glass"
      style={{
        flex: flexRatio,
        height: 120,
        padding: 12,
        borderColor: `${toneColor}44`,
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ opacity: 0.95 }}>{icon}</View>
        {trend ? (
          <Text style={{ color: theme.colors.neonGreen, fontSize: 10, fontFamily: "Orbitron_900Black", includeFontPadding: false, lineHeight: 12 }}>
            {trend}
          </Text>
        ) : null}
      </View>
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <Text
          style={{ color: toneColor, fontSize: 18, fontFamily: "Orbitron_900Black", includeFontPadding: false, lineHeight: 20 }}
          numberOfLines={1}
          minimumFontScale={0.7}
        >
          {value}
        </Text>
        <Text
          style={{ color: theme.colors.mutedForeground, fontSize: 10, fontFamily: "Orbitron_700Bold", marginTop: 4, includeFontPadding: false, lineHeight: 12 }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Card>
  )
}

function AchievementRow({ achievement, index }: { achievement: Achievement; index: number }) {
  const { theme } = useTheme()
  const toneColor =
    achievement.color === "orange"
      ? theme.colors.neonOrange
      : achievement.color === "pink"
        ? theme.colors.neonPink
        : theme.colors.neonCyan

  return (
    <MotiView from={{ opacity: 0, translateX: -12 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 260 + index * 80 }}>
      <Card variant="glass" style={{ padding: 14, borderColor: achievement.unlocked ? `${toneColor}66` : theme.colors.border }}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={[styles.achIcon, { backgroundColor: achievement.unlocked ? `${toneColor}22` : theme.colors.muted, borderColor: achievement.unlocked ? `${toneColor}55` : theme.colors.border }]}>
            {React.isValidElement(achievement.icon)
              ? React.cloneElement(achievement.icon as any, { color: achievement.unlocked ? toneColor : theme.colors.mutedForeground })
              : achievement.icon}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }}>{achievement.title}</Text>
              {achievement.unlocked ? <Badge tone={achievement.color === "orange" ? "orange" : achievement.color === "pink" ? "pink" : "cyan"}>Unlocked</Badge> : null}
            </View>
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
              {achievement.description}
            </Text>
            {typeof achievement.progress === "number" && !achievement.unlocked ? (
              <View style={{ height: 8, borderRadius: 999, overflow: "hidden", backgroundColor: `${theme.colors.muted}cc`, marginTop: 10 }}>
                <View style={{ width: `${achievement.progress}%` as any, height: "100%", backgroundColor: theme.colors.neonCyan, borderRadius: 999 }} />
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  settingsBack: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  settingsTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 16,
    flexShrink: 1,
  },
  settingsLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  avatarSettingRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  avatarTouchArea: {
    position: "relative",
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  avatarPlaceholderInitials: {
    fontFamily: "Orbitron_800ExtraBold",
    fontSize: 20,
    letterSpacing: 1,
  },
  avatarCameraBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.4)",
  },
  settingsHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  settingsSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  clubFloorUpload: {
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: {
    color: "#fff",
    fontFamily: "Orbitron_900Black",
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 13,
  },
  menuRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
  },
  badgeBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  giftTile: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,33,182,0.22)",
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  codeRow: {
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logout: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  achIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})

