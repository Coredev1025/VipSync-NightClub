import * as Clipboard from "expo-clipboard"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import {
    ArrowLeft,
    Bell,
    ChevronRight,
    Copy,
    Gift,
    HelpCircle,
    Loader2,
    LogOut,
    Mail,
    Settings,
    Share2,
    Shield,
    User,
    X,
    Zap,
} from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { ModalCard, ModalSheet } from "@/components/ui/modal"
import { ProfileAvatar } from "@/components/ui/neon-avatar"
import { useToast } from "@/hooks/use-toast"
import { images, resolveAvatar } from "@/lib/assets"
import { getProfile, patchProfile } from "@/lib/profile-sync"
import { useTheme } from "@/theme/theme-provider"

type GuestSettingsSection = "account" | "notifications" | "privacy" | "help"

interface GuestAccountData {
  displayName: string
  email: string
  phone: string
  avatarUri?: string
}

const DEFAULT_GUEST_ACCOUNT: GuestAccountData = {
  displayName: "Guest User",
  email: "",
  phone: "",
  avatarUri: "",
}

interface GuestNotificationPrefs {
  push: boolean
  sound: boolean
}

const DEFAULT_GUEST_NOTIFICATIONS: GuestNotificationPrefs = {
  push: true,
  sound: true,
}

interface GuestPrivacyPrefs {
  profileVisible: boolean
}

const DEFAULT_GUEST_PRIVACY: GuestPrivacyPrefs = { profileVisible: true }

const menuItems: Array<{
  key: GuestSettingsSection
  icon: React.ReactNode
  label: string
  color: "cyan" | "pink" | "green" | "orange"
}> = [
  { key: "account", icon: <Settings size={18} />, label: "Account Settings", color: "cyan" },
  { key: "notifications", icon: <Bell size={18} />, label: "Notifications", color: "pink" },
  { key: "privacy", icon: <Shield size={18} />, label: "Privacy & Security", color: "green" },
  { key: "help", icon: <HelpCircle size={18} />, label: "Help & Support", color: "orange" },
]

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

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "GU"
}

export function GuestAccountTab({ onLogout }: { onLogout?: () => void }) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [heroName, setHeroName] = React.useState<string>(DEFAULT_GUEST_ACCOUNT.displayName)
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [settingsSection, setSettingsSection] = React.useState<GuestSettingsSection>("account")

  const openSettings = React.useCallback((section: GuestSettingsSection) => {
    setSettingsSection(section)
    setSettingsOpen(true)
  }, [])

  const closeSettings = React.useCallback(() => setSettingsOpen(false), [])

  React.useEffect(() => {
    let isMounted = true
    getProfile()
      .then((profile) => {
        if (!isMounted || !profile) return
        const settings = profile.settings_account as Partial<GuestAccountData> | undefined
        const nameFromSettings = (settings?.displayName as string | undefined)?.trim()
        const nameFromProfile = (profile.name as string | undefined)?.trim()
        const nextName = nameFromSettings || nameFromProfile || DEFAULT_GUEST_ACCOUNT.displayName
        setHeroName(nextName)
      })
      .catch(() => {
        if (!isMounted) return
        setHeroName(DEFAULT_GUEST_ACCOUNT.displayName)
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 22 }}>
        {/* Hero - same structure as pro profile */}
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
          </MotiView>

          <View style={{ paddingHorizontal: 16, marginTop: -68 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
              <ProfileAvatar
                source={resolveAvatar("/images/avatars/man1.png")}
                fallback="GU"
                glow="pink"
              />
              <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 200 }}
                style={{ flex: 1, paddingBottom: 10 }}
              >
                <Text
                  style={{
                    color: theme.colors.foreground,
                    fontSize: 24,
                    fontFamily: "Orbitron_900Black",
                  }}
                >
                  {heroName}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: `${theme.colors.neonCyan}22`,
                        borderColor: `${theme.colors.neonCyan}55`,
                      },
                    ]}
                  >
                    <User size={12} color={theme.colors.neonCyan} />
                    <Text
                      style={{
                        color: theme.colors.neonCyan,
                        fontFamily: "Orbitron_900Black",
                        fontSize: 12,
                      }}
                    >
                      Guest
                    </Text>
                  </View>
                </View>
              </MotiView>
            </View>
          </View>
        </View>

        {/* Settings section - like pro profile */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 140 }}
          style={{ paddingHorizontal: 16, marginTop: 18 }}
        >
          <Text
            style={{
              color: theme.colors.foreground,
              fontSize: 16,
              fontFamily: "Orbitron_900Black",
              marginBottom: 10,
            }}
          >
            Settings
          </Text>
          <Card variant="glass" style={{ overflow: "hidden" }}>
            {menuItems.map((item, idx) => (
              <MotiView
                key={item.key}
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 180 + idx * 60 }}
              >
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
                        ? React.cloneElement(item.icon as React.ReactElement<{ color?: string }>, {
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
                  <Text
                    style={{
                      color: theme.colors.foreground,
                      fontFamily: "Orbitron_800ExtraBold",
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </Text>
                  <ChevronRight size={16} color={theme.colors.mutedForeground} />
                </Pressable>
              </MotiView>
            ))}
          </Card>
        </MotiView>

        {/* Invite / Share - like pro profile */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 360 }}
          style={{ paddingHorizontal: 16, marginTop: 16 }}
        >
          <Card
            variant="glass"
            style={{ padding: 16, borderColor: `${theme.colors.neonPink}55`, overflow: "hidden" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[styles.giftTile, { borderColor: `${theme.colors.neonPink}66` }]}>
                <Gift size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.foreground,
                    fontSize: 16,
                    fontFamily: "Orbitron_900Black",
                  }}
                >
                  Invite Friends
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
                  Share VIPsync with friends
                </Text>
              </View>
              <HapticPressable
                neonBorder
                borderColor={`${theme.colors.neonPink}AA`}
                style={[styles.iconPill, { backgroundColor: `${theme.colors.neonPink}22` }]}
                onPress={() => toast({ title: "Share", description: "Share link copied." })}
              >
                <Share2 size={18} color={theme.colors.neonPink} />
              </HapticPressable>
            </View>
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync("VIPSYNC-GUEST")
                toast({ title: "Copied", description: "Code copied to clipboard." })
              }}
              style={({ pressed }) => [
                styles.codeRow,
                {
                  backgroundColor: pressed ? `${theme.colors.neonPurple}33` : `${theme.colors.border}cc`,
                  borderWidth: 1,
                  borderColor: `${theme.colors.neonPurple}44`,
                },
              ]}
            >
              <Text
                style={{
                  color: `${theme.colors.neonPurple}ee`,
                  fontFamily: "Orbitron_900Black",
                }}
              >
                VIPSYNC-GUEST
              </Text>
              <Copy size={16} color={`${theme.colors.neonPurple}aa`} />
            </Pressable>
          </Card>
        </MotiView>

        {/* Log out */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 500 }}
          style={{ paddingHorizontal: 16, marginTop: 16 }}
        >
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
      </ScrollView>

      <ModalSheet open={settingsOpen} onClose={closeSettings} maxHeightPct={1} showHeader={false}>
        <GuestSettingsSheetContent
          section={settingsSection}
          onClose={closeSettings}
          onBack={closeSettings}
          toast={toast}
          insets={insets}
        />
      </ModalSheet>

      <ModalCard open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}>
        <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 16 }}>
          Confirm Logout
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, marginTop: 8, lineHeight: 18 }}>
          Are you sure you want to log out? You&apos;ll need to sign in again to access your account.
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Button
            variant="outline"
            tone="neutral"
            style={{ flex: 1 }}
            onPress={() => setShowLogoutConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            tone="destructive"
            style={{ flex: 1 }}
            onPress={() => {
              setShowLogoutConfirm(false)
              if (onLogout) {
                onLogout()
              } else {
                toast({ title: "Signed out", description: "Guest session cleared." })
              }
            }}
          >
            Log Out
          </Button>
        </View>
      </ModalCard>
    </View>
  )
}

const SECTION_TITLES: Record<GuestSettingsSection, string> = {
  account: "Account Settings",
  notifications: "Notifications",
  privacy: "Privacy & Security",
  help: "Help & Support",
}

const SECTION_HEADER_ICONS: Record<GuestSettingsSection, React.ReactNode> = {
  account: <Settings size={20} />,
  notifications: <Bell size={20} />,
  privacy: <Shield size={20} />,
  help: <HelpCircle size={20} />,
}

function GuestSettingsSheetContent({
  section,
  onClose,
  onBack,
  toast,
  insets,
}: {
  section: GuestSettingsSection
  onClose: () => void
  onBack: () => void
  toast: (opts: { title: string; description?: string }) => void
  insets: { top: number; bottom: number }
}) {
  const { theme } = useTheme()
  const title = SECTION_TITLES[section]
  const HeaderIcon = SECTION_HEADER_ICONS[section]
  const iconColor =
    section === "account"
      ? theme.colors.neonCyan
      : section === "notifications"
        ? theme.colors.neonPink
        : section === "privacy"
          ? theme.colors.neonGreen
          : theme.colors.neonOrange

  return (
    <View style={{ flex: 1, minHeight: 300, paddingBottom: insets.bottom + 16 }}>
      <View
        style={[
          styles.settingsHeader,
          { paddingTop: Math.max(insets.top, 12), borderBottomColor: theme.colors.border },
        ]}
      >
        <HapticPressable onPress={onBack} style={styles.settingsBack} accessibilityLabel="Back">
          <ArrowLeft size={22} color={theme.colors.foreground} />
        </HapticPressable>
        <View style={styles.settingsTitleRow}>
          {React.isValidElement(HeaderIcon)
            ? React.cloneElement(HeaderIcon as React.ReactElement<{ color?: string }>, {
                color: iconColor,
              })
            : HeaderIcon}
          <Text
            style={[styles.settingsTitle, { color: theme.colors.foreground }]}
            numberOfLines={1}
          >
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
        {section === "account" && <GuestAccountSettingsContent toast={toast} />}
        {section === "notifications" && <GuestNotificationsContent />}
        {section === "privacy" && <GuestPrivacyContent toast={toast} />}
        {section === "help" && <GuestHelpContent />}
      </ScrollView>
    </View>
  )
}

async function loadGuestAccount(): Promise<GuestAccountData> {
  const profile = await getProfile()
  const fromApi = profile?.settings_account as Partial<GuestAccountData> | undefined
  if (fromApi && typeof fromApi === "object") {
    return {
      displayName: (fromApi.displayName as string) ?? DEFAULT_GUEST_ACCOUNT.displayName,
      email: (fromApi.email as string) ?? "",
      phone: (fromApi.phone as string) ?? "",
      avatarUri: (fromApi.avatarUri as string) ?? "",
    }
  }
  return { ...DEFAULT_GUEST_ACCOUNT }
}

function GuestAccountSettingsContent({
  toast,
}: {
  toast: (opts: { title: string; description?: string }) => void
}) {
  const { theme } = useTheme()
  const [displayName, setDisplayName] = React.useState(DEFAULT_GUEST_ACCOUNT.displayName)
  const [phone, setPhone] = React.useState(DEFAULT_GUEST_ACCOUNT.phone)
  const [avatarUri, setAvatarUri] = React.useState<string>(DEFAULT_GUEST_ACCOUNT.avatarUri ?? "")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true
    loadGuestAccount().then((data) => {
      if (!isMounted) return
      setDisplayName(data.displayName)
      setPhone(data.phone ?? "")
      setAvatarUri(data.avatarUri ?? "")
    })
    return () => {
      isMounted = false
    }
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
    const payload = {
      displayName: displayName.trim() || "Guest User",
      phone: phone.trim(),
      avatarUri: avatarUri.trim(),
    }
    try {
      await patchProfile({ settings_account: payload })
      toast({ title: "Saved", description: "Account settings updated." })
    } catch (_) {
      toast({ title: "Error", description: "Could not save settings." })
    } finally {
      setTimeout(() => setSaving(false), 3000)
    }
  }, [displayName, phone, avatarUri, toast])

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
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: `${theme.colors.neonPink}18` },
                  ]}
                >
                  <Text
                    style={[styles.avatarPlaceholderInitials, { color: theme.colors.mutedForeground }]}
                  >
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
            </View>
          </HapticPressable>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={[styles.settingsLabel, { color: theme.colors.mutedForeground }]}>
          Display name
        </Text>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          containerStyle={{ borderColor: theme.colors.border }}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={[styles.settingsLabel, { color: theme.colors.mutedForeground }]}>Phone</Text>
        <Input
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
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

async function loadGuestNotificationPrefs(): Promise<GuestNotificationPrefs> {
  const profile = await getProfile()
  const fromApi = profile?.settings_notifications as Partial<GuestNotificationPrefs> | undefined
  if (fromApi && typeof fromApi === "object") {
    return { ...DEFAULT_GUEST_NOTIFICATIONS, ...fromApi }
  }
  return { ...DEFAULT_GUEST_NOTIFICATIONS }
}

function GuestNotificationsContent() {
  const { theme } = useTheme()
  const [prefs, setPrefs] = React.useState<GuestNotificationPrefs>(DEFAULT_GUEST_NOTIFICATIONS)

  React.useEffect(() => {
    let isMounted = true
    loadGuestNotificationPrefs().then((data) => {
      if (!isMounted) return
      setPrefs(data)
    })
    return () => {
      isMounted = false
    }
  }, [])

  const update = React.useCallback(async (key: keyof GuestNotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try {
      await patchProfile({ settings_notifications: next })
    } catch (_) {}
  }, [prefs])

  const row = (
    label: string,
    key: keyof GuestNotificationPrefs,
    icon: React.ReactNode
  ) => (
    <View key={key} style={[styles.settingsSwitchRow, { borderBottomColor: theme.colors.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {icon}
        <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 14 }}>
          {label}
        </Text>
      </View>
      <Switch
        value={prefs[key]}
        onValueChange={(v) => update(key, v)}
        trackColor={{ false: theme.colors.muted, true: `${theme.colors.neonPink}88` }}
        thumbColor={prefs[key] ? theme.colors.neonPink : theme.colors.mutedForeground}
      />
    </View>
  )

  return (
    <View style={{ gap: 0 }}>
      <Text style={[styles.settingsHint, { color: theme.colors.mutedForeground }]}>
        Choose how you want to be notified.
      </Text>
      {row("Push notifications", "push", <Bell size={18} color={theme.colors.neonPink} />)}
      {row("Sound", "sound", <Zap size={18} color={theme.colors.neonOrange} />)}
    </View>
  )
}

async function loadGuestPrivacyPrefs(): Promise<GuestPrivacyPrefs> {
  const profile = await getProfile()
  const fromApi = profile?.settings_privacy as Partial<GuestPrivacyPrefs> | undefined
  if (fromApi && typeof fromApi === "object") {
    return { ...DEFAULT_GUEST_PRIVACY, ...fromApi }
  }
  return { ...DEFAULT_GUEST_PRIVACY }
}

function GuestPrivacyContent({
  toast,
}: {
  toast: (opts: { title: string }) => void
}) {
  const { theme } = useTheme()
  const [prefs, setPrefs] = React.useState<GuestPrivacyPrefs>(DEFAULT_GUEST_PRIVACY)

  React.useEffect(() => {
    let isMounted = true
    loadGuestPrivacyPrefs().then((data) => {
      if (!isMounted) return
      setPrefs(data)
    })
    return () => {
      isMounted = false
    }
  }, [])

  const update = React.useCallback(async (key: keyof GuestPrivacyPrefs, value: boolean) => {
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

function GuestHelpContent() {
  const { theme } = useTheme()
  const appVersion = "1.0.0"

  return (
    <View style={{ gap: 16 }}>
      <Text style={[styles.settingsHint, { color: theme.colors.mutedForeground }]}>
        Get help and learn more about VIPsync.
      </Text>
      <Card variant="glass" style={{ padding: 16, borderColor: `${theme.colors.border}99` }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 14 }}>
            App version
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>{appVersion}</Text>
        </View>
      </Card>
      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [
          styles.helpRow,
          {
            borderColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.muted : "transparent",
          },
        ]}
      >
        <HelpCircle size={18} color={theme.colors.neonOrange} />
        <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", flex: 1 }}>
          FAQ & Help center
        </Text>
        <ChevronRight size={16} color={theme.colors.mutedForeground} />
      </Pressable>
      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [
          styles.helpRow,
          {
            borderColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.muted : "transparent",
          },
        ]}
      >
        <Mail size={18} color={theme.colors.neonCyan} />
        <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", flex: 1 }}>
          Contact support
        </Text>
        <ChevronRight size={16} color={theme.colors.mutedForeground} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  giftTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
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
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
  },
  settingsHint: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  settingsSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatarSettingRow: {
    alignItems: "center",
  },
  avatarTouchArea: {
    position: "relative",
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 3,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderInitials: {
    position: "absolute",
    fontSize: 28,
    fontFamily: "Orbitron_800ExtraBold",
  },
})
