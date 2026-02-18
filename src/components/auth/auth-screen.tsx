import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import {
    ArrowRight,
    Briefcase,
    Camera,
    CheckCircle,
    ChevronLeft,
    Crown,
    DoorOpen,
    Gift,
    Shield,
    Sparkles,
    User,
    Users,
} from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native"
import Animated, {
    FadeIn,
    SlideInRight,
    SlideOutLeft,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated"

import { Button } from "@/components/ui/button"
import { VIPsyncLogo } from "@/components/ui/vipsync-logo"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useToast } from "@/hooks/use-toast"
import { images } from "@/lib/assets"
import { signInWithGoogle } from "@/lib/google-oauth"
import { getProfile } from "@/lib/profile-sync"
import { uploadAvatar } from "@/lib/upload-avatar"
import { useTheme } from "@/theme/theme-provider"

type AuthStep = "welcome" | "mode" | "role" | "profile"
export type UserRole = "promoter" | "door" | "manager" | "owner"
export type SignupMode = "pro" | "user"

interface RoleOption {
  id: UserRole
  title: string
  description: string
  icon: React.ReactNode
  glow: "pink" | "cyan" | "green" | "orange"
}

const roles: RoleOption[] = [
  {
    id: "promoter",
    title: "Promoter",
    description: "Bring guests, manage tables & earn commissions",
    icon: <Users size={22} />,
    glow: "pink",
  },
  {
    id: "door",
    title: "Door Staff",
    description: "Manage venue entry & operations",
    icon: <DoorOpen size={22} />,
    glow: "cyan",
  },
  {
    id: "manager",
    title: "Manager",
    description: "Oversee operations & team performance",
    icon: <Briefcase size={22} />,
    glow: "green",
  },
  {
    id: "owner",
    title: "Owner",
    description: "Full access to all venue controls",
    icon: <Crown size={22} />,
    glow: "orange",
  },
]

export interface AuthCompleteData {
  name: string
  picture?: string | null
  referralCode?: string
}

export interface AuthScreenProps {
  onComplete: (mode: SignupMode, proRole?: UserRole, profileData?: AuthCompleteData) => void
  /** When set (e.g. after Google OAuth), start at this step instead of welcome. */
  initialStep?: AuthStep
}

type GlowTone = "pink" | "cyan" | "green" | "orange" | "purple"

function getGlowColor(theme: ReturnType<typeof useTheme>["theme"], glow: GlowTone) {
  if (glow === "cyan") return theme.colors.neonCyan
  if (glow === "green") return theme.colors.neonGreen
  if (glow === "orange") return theme.colors.neonOrange
  if (glow === "purple") return theme.colors.neonPurple
  return theme.colors.neonPink
}

function roleToTone(role: UserRole): GlowTone {
  if (role === "door") return "cyan"
  if (role === "manager") return "green"
  if (role === "owner") return "orange"
  return "pink"
}

interface StepHeaderProps {
  glow: GlowTone
  icon: React.ReactNode
  title: string
  subtitle: string
}

function StepHeader({ glow, icon, title, subtitle }: StepHeaderProps) {
  const { theme } = useTheme()
  const glowColor = getGlowColor(theme, glow)

  return (
    <View style={styles.center}>
      <View
        style={[
          styles.iconTile,
          {
            borderColor: `${glowColor}88`,
            backgroundColor: `${glowColor}22`,
          },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.h2, { color: theme.colors.foreground }]}>{title}</Text>
      <Text style={[styles.p, { color: theme.colors.mutedForeground }]}>{subtitle}</Text>
    </View>
  )
}

interface ProfileHaloProps {
  glow?: GlowTone
  avatarUri?: string | null
  onPress?: () => void
}

function ProfileHalo({ glow = "pink", avatarUri, onPress }: ProfileHaloProps) {
  const { theme } = useTheme()
  const glowColor = getGlowColor(theme, glow)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Select profile picture"
      style={({ pressed }) => [
        styles.haloOuter,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.haloRing, { borderColor: glowColor, borderWidth: 2 }]}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.haloInner}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.haloInner, { backgroundColor: theme.colors.foreground, justifyContent: "center", alignItems: "center" }]}>
            <Camera size={28} color={glowColor} opacity={0.6} />
          </View>
        )}
      </View>
      {!avatarUri && (
        <View style={[styles.cameraBadge, { backgroundColor: glowColor }]}>
          <Camera size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  )
}

interface AuthBackButtonProps {
  onPress: () => void
}

function AuthBackButton({ onPress }: AuthBackButtonProps) {
  const { theme } = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={styles.rowCenterTight}>
        <ChevronLeft size={18} color={theme.colors.mutedForeground} />
        <Text style={[styles.backText, { color: theme.colors.mutedForeground }]}>Back</Text>
      </View>
    </Pressable>
  )
}

interface NeonFieldProps {
  glow: GlowTone
  icon: React.ReactNode
  value: string
  placeholder: string
  onChangeText: (value: string) => void
  keyboardType?: "default" | "phone-pad" | "number-pad"
  textContentType?: "oneTimeCode" | "name"
  autoComplete?: "sms-otp" | "name"
  editable?: boolean
  accessibilityLabel?: string
}

// Helper function to lighten a hex color
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent))
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent))
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

// Helper function to convert hex with alpha to rgba
function hexWithAlphaToRgba(hexWithAlpha: string): string {
  if (hexWithAlpha.length === 9) {
    // Format: #RRGGBBAA
    const hex = hexWithAlpha.slice(0, 7)
    const alpha = parseInt(hexWithAlpha.slice(7, 9), 16) / 255
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return hexWithAlpha
}

function NeonField({
  glow,
  icon,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  textContentType,
  autoComplete,
  editable = true,
  accessibilityLabel,
}: NeonFieldProps) {
  const { theme } = useTheme()
  const glowColor = getGlowColor(theme, glow)
  const isFocused = useSharedValue(0)

  // Normal border: glowColor with 70 opacity (hex 70 = ~44%)
  // Focused border: much lighter glowColor with higher opacity for visibility
  const normalBorderColorHex = `${glowColor}70`
  const lighterGlowColor = lightenColor(glowColor, 0.5)
  const focusedBorderColorHex = `${lighterGlowColor}CC` // Higher opacity (CC = ~80%)
  
  // Convert to rgba for proper interpolation
  const normalBorderColor = hexWithAlphaToRgba(normalBorderColorHex)
  const focusedBorderColor = hexWithAlphaToRgba(focusedBorderColorHex)

  const handleFocus = React.useCallback(() => {
    isFocused.value = withTiming(1, { duration: 200 })
  }, [isFocused])

  const handleBlur = React.useCallback(() => {
    isFocused.value = withTiming(0, { duration: 200 })
  }, [isFocused])

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      isFocused.value,
      [0, 1],
      [normalBorderColor, focusedBorderColor]
    )
    return {
      borderColor,
    }
  })

  return (
    <Animated.View
      style={[
        styles.neonField,
        animatedBorderStyle,
      ]}
    >
      <View style={[styles.neonIcon, { backgroundColor: `${glowColor}1f`, borderColor: `${glowColor}55` }]}>
        {icon}
      </View>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        textContentType={textContentType as any}
        autoComplete={autoComplete as any}
        style={[styles.neonInput, { color: theme.colors.foreground }]}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  )
}

export function AuthScreen({ onComplete, initialStep }: AuthScreenProps) {
  const { theme } = useTheme()
  const [step, setStep] = React.useState<AuthStep>(initialStep ?? "welcome")
  const [signupMode, setSignupMode] = React.useState<SignupMode | null>(null)
  const [name, setName] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null)
  const [referralCode, setReferralCode] = React.useState("")
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [googleError, setGoogleError] = React.useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  const { user } = useSupabaseAuth()
  const { toast } = useToast()
  const stepRef = React.useRef(step)
  stepRef.current = step

  // Pre-fill name from session user when on profile step
  const u = user as { user_metadata?: { full_name?: string; name?: string }; name?: string } | null
  const userName = u?.user_metadata?.full_name ?? u?.user_metadata?.name ?? u?.name
  React.useEffect(() => {
    if (userName && step === "profile" && !name) {
      setName(userName)
    }
  }, [userName, step, name])

  // If user already has a session (e.g. returning user), restore stored mode/role and go to app, or show mode page.
  // When initialStep is "mode" (e.g. after Google OAuth), show mode step so user can choose. Do not overwrite step
  // if the user has already navigated to "role" or "profile" (getProfile can resolve late and would reset step).
  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    getProfile()
      .then((profile) => {
        if (cancelled) return
        const currentStep = stepRef.current
        if (initialStep === "mode") {
          if (currentStep !== "role" && currentStep !== "profile") {
            setStep("mode")
          }
          return
        }
        if (profile?.mode === "pro" || profile?.mode === "user") {
          onComplete(profile.mode as SignupMode, profile.pro_role as UserRole | undefined)
        } else if (currentStep !== "role" && currentStep !== "profile") {
          setStep("mode")
        }
      })
      .catch(() => {
        if (!cancelled && stepRef.current !== "role" && stepRef.current !== "profile") {
          setStep("mode")
        }
      })
    return () => {
      cancelled = true
    }
  }, [user, onComplete, initialStep])

  React.useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") {
          Alert.alert("Permission needed", "We need camera roll access to set your avatar.")
        }
      }
    }
    if (step === "profile") {
      requestPermissions()
    }
  }, [step])

  async function handlePickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  async function handleGetStarted() {
    const mode = signupMode ?? "pro"
    const role = mode === "pro" ? selectedRole ?? undefined : undefined
    if (!name.trim() || (mode === "pro" && !role)) return

    setIsSubmitting(true)
    try {
      let pictureUrl: string | null = null
      if (avatarUri && user?.id) {
        pictureUrl = await uploadAvatar(user.id, avatarUri)
      }
      onComplete(mode, role, {
        name: name.trim(),
        picture: pictureUrl,
        referralCode: referralCode.trim() || undefined,
      })
    } catch (e) {
      Alert.alert("Error", "Failed to save profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderStepContent() {
    switch (step) {
      case "welcome":
        return (
          <View key="welcome" style={[styles.stepWrap, styles.center]}>
            <View style={{ marginBottom: 26 }}>
              <VIPsyncLogo size="lg" animate showTagline />
            </View>

            <View style={styles.featuresRow}>
              {[
                { icon: <Shield size={14} color={theme.colors.neonCyan} />, label: "Secure" },
                { icon: <Sparkles size={14} color={theme.colors.neonCyan} />, label: "Real-time" },
                { icon: <CheckCircle size={14} color={theme.colors.neonCyan} />, label: "Pro Tools" },
              ].map((f, idx) => (
                <Animated.View
                  key={f.label}
                  entering={FadeIn.delay(idx * 100).duration(300).springify()}
                  style={styles.featureChip}
                >
                  {f.icon}
                  <Text style={[styles.featureText, { color: theme.colors.mutedForeground }]}>
                    {f.label}
                  </Text>
                </Animated.View>
              ))}
            </View>

            <View style={styles.block}>
              {googleError ? (
                <Text style={[styles.googleError, { color: "#ef4444" }]}>
                  {googleError}
                </Text>
              ) : null}
              <Button
                variant="gradient"
                size="lg"
                disabled={isGoogleLoading}
                onPress={async () => {
                  setGoogleError(null)
                  setIsGoogleLoading(true)
                  const result = await signInWithGoogle()
                  setIsGoogleLoading(false)
                  if (result.success) {
                    toast({
                      title: "Sign-in successful",
                      description: "Choose your mode to continue.",
                    })
                    return
                  }
                  setGoogleError(result.error ?? "Google sign-in failed. Try again.")
                }}
                style={[styles.full, { backgroundColor: "#4285F4", marginBottom: 12 }]}
              >
                <View style={styles.rowCenter}>
                  {isGoogleLoading ? (
                    <Text style={styles.btnTextWhite}>Signing in…</Text>
                  ) : (
                    <>
                      <Text style={styles.btnTextWhite}>Continue with Google</Text>
                      <ArrowRight size={18} color="#fff" />
                    </>
                  )}
                </View>
              </Button>

              <View style={styles.orRow}>
                <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.orText, { color: theme.colors.mutedForeground }]}>or</Text>
                <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <Button
                variant="outline"
                tone="cyan"
                onPress={() => {}}
                style={styles.full}
              >
                <View style={styles.rowCenter}>
                  <Gift size={18} color={theme.colors.neonCyan} />
                  <Text style={[styles.btnText, { color: theme.colors.neonCyan }]}>
                    I have a referral code
                  </Text>
                </View>
              </Button>

              {user ? (
                <Button
                  variant="ghost"
                  onPress={() => setStep("mode")}
                  style={[styles.full, { marginTop: 12 }]}
                >
                  <Text style={[styles.btnText, { color: theme.colors.mutedForeground }]}>
                    Already signed in? Continue
                  </Text>
                </Button>
              ) : null}
            </View>

            <Text style={[styles.legal, { color: theme.colors.mutedForeground }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        )

      case "mode":
        return (
          <View key="mode" style={styles.stepWrap}>
          <View style={styles.block}>
            <StepHeader
              glow="pink"
              icon={<Users size={22} color={theme.colors.neonPink} />}
              title="How do you want to use VIPsync?"
              subtitle="Choose your experience"
            />

            <View style={styles.roleGrid}>
              <Animated.View entering={FadeIn.delay(0).duration(250).springify()} style={{ width: "100%" }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sign up as Pro — venue staff"
                  onPress={() => {
                    setSignupMode("pro")
                    setStep("role")
                  }}
                  style={({ pressed }) => [
                    styles.roleCard,
                    {
                      borderColor: `${theme.colors.neonPink}cc`,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.roleCardInner,
                      { backgroundColor: `${theme.colors.neonPink}1a` },
                    ]}
                  >
                    <View style={{ flexDirection: "row", gap: 16, width: "100%", alignItems: "flex-start" }}>
                      <View style={styles.roleIconContainer}>
                        <Briefcase size={22} color={theme.colors.foreground} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1, gap: 8, justifyContent: "flex-start" }}>
                        <Text style={[styles.roleTitle, { color: theme.colors.neonPink }]}>Pro</Text>
                        <Text style={[styles.roleDesc, { color: theme.colors.mutedForeground }]}>
                          Venue staff: promoters, door, managers & owners
                        </Text>
                      </View>
                      <View style={[styles.roleCheck, { backgroundColor: theme.colors.neonPink }]}>
                        <ArrowRight size={16} color={theme.colors.background} />
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
              <Animated.View entering={FadeIn.delay(80).duration(250).springify()} style={{ width: "100%" }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sign up as User — guest"
                  onPress={() => {
                    setSignupMode("user")
                    setStep("profile")
                  }}
                  style={({ pressed }) => [
                    styles.roleCard,
                    {
                      borderColor: `${theme.colors.neonCyan}cc`,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.roleCardInner,
                      { backgroundColor: `${theme.colors.neonCyan}1a` },
                    ]}
                  >
                    <View style={{ flexDirection: "row", gap: 16, width: "100%", alignItems: "flex-start" }}>
                      <View style={styles.roleIconContainer}>
                        <User size={22} color={theme.colors.foreground} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1, gap: 8, justifyContent: "flex-start" }}>
                        <Text style={[styles.roleTitle, { color: theme.colors.neonCyan }]}>User</Text>
                        <Text style={[styles.roleDesc, { color: theme.colors.mutedForeground }]}>
                          Guest: explore the venue & enjoy the night
                        </Text>
                      </View>
                      <View style={[styles.roleCheck, { backgroundColor: theme.colors.neonCyan }]}>
                        <ArrowRight size={16} color={theme.colors.background} />
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          </View>
          </View>
        )

      case "role":
        return (
          <View key="role" style={styles.stepWrap}>
          <View style={styles.block}>
            <StepHeader
              glow="pink"
              icon={<Users size={22} color={theme.colors.neonPink} />}
              title="Select your role"
              subtitle="Choose the role that best describes you"
            />

            <View style={styles.roleGrid}>
              {roles.map((role, idx) => {
                const isActive = selectedRole === role.id
                const glowColor = getGlowColor(theme, role.glow)

                return (
                  <Animated.View
                    key={role.id}
                    entering={FadeIn.delay(idx * 80).duration(250).springify()}
                    style={{ width: "100%" }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Role: ${role.title}`}
                      onPress={() => setSelectedRole(role.id)}
                      style={({ pressed }) => [
                        styles.roleCard,
                        {
                          borderColor: isActive ? `${glowColor}cc` : theme.colors.border,
                          transform: [{ scale: pressed ? 0.99 : 1 }],
                        },
                      ]}
                    >
                    <View
                      style={[
                        styles.roleCardInner,
                        {
                          backgroundColor: isActive ? `${glowColor}1a` : "rgba(10, 6, 18, 0.45)",
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", gap: 16, width: "100%", alignItems: "flex-start" }}>
                        <View style={styles.roleIconContainer}>
                          {React.isValidElement(role.icon)
                            ? React.cloneElement(role.icon as any, { 
                                color: theme.colors.foreground, 
                                size: 22,
                                strokeWidth: 1.5,
                                fill: "none"
                              })
                            : role.icon}
                        </View>
                        <View style={{ flex: 1, gap: 8, justifyContent: "flex-start" }}>
                          <Text style={[styles.roleTitle, { color: isActive ? glowColor : theme.colors.foreground }]}>
                            {role.title}
                          </Text>
                          <Text style={[styles.roleDesc, { color: theme.colors.mutedForeground }]}>
                            {role.description}
                          </Text>
                        </View>

                        {isActive ? (
                          <View style={[styles.roleCheck, { backgroundColor: glowColor }]}>
                            <CheckCircle size={16} color={theme.colors.background} />
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                  </Animated.View>
                )
              })}
            </View>

            <Button
              variant="gradient"
              size="lg"
              onPress={() => setStep("profile")}
              disabled={!selectedRole}
              style={styles.full}
            >
              <View style={styles.rowCenter}>
                <Text style={styles.btnTextWhite}>Continue</Text>
                <ArrowRight size={18} color="#fff" />
              </View>
            </Button>
          </View>
          </View>
        )

      case "profile":
        return (
          <View key="profile" style={styles.stepWrap}>
          <View style={styles.block}>
            <View style={[styles.center, { marginTop: 8 }]}>
              <ProfileHalo
                glow={signupMode === "user" ? "cyan" : "pink"}
                avatarUri={avatarUri}
                onPress={handlePickAvatar}
              />
              <Text style={[styles.h2, { color: theme.colors.foreground, marginTop: 14 }]}>
                {signupMode === "user" ? "Almost there" : "Complete your profile"}
              </Text>
              <Text style={[styles.p, { color: theme.colors.mutedForeground }]}>
                {signupMode === "user"
                  ? "Add your name to get started as a guest"
                  : "Tell us a bit about yourself"}
              </Text>

              {signupMode === "pro" && selectedRole ? (
                <View
                  style={[
                    styles.rolePill,
                    {
                      borderColor: `${getGlowColor(theme, roleToTone(selectedRole))}66`,
                      backgroundColor: `${getGlowColor(theme, roleToTone(selectedRole))}22`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rolePillText,
                      { color: getGlowColor(theme, roleToTone(selectedRole)) },
                    ]}
                  >
                    {selectedRole === "door"
                      ? "Door Staff"
                      : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                  </Text>
                </View>
              ) : null}
              {signupMode === "user" ? (
                <View
                  style={[
                    styles.rolePill,
                    {
                      borderColor: `${theme.colors.neonCyan}66`,
                      backgroundColor: `${theme.colors.neonCyan}22`,
                    },
                  ]}
                >
                  <Text style={[styles.rolePillText, { color: theme.colors.neonCyan }]}>Guest</Text>
                </View>
              ) : null}
            </View>

            <View style={{ gap: 12 }}>
              <NeonField
                glow={signupMode === "user" ? "cyan" : "pink"}
                icon={<User size={18} color={signupMode === "user" ? theme.colors.neonCyan : theme.colors.neonPink} />}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                textContentType="name"
                autoComplete="name"
                accessibilityLabel="Your name"
              />
              {signupMode === "pro" ? (
                <NeonField
                  glow="cyan"
                  icon={<Gift size={18} color={theme.colors.neonCyan} />}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Referral code (optional)"
                  accessibilityLabel="Referral code"
                />
              ) : null}
              <Button
                variant="gradient"
                size="lg"
                onPress={handleGetStarted}
                disabled={!name.trim() || (signupMode === "pro" && !selectedRole) || isSubmitting}
                style={styles.full}
              >
                <View style={styles.rowCenter}>
                  <Text style={styles.btnTextWhite}>
                    {isSubmitting ? "Saving…" : signupMode === "user" ? "Go to guest app" : "Get Started"}
                  </Text>
                  {!isSubmitting && <ArrowRight size={18} color="#fff" />}
                </View>
              </Button>
            </View>
          </View>
          </View>
        )
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Image 
        source={images.authBg} 
        style={StyleSheet.absoluteFillObject} 
        contentFit="cover"
        cachePolicy="memory"
        priority="high"
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={styles.kb}
      >
        {/* Simple particle layer */}
        {Array.from({ length: 18 }).map((_, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.1, translateY: 0, scale: 1 }}
            animate={{ opacity: 0.55, translateY: -36, scale: 1.8 }}
            transition={{ type: "timing", duration: 3600 + (i % 4) * 350, loop: true, delay: i * 140 }}
            style={[
              styles.particle,
              {
                left: `${(i * 17) % 100}%` as any,
                top: `${(i * 11) % 100}%` as any,
                backgroundColor:
                  i % 3 === 0
                    ? theme.colors.neonPink
                    : i % 3 === 1
                      ? theme.colors.neonCyan
                      : theme.colors.neonGreen,
              },
            ]}
          />
        ))}

        <View style={styles.content}>
          <View style={styles.header}>
            {step === "welcome" ? (
              <View style={{ width: 70, height: 40 }} />
            ) : (
              <AuthBackButton
                onPress={() => {
                  if (step === "mode") setStep("welcome")
                  if (step === "role") setStep("mode")
                  if (step === "profile") setStep(signupMode === "user" ? "mode" : "role")
                }}
              />
            )}
          </View>

          <View style={styles.stage}>
            <Animated.View
              key={step}
              entering={SlideInRight.duration(300).springify().damping(20).stiffness(90).mass(0.8)}
              exiting={SlideOutLeft.duration(250).springify().damping(20).stiffness(90).mass(0.8)}
              style={styles.stageInner}
            >
              {renderStepContent()}
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  kb: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
  },
  header: {
    height: 50,
    justifyContent: "flex-end",
    paddingBottom: 12,
  },
  stage: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 12,
  },
  stageInner: {
    flex: 1,
    width: "100%",
  },
  stepWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  googleError: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  block: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 360,
    gap: 14,
  },
  full: {
    width: "100%",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  rowCenterTight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnTextWhite: {
    color: "#fff",
    fontFamily: "Orbitron_800ExtraBold",
    fontSize: 14,
  },
  btnText: {
    fontFamily: "Orbitron_800ExtraBold",
    fontSize: 14,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  orLine: {
    flex: 1,
    height: 1,
    opacity: 0.8,
  },
  orText: {
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    textTransform: "uppercase",
  },
  legal: {
    marginTop: 24,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  h2: {
    fontSize: 22,
    fontFamily: "Orbitron_900Black",
    marginTop: 12,
    textAlign: "center",
  },
  p: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    fontFamily: "Orbitron_700Bold",
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backText: {
    fontSize: 13,
    fontFamily: "Orbitron_800ExtraBold",
  },
  roleGrid: {
    flexDirection: "column",
    gap: 14,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  roleCard: {
    width: "100%",
    minHeight: 100,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  roleCardInner: {
    padding: 16,
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 100,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: {
    fontSize: 15,
    fontFamily: "Orbitron_900Black",
  },
  roleDesc: {
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 0,
  },
  roleCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  neonField: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(14, 9, 22, 0.55)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
  },
  neonIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  neonInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  rolePill: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rolePillText: {
    fontSize: 12,
    fontFamily: "Orbitron_900Black",
    letterSpacing: 0.2,
  },
  haloOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  haloRing: {
    flex: 1,
    borderRadius: 38,
    padding: 3,
  },
  haloInner: {
    flex: 1,
    borderRadius: 35,
    opacity: 0.92,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#0b0612",
  },
})

