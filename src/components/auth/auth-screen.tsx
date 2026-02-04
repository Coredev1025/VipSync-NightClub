import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import {
    ArrowRight,
    Briefcase,
    Camera,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    Crown,
    DoorOpen,
    Gift,
    Lock,
    Phone,
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
    Modal,
    Platform,
    Pressable,
    ScrollView,
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
import { images } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

type AuthStep = "welcome" | "phone" | "otp" | "mode" | "role" | "profile"
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

export interface AuthScreenProps {
  onComplete: (mode: SignupMode, proRole?: UserRole) => void
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

/** Country code option for phone input. */
interface CountryOption {
  code: string
  label: string
  /** Max length of national number (digits only). */
  maxLength: number
  /** Min length to consider valid (e.g. 10 for US). */
  minLength: number
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "+1", label: "United States / Canada", maxLength: 10, minLength: 10 },
  { code: "+44", label: "United Kingdom", maxLength: 11, minLength: 10 },
  { code: "+81", label: "Japan", maxLength: 10, minLength: 10 },
  { code: "+49", label: "Germany", maxLength: 11, minLength: 10 },
  { code: "+33", label: "France", maxLength: 9, minLength: 9 },
  { code: "+86", label: "China", maxLength: 11, minLength: 11 },
  { code: "+91", label: "India", maxLength: 10, minLength: 10 },
  { code: "+61", label: "Australia", maxLength: 9, minLength: 9 },
  { code: "+55", label: "Brazil", maxLength: 11, minLength: 10 },
  { code: "+52", label: "Mexico", maxLength: 10, minLength: 10 },
  { code: "+34", label: "Spain", maxLength: 9, minLength: 9 },
  { code: "+39", label: "Italy", maxLength: 10, minLength: 9 },
  { code: "+82", label: "South Korea", maxLength: 10, minLength: 9 },
  { code: "+7", label: "Russia / Kazakhstan", maxLength: 10, minLength: 10 },
  { code: "+31", label: "Netherlands", maxLength: 9, minLength: 9 },
  { code: "+41", label: "Switzerland", maxLength: 9, minLength: 9 },
  { code: "+971", label: "UAE", maxLength: 9, minLength: 9 },
  { code: "+65", label: "Singapore", maxLength: 8, minLength: 8 },
  { code: "+27", label: "South Africa", maxLength: 9, minLength: 9 },
  { code: "+234", label: "Nigeria", maxLength: 10, minLength: 10 },
]

function getCountryByCode(code: string): CountryOption {
  return COUNTRY_OPTIONS.find((c) => c.code === code) ?? COUNTRY_OPTIONS[0]
}

function parseDigits(s: string): string {
  return s.replace(/\D/g, "")
}

/** Format US/CA (+1) as (XXX) XXX-XXXX. */
function formatUS(digits: string): string {
  const d = digits.slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/** Format other countries: groups of 3 digits. */
function formatGeneric(digits: string, maxLen: number): string {
  const d = digits.slice(0, maxLen)
  if (d.length <= 3) return d
  const parts: string[] = []
  for (let i = 0; i < d.length; i += 3) parts.push(d.slice(i, i + 3))
  return parts.join(" ")
}

function formatPhoneDisplay(digits: string, countryCode: string): string {
  const country = getCountryByCode(countryCode)
  const d = digits.slice(0, country.maxLength)
  if (countryCode === "+1") return formatUS(d)
  return formatGeneric(d, country.maxLength)
}

interface PhoneInputWithCountryProps {
  glow: GlowTone
  icon: React.ReactNode
  countryCode: string
  onCountryCodeChange: (code: string) => void
  value: string
  onChangeText: (digits: string) => void
  placeholder?: string
  accessibilityLabel?: string
}

function PhoneInputWithCountry({
  glow,
  icon,
  countryCode,
  onCountryCodeChange,
  value: digits,
  onChangeText,
  placeholder = "555 000 0000",
  accessibilityLabel = "Phone number",
}: PhoneInputWithCountryProps) {
  const { theme } = useTheme()
  const glowColor = getGlowColor(theme, glow)
  const isFocused = useSharedValue(0)
  const [showCountryPicker, setShowCountryPicker] = React.useState(false)
  const country = getCountryByCode(countryCode)
  const displayValue = formatPhoneDisplay(digits, countryCode)
  const isValid = digits.length >= country.minLength
  const isInvalid = digits.length > 0 && digits.length < country.minLength

  const normalBorderColorHex = `${glowColor}70`
  const lighterGlowColor = lightenColor(glowColor, 0.5)
  const focusedBorderColorHex = `${lighterGlowColor}CC`
  const validBorderColorHex = `${theme.colors.neonGreen}CC`
  const invalidBorderColorHex = `${theme.colors.neonPink}99`
  const normalBorderColor = hexWithAlphaToRgba(normalBorderColorHex)
  const focusedBorderColor = hexWithAlphaToRgba(focusedBorderColorHex)
  const validBorderColor = hexWithAlphaToRgba(validBorderColorHex)
  const invalidBorderColor = hexWithAlphaToRgba(invalidBorderColorHex)
  const validationState = useSharedValue(0)
  React.useEffect(() => {
    validationState.value = isValid ? 2 : isInvalid ? 1 : 0
  }, [isValid, isInvalid, validationState])

  const handleChangeText = React.useCallback(
    (text: string) => {
      const next = parseDigits(text).slice(0, country.maxLength)
      onChangeText(next)
    },
    [country.maxLength, onChangeText]
  )

  const handleFocus = React.useCallback(() => {
    isFocused.value = withTiming(1, { duration: 200 })
  }, [isFocused])
  const handleBlur = React.useCallback(() => {
    isFocused.value = withTiming(0, { duration: 200 })
  }, [isFocused])

  const animatedBorderStyle = useAnimatedStyle(() => {
    "worklet"
    const validationColor =
      validationState.value === 2 ? validBorderColor : validationState.value === 1 ? invalidBorderColor : normalBorderColor
    const borderColor = isFocused.value > 0.5 ? focusedBorderColor : validationColor
    return { borderColor }
  })

  return (
    <View style={{ gap: 6 }}>
      <Animated.View style={[styles.neonField, animatedBorderStyle]}>
        <View style={[styles.neonIcon, { backgroundColor: `${glowColor}1f`, borderColor: `${glowColor}55` }]}>
          {icon}
        </View>
        <Pressable
          onPress={() => setShowCountryPicker(true)}
          style={({ pressed }) => [
            styles.countryCodeTouch,
            { opacity: pressed ? 0.8 : 1, borderRightColor: theme.colors.border },
          ]}
          accessibilityLabel="Select country code"
          accessibilityRole="button"
        >
          <Text style={[styles.countryCodeText, { color: theme.colors.foreground }]}>{countryCode}</Text>
          <ChevronDown size={16} color={theme.colors.mutedForeground} />
        </Pressable>
        <TextInput
          accessibilityLabel={accessibilityLabel}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          value={displayValue}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          style={[styles.neonInput, styles.phoneInput, { color: theme.colors.foreground }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Animated.View>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <Pressable style={styles.countryPickerBackdrop} onPress={() => setShowCountryPicker(false)}>
          <View style={[styles.countryPickerSheet, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.countryPickerHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.countryPickerTitle, { color: theme.colors.foreground }]}>Country code</Text>
              <Pressable onPress={() => setShowCountryPicker(false)} hitSlop={12}>
                <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>Done</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.countryPickerList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.code}
                  onPress={() => {
                    onCountryCodeChange(opt.code)
                    setShowCountryPicker(false)
                  }}
                  style={({ pressed }) => [
                    styles.countryPickerRow,
                    { backgroundColor: pressed ? theme.colors.muted : "transparent" },
                    opt.code === countryCode && { backgroundColor: `${theme.colors.neonCyan}22` },
                  ]}
                >
                  <Text style={[styles.countryPickerCode, { color: theme.colors.foreground }]}>{opt.code}</Text>
                  <Text style={[styles.countryPickerLabel, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
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

interface OtpDigitProps {
  index: number
  value: string
  glow: GlowTone
  onChange: (index: number, value: string) => void
  onBackspace: (index: number) => void
  inputRef: (ref: TextInput | null) => void
  isFirst: boolean
}

function OtpDigit({ index, value, glow, onChange, onBackspace, inputRef, isFirst }: OtpDigitProps) {
  const { theme } = useTheme()
  const glowColor = getGlowColor(theme, glow)

  return (
    <View
      style={[
        styles.otpBox,
        {
          borderColor: `${glowColor}70`,
        },
      ]}
    >
      <TextInput
        ref={inputRef}
        accessibilityLabel={`OTP digit ${index + 1}`}
        value={value}
        onChangeText={(v) => onChange(index, v)}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === "Backspace") onBackspace(index)
        }}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
        textContentType={isFirst ? ("oneTimeCode" as any) : undefined}
        autoComplete={isFirst ? ("sms-otp" as any) : undefined}
        style={[styles.otpInput, { color: theme.colors.foreground }]}
      />
    </View>
  )
}

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const { theme } = useTheme()
  const [step, setStep] = React.useState<AuthStep>("welcome")
  const [countryCode, setCountryCode] = React.useState("+1")
  const [phoneDigits, setPhoneDigits] = React.useState("")
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""])
  const [signupMode, setSignupMode] = React.useState<SignupMode | null>(null)
  const [name, setName] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null)
  const [referralCode, setReferralCode] = React.useState("")
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null)

  const otpRefs = React.useRef<Array<TextInput | null>>([])

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

  function handleOtpChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "")
    if (!digits) {
      const next = [...otp]
      next[index] = ""
      setOtp(next)
      return
    }

    // Handle paste / OS autofill.
    if (digits.length > 1) {
      const next = [...otp]
      for (let i = 0; i < digits.length && index + i < 6; i += 1) next[index + i] = digits[i]
      setOtp(next)
      const nextIndex = Math.min(5, index + digits.length - 1)
      otpRefs.current[nextIndex]?.focus?.()
      return
    }

    const next = [...otp]
    next[index] = digits
    setOtp(next)
    if (digits && index < 5) otpRefs.current[index + 1]?.focus?.()
  }

  function handleOtpBackspace(index: number) {
    if (otp[index]) return
    if (index <= 0) return
    otpRefs.current[index - 1]?.focus?.()
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
              <Button variant="gradient" size="lg" onPress={() => setStep("phone")} style={styles.full}>
                <View style={styles.rowCenter}>
                  <Phone size={18} color="#fff" />
                  <Text style={styles.btnTextWhite}>Continue with Phone</Text>
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
            </View>

            <Text style={[styles.legal, { color: theme.colors.mutedForeground }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        )

      case "phone":
        return (
          <View key="phone" style={styles.stepWrap}>
          <View style={styles.block}>
            <StepHeader
              glow="pink"
              icon={<Phone size={22} color={theme.colors.neonPink} />}
              title="Enter your phone"
              subtitle="We'll send you a verification code"
            />

            <View style={{ gap: 14 }}>
              <PhoneInputWithCountry
                glow="pink"
                icon={<Phone size={18} color={theme.colors.neonPink} />}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                value={phoneDigits}
                onChangeText={setPhoneDigits}
                placeholder={getCountryByCode(countryCode).code === "+1" ? "(555) 000-0000" : "555 000 0000"}
                accessibilityLabel="Phone number"
              />
              <Button
                variant="gradient"
                size="lg"
                onPress={() => setStep("otp")}
                disabled={phoneDigits.length < getCountryByCode(countryCode).minLength}
                style={styles.full}
              >
                <View style={styles.rowCenter}>
                  <Text style={styles.btnTextWhite}>Send Code</Text>
                  <ArrowRight size={18} color="#fff" />
                </View>
              </Button>
            </View>
          </View>
          </View>
        )

      case "otp":
        return (
          <View key="otp" style={styles.stepWrap}>
          <View style={styles.block}>
            <StepHeader
              glow="cyan"
              icon={<Lock size={22} color={theme.colors.neonCyan} />}
              title="Verify your phone"
              subtitle={`Enter the 6-digit code sent to ${phoneDigits.length >= getCountryByCode(countryCode).minLength ? `${countryCode} ${formatPhoneDisplay(phoneDigits, countryCode)}` : "your phone"}`}
            />

            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <Animated.View
                  key={idx}
                  entering={FadeIn.delay(idx * 50).duration(200).springify()}
                >
                  <OtpDigit
                    index={idx}
                    value={digit}
                    glow="cyan"
                    onChange={(i, v) => handleOtpChange(i, v)}
                    onBackspace={(i) => handleOtpBackspace(i)}
                    isFirst={idx === 0}
                    inputRef={(r) => {
                      otpRefs.current[idx] = r
                    }}
                  />
                </Animated.View>
              ))}
            </View>

            <Button
              variant="gradient"
              size="lg"
              onPress={() => setStep("mode")}
              disabled={otp.some((d) => !d)}
              style={styles.full}
            >
              <View style={styles.rowCenter}>
                <Text style={styles.btnTextWhite}>Verify</Text>
                <Lock size={18} color="#fff" />
              </View>
            </Button>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resend code"
              onPress={() => {
                // no-op placeholder (hook this to your SMS provider)
              }}
              style={({ pressed }) => [styles.resendBtn, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.rowCenterTight}>
                <Sparkles size={14} color={theme.colors.neonCyan} />
                <Text style={[styles.resendText, { color: theme.colors.neonCyan }]}>Resend code</Text>
              </View>
            </Pressable>
          </View>
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
                onPress={() => onComplete(signupMode ?? "pro", signupMode === "pro" ? selectedRole ?? undefined : undefined)}
                disabled={!name.trim() || (signupMode === "pro" && !selectedRole)}
                style={styles.full}
              >
                <View style={styles.rowCenter}>
                  <Text style={styles.btnTextWhite}>
                    {signupMode === "user" ? "Go to guest app" : "Get Started"}
                  </Text>
                  <ArrowRight size={18} color="#fff" />
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
                  if (step === "phone") setStep("welcome")
                  if (step === "otp") setStep("phone")
                  if (step === "mode") setStep("otp")
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
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(14, 9, 22, 0.55)",
    overflow: "hidden",
    justifyContent: "center",
  },
  otpInput: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  resendBtn: {
    alignSelf: "center",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10, 6, 18, 0.25)",
  },
  resendText: {
    fontSize: 12,
    fontFamily: "Orbitron_800ExtraBold",
    letterSpacing: 0.2,
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
  countryCodeTouch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 12,
    borderRightWidth: 1,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
  },
  phoneHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: 4,
  },
  countryPickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  countryPickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "70%",
  },
  countryPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  countryPickerTitle: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
  },
  countryPickerList: {
    maxHeight: 360,
  },
  countryPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  countryPickerCode: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    minWidth: 44,
  },
  countryPickerLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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

