import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { ArrowLeft, Camera } from "lucide-react-native"
import * as React from "react"
import { Alert, Platform, Pressable, Text, TextInput, View, useColorScheme } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme/theme-provider"

interface Contact {
  id: number | string
  name: string
  avatar?: string
  status?: string
  email?: string
}

interface NewContactProps {
  onBack: () => void
  onSave: (contact: Omit<Contact, "id">) => void
}

function getStyles(mode: string | null | undefined, theme: ReturnType<typeof useTheme>["theme"]) {
  const isDark = mode === "dark"
  return {
    container: {
      flex: 1,
      backgroundColor: "#050505",
    },
    topBarHolder: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    topBarMainText: {
      fontSize: 16,
      color: theme.colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    topBarSecText: {
      fontSize: 11,
      marginTop: 1,
      color: theme.colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    content: {
      padding: 20,
      gap: 20,
    },
    avatarSection: {
      alignItems: "center" as const,
      gap: 12,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      position: "relative" as const,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      fontSize: 40,
      color: theme.colors.mutedForeground,
    },
    avatarEditBtn: {
      position: "absolute" as const,
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.neonPink,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    inputContainer: {
      gap: 12,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      marginBottom: 4,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    buttonContainer: {
      marginTop: 20,
      gap: 12,
    },
  }
}

export function GSNewContact({ onBack, onSave }: NewContactProps) {
  const mode = useColorScheme()
  const { theme } = useTheme()
  const styles = getStyles(mode, theme)
  const [name, setName] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null)

  React.useEffect(() => {
    requestPermissions()
  }, [])

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (mediaStatus !== "granted") {
        Alert.alert("Permission needed", "We need media library access to set contact photo.")
      }
    }
  }

  const handlePickAvatar = async () => {
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

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name for the contact.")
      return
    }

    const newContact: Omit<Contact, "id"> = {
      name: name.trim(),
      status: status.trim() || undefined,
      email: email.trim() || undefined,
      avatar: avatarUri || undefined,
    }

    onSave(newContact)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBarHolder}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={onBack}>
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.topBarMainText}>New Contact</Text>
            <Text style={styles.topBarSecText}>Add contact details</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarPlaceholder}>👤</Text>
            )}
            <Pressable onPress={handlePickAvatar} style={styles.avatarEditBtn}>
              <Camera size={16} color="#fff" />
            </Pressable>
          </Pressable>
          <Text style={styles.inputLabel}>Tap to add photo</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.inputContainer}>
          <View>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor={theme.colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Text style={styles.inputLabel}>Status</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter status"
              placeholderTextColor={theme.colors.mutedForeground}
              value={status}
              onChangeText={setStatus}
            />
          </View>

          <View>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor={theme.colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="solid"
            tone="pink"
            onPress={handleSave}
            style={{ width: "100%" }}
          >
            <Text style={{ color: theme.colors.neonPink, fontFamily: "Inter_600SemiBold" }}>
              Save Contact
            </Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
