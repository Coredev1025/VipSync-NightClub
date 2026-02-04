import { Image } from "expo-image"
import { MicOff, PhoneOff, Video, Volume2 } from "lucide-react-native"
import * as React from "react"
import { Pressable, Text, View, useColorScheme } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useTheme } from "@/theme/theme-provider"

interface CallingProps {
  contactName?: string
  contactAvatar?: string
  onEndCall: () => void
  onMutePress?: () => void
  onVideoPress?: () => void
  onSpeakerPress?: () => void
}

function getStyles(mode: string | null | undefined, theme: ReturnType<typeof useTheme>["theme"]) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    callDetailsHolder: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: 60,
    },
    callAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    callUser: {
      marginTop: 20,
      fontSize: 25,
      color: theme.colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    callDetail: {
      marginTop: 3,
      fontSize: 15,
      color: theme.colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    bottomControls: {
      backgroundColor: theme.colors.card,
      padding: 35,
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    controlBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    endBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#ff3b30",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
  }
}

export function GSCalling({
  contactName = "Contact",
  contactAvatar = "https://i.pravatar.cc/320?u=dev@geekspark.com",
  onEndCall,
  onMutePress,
  onVideoPress,
  onSpeakerPress,
}: CallingProps) {
  const mode = useColorScheme()
  const { theme } = useTheme()
  const styles = getStyles(mode, theme)

  return (
    <SafeAreaView edges={["top", "right", "left"]} style={styles.container}>
      <View style={styles.callDetailsHolder}>
        <Image source={{ uri: contactAvatar }} style={styles.callAvatar} contentFit="cover" />

        <Text style={styles.callUser}>{contactName}</Text>
        <Text style={styles.callDetail}>Calling</Text>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <Pressable onPress={onSpeakerPress} style={styles.controlBtn}>
          <Volume2 size={25} color="#fff" />
        </Pressable>

        <Pressable onPress={onVideoPress} style={styles.controlBtn}>
          <Video size={25} color="#fff" />
        </Pressable>

        <Pressable onPress={onMutePress} style={styles.controlBtn}>
          <MicOff size={25} color="#fff" />
        </Pressable>

        <Pressable onPress={onEndCall} style={styles.endBtn}>
          <PhoneOff size={25} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
