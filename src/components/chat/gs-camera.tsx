import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { Camera, Image as ImageIcon, X } from "lucide-react-native"
import * as React from "react"
import { Alert, Platform, Pressable, Text, View, useColorScheme } from "react-native"

import { ModalCard } from "@/components/ui/modal"
import { useTheme } from "@/theme/theme-provider"

interface CameraProps {
  open: boolean
  onClose: () => void
  onImageSelect: (uri: string) => void
}

function getStyles(mode: string | null | undefined, theme: ReturnType<typeof useTheme>["theme"]) {
  return {
    container: {
      padding: 16,
      gap: 16,
    },
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: theme.colors.foreground,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    optionsContainer: {
      gap: 12,
    },
    optionBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionText: {
      fontSize: 16,
      fontFamily: "Inter_500Medium",
      color: theme.colors.foreground,
      flex: 1,
    },
    previewContainer: {
      marginTop: 8,
      gap: 8,
    },
    previewImage: {
      width: "100%" as const,
      height: 200,
      borderRadius: 12,
    },
  }
}

export function GSCamera({ open, onClose, onImageSelect }: CameraProps) {
  const mode = useColorScheme()
  const { theme } = useTheme()
  const styles = getStyles(mode, theme)
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      requestPermissions()
    }
  }, [open])

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        Alert.alert("Permission needed", "We need camera and media library access to send images.")
      }
    }
  }

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
        onImageSelect(result.assets[0].uri)
        onClose()
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.")
    }
  }

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
        onImageSelect(result.assets[0].uri)
        onClose()
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  return (
    <ModalCard open={open} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Image</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={18} color={theme.colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.optionsContainer}>
          <Pressable onPress={handleTakePhoto} style={styles.optionBtn}>
            <Camera size={24} color={theme.colors.foreground} />
            <Text style={styles.optionText}>Take Photo</Text>
          </Pressable>

          <Pressable onPress={handlePickImage} style={styles.optionBtn}>
            <ImageIcon size={24} color={theme.colors.foreground} />
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </Pressable>
        </View>

        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} contentFit="cover" />
          </View>
        )}
      </View>
    </ModalCard>
  )
}
