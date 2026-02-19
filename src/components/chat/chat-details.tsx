import { Image } from "expo-image"
import {
    Check,
    CheckCheck,
    ChevronLeft,
    Image as ImageIcon,
    MapPin,
    Mic,
    MoreVertical,
    Phone,
    Send,
    Sparkles,
} from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native"

import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { NeonAvatar, NeonAvatarGroup } from "@/components/ui/neon-avatar"
import { resolveAvatar } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"
import type { ChatListItem } from "./chat-list"

export interface ChatMessage {
  id: string
  content: string
  sender: string
  senderId?: string
  time: string
  isMe: boolean
  status?: "sent" | "delivered" | "read"
  aiAction?: {
    type: string
    label: string
  }
  uri?: string
  reply?: {
    id: string
    content: string
    sender: string
  }
}

interface ChatDetailsProps {
  chat: ChatListItem
  messages: ChatMessage[]
  onBack: () => void
  onSendMessage: (message: string) => void
  onImagePress?: () => void
  onCallPress?: () => void
  onMorePress?: () => void
}

export function ChatDetails({
  chat,
  messages,
  onBack,
  onSendMessage,
  onImagePress,
  onCallPress,
  onMorePress,
}: ChatDetailsProps) {
  const { theme } = useTheme()
  const [message, setMessage] = React.useState("")
  const [isRecording, setIsRecording] = React.useState(false)
  const scrollRef = React.useRef<ScrollView | null>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages.length])

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return

    onSendMessage(trimmed)
    setMessage("")
  }

  const formatMessageTime = (time: string) => {
    try {
      const date = new Date(time)
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    } catch {
      return time
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.thread}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[
          styles.threadHeader,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        <HapticPressable
          onPress={onBack}
          neonBorder
          borderColor={`${theme.colors.neonCyan}AA`}
          style={[styles.headerBtn, { backgroundColor: "transparent" }]}
        >
          <ChevronLeft size={22} color={theme.colors.foreground} />
        </HapticPressable>

        {chat.isGroup && chat.members ? (
          <NeonAvatarGroup
            avatars={chat.members.map((m) => ({
              source: resolveAvatar(m.src),
              fallback: m.fallback,
              status: "online",
            }))}
            max={3}
            size="sm"
            glow="cyan"
          />
        ) : (
          <NeonAvatar
            source={resolveAvatar(chat.avatar)}
            fallback={chat.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
            size="md"
            glow={chat.isOnline ? "green" : "cyan"}
            status={chat.isOnline ? "online" : undefined}
            showRing
          />
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: "Orbitron_800ExtraBold",
            }}
            numberOfLines={1}
          >
            {chat.name}
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
            {chat.isGroup
              ? `${chat.members?.length || 5} members`
              : chat.isOnline
                ? "Online"
                : "Last seen 2h ago"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {onCallPress && (
            <HapticPressable
              onPress={onCallPress}
              neonBorder
              borderColor={`${theme.colors.neonCyan}AA`}
              style={styles.headerBtn}
            >
              <Phone size={18} color={theme.colors.mutedForeground} />
            </HapticPressable>
          )}
          {onMorePress && (
            <HapticPressable
              onPress={onMorePress}
              neonBorder
              borderColor={`${theme.colors.neonPink}AA`}
              style={styles.headerBtn}
            >
              <MoreVertical size={18} color={theme.colors.mutedForeground} />
            </HapticPressable>
          )}
        </View>
      </MotiView>

      <ScrollView
        ref={(r) => {
          scrollRef.current = r
        }}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg, index) => (
          <MotiView
            key={msg.id}
            from={{ opacity: 0, translateY: 10, scale: 0.98 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{
              type: "timing",
              duration: 220,
              delay: index * 35,
            }}
            style={{ alignItems: msg.isMe ? "flex-end" : "flex-start" }}
          >
            <View style={{ maxWidth: "85%" }}>
              {!msg.isMe ? (
                <Text
                  style={{
                    color: theme.colors.neonCyan,
                    fontSize: 12,
                    fontFamily: "Orbitron_700Bold",
                    marginBottom: 4,
                  }}
                >
                  {msg.sender}
                </Text>
              ) : null}

              {msg.uri ? (
                <Image
                  source={{ uri: msg.uri }}
                  style={[
                    styles.imageMessage,
                    {
                      borderColor: theme.colors.border,
                    },
                  ]}
                  contentFit="cover"
                />
              ) : null}

              {msg.reply && (
                <View
                  style={[
                    styles.replyContainer,
                    {
                      borderColor: theme.colors.neonCyan,
                      backgroundColor: `${theme.colors.neonCyan}11`,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.colors.neonCyan,
                      fontSize: 12,
                      fontFamily: "Orbitron_700Bold",
                      marginBottom: 2,
                    }}
                  >
                    {msg.reply.sender}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.mutedForeground,
                      fontSize: 11,
                    }}
                    numberOfLines={2}
                  >
                    {msg.reply.content}
                  </Text>
                </View>
              )}

              {msg.isMe ? (
                <View style={[styles.myBubble, { backgroundColor: theme.colors.neonPink }]}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_400Regular" }}>
                    {msg.content}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.theirBubble,
                    {
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      borderColor: "rgba(255, 255, 255, 0.12)",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.colors.foreground,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {msg.content}
                  </Text>
                </View>
              )}

              {msg.aiAction ? (
                <HapticPressable
                  neonBorder
                  borderColor={`${theme.colors.neonCyan}AA`}
                  style={[
                    styles.aiAction,
                    { backgroundColor: `${theme.colors.neonCyan}22` },
                  ]}
                >
                  <Sparkles size={14} color={theme.colors.neonCyan} />
                  <Text
                    style={{
                      color: theme.colors.neonCyan,
                      fontFamily: "Orbitron_900Black",
                      fontSize: 12,
                    }}
                  >
                    {msg.aiAction.label}
                  </Text>
                  <MapPin size={14} color={theme.colors.neonCyan} />
                </HapticPressable>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.mutedForeground,
                    fontSize: 11,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {formatMessageTime(msg.time)}
                </Text>
                {!msg.isMe && msg.status ? (
                  msg.status === "read" ? (
                    <CheckCheck size={14} color={theme.colors.neonCyan} />
                  ) : (
                    <Check size={14} color={theme.colors.neonCyan} />
                  )
                ) : null}
              </View>
            </View>
          </MotiView>
        ))}
      </ScrollView>

      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[
          styles.composer,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {onImagePress && (
            <HapticPressable
              onPress={onImagePress}
              neonBorder
              borderColor={`${theme.colors.neonCyan}AA`}
              style={[styles.iconBtn, { backgroundColor: "transparent" }]}
            >
              <ImageIcon size={20} color={theme.colors.mutedForeground} />
            </HapticPressable>
          )}
          <Input
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            containerStyle={{ flex: 1 }}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          {message.trim() ? (
            <HapticPressable
              neonBorder
              borderColor={`${theme.colors.neonPink}AA`}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: theme.colors.neonPink,
                  borderWidth: 1.5,
                },
              ]}
              onPress={handleSend}
            >
              <Send size={18} color="#fff" />
            </HapticPressable>
          ) : (
            <HapticPressable
              neonBorder
              borderColor={
                isRecording ? "#ff3b30AA" : `${theme.colors.neonCyan}AA`
              }
              style={[
                styles.sendBtn,
                {
                  backgroundColor: isRecording ? "#ff3b30" : "transparent",
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setIsRecording((v) => !v)}
            >
              <Mic
                size={18}
                color={isRecording ? "#fff" : theme.colors.mutedForeground}
              />
            </HapticPressable>
          )}
        </View>
      </MotiView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  thread: {
    flex: 1,
    backgroundColor: "#050505",
  },
  threadHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  myBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  theirBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  replyContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderLeftWidth: 3,
    borderRadius: 5,
    marginBottom: 10,
  },
  imageMessage: {
    width: 200,
    minHeight: 200,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  aiAction: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  composer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
})
