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
  phone?: string
  avatar?: string
  status?: string
}

interface EditContactProps {
  contact: Contact
  onBack: () => void
  onSave: (data: Partial<Pick<Contact, "name" | "phone" | "avatar">>) => void
}

function getStyles(mode: string | null | undefined, theme: ReturnType<typeof useTheme>["theme"]) {
  return {
    container: { flex: 1, backgroundColor: "#050505" },
    topBarHolder: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    topBarMainText: { fontSize: 16, color: theme.colors.foreground, fontFamily: "Inter_500Medium" },
    topBarSecText: { fontSize: 11, marginTop: 1, color: theme.colors.mutedForeground, fontFamily: "Inter_400Regular" },
    content: { padding: 20, gap: 20 },
    avatarSection: { alignItems: "center" as const, gap: 12 },
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
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { fontSize: 40, color: theme.colors.mutedForeground },
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
    inputContainer: { gap: 12 },
    inputLabel: { fontSize: 14, color: theme.colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 4 },
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
    buttonContainer: { marginTop: 20, gap: 12 },
  }
}

export function GSEditContact({ contact, onBack, onSave }: EditContactProps) {
  const mode = useColorScheme()
  const { theme } = useTheme()
  const styles = getStyles(mode, theme)
  const [name, setName] = React.useState(contact.name ?? "")
  const [phone, setPhone] = React.useState(contact.phone ?? "")
  const [avatarUri, setAvatarUri] = React.useState<string | null>(contact.avatar ?? null)

  React.useEffect(() => {
    if (Platform.OS !== "web") {
      ImagePicker.requestMediaLibraryPermissionsAsync().catch(() => {})
    }
  }, [])

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri)
    } catch {
      Alert.alert("Error", "Failed to pick image.")
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name.")
      return
    }
    onSave({
      name: name.trim(),
      phone: phone.trim() || undefined,
      avatar: avatarUri ?? undefined,
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBarHolder}>
        <Pressable onPress={onBack}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.topBarMainText}>Edit contact</Text>
          <Text style={styles.topBarSecText}>{contact.name}</Text>
        </View>
      </View>
      <View style={styles.content}>
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
        </View>
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
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone"
              placeholderTextColor={theme.colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button variant="solid" tone="pink" onPress={handleSave} style={{ width: "100%" }}>
            <Text style={{ color: theme.colors.neonPink, fontFamily: "Inter_600SemiBold" }}>Save</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
