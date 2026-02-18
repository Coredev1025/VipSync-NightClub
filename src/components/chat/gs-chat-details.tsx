import { Image } from "expo-image"
import {
    ArrowLeft,
    Camera,
    CheckCheck,
    MapPin,
    MoreVertical,
    Phone,
    Send,
    Smile,
    Sparkles,
    User,
    Wine,
} from "lucide-react-native"
import * as React from "react"
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    useColorScheme,
    useWindowDimensions,
    View,
    type TextStyle,
    type ViewStyle,
} from "react-native"
import Animated, {
    FadeInLeft,
    FadeInRight,
    SlideInDown
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

import { HapticPressable } from "@/components/ui/haptic-pressable"
import { useTheme } from "@/theme/theme-provider"

export interface ChatMessage {
  id: number | string
  msg: string
  time: string
  me: boolean
  uri?: string
  reply?: number
  sender?: string
  role?: string
}

export interface ChatOrderFromMessage {
  tableNumber: number
  guest: string
  items: string
}

export interface ChatDetailsProps {
  contactName?: string
  contactAvatar?: string
  lastSeen?: string
  onBack: () => void
  onProfilePress?: () => void
  onCallPress?: () => void
  onMorePress?: () => void
  onEmojiPress?: () => void
  onCameraPress?: () => void
  onSendMessage?: (message: string) => void
  onEmojiSelect?: (emoji: string) => void
  /** When provided, messages are controlled by parent (e.g. from API). Send only calls onSendMessage. */
  messages?: ChatMessage[] | null
  initialMessages?: ChatMessage[]
  emojiToInsert?: string
  onOrderSynced?: (order: ChatOrderFromMessage) => void
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  } catch {
    return ""
  }
}

export function GSChatDetails({
  contactName = "Jason Holder",
  contactAvatar = "https://i.pravatar.cc/320?u=dev@geekspark.com",
  lastSeen = "last seen today at 4:10 pm",
  onBack,
  onProfilePress,
  onCallPress,
  onMorePress,
  onEmojiPress,
  onCameraPress,
  onSendMessage,
  onEmojiSelect,
  messages: controlledMessages,
  initialMessages,
  emojiToInsert,
  onOrderSynced,
}: ChatDetailsProps) {
  const mode = useColorScheme()
  const { theme } = useTheme()
  const behavior = Platform.OS === "ios" ? "height" : "padding"
  const chatRef = React.useRef<FlatList>(null)
  const [options, setOptions] = React.useState(false)
  const [addToMapSynced, setAddToMapSynced] = React.useState(false)
  const defaultMessages: ChatMessage[] = [
    { id: 1, msg: "Hey There Jason Holder. How can I help you today?", time: new Date().toISOString(), me: false },
    { id: 2, msg: "Hello", time: new Date().toISOString(), me: true },
    { id: 3, msg: "How are you?", time: new Date().toISOString(), me: true },
    { id: 4, msg: "I m fine. WBU?", time: new Date().toISOString(), me: false },
    { id: 5, msg: "Great. 😊😊😊😊", time: new Date().toISOString(), me: true },
    { id: 6, msg: "Nice", time: new Date().toISOString(), me: false },
    { id: 7, msg: "Send some pictures", time: new Date().toISOString(), me: false },
    { id: 8, msg: "Sure. Sending right away", time: new Date().toISOString(), me: true },
  ]
  const [localChatData, setLocalChatData] = React.useState<ChatMessage[]>(initialMessages ?? defaultMessages)
  const [message, setMessage] = React.useState("")

  const isControlled = controlledMessages != null
  const chatData = isControlled ? controlledMessages : localChatData

  const displayName = (contactName?.trim() || "Unknown").trim()
  const headerSubtitle = lastSeen
  const showGeminiBlock = contactName === "Main Ops" && chatData.length >= 2
  const lastMsg = chatData[chatData.length - 1]
  const lastMsgIsOrder = lastMsg && !lastMsg.me && /table\s*\d/i.test(lastMsg.msg) && /james|collon|bottle/i.test(lastMsg.msg)

  // Insert emoji when emojiToInsert changes
  React.useEffect(() => {
    if (emojiToInsert) {
      setMessage((prev) => prev + emojiToInsert)
    }
  }, [emojiToInsert])

  const sendMessage = () => {
    if (!message.trim()) return
    const text = message
    setMessage("")
    if (isControlled) {
      onSendMessage?.(text)
      setTimeout(() => {
        chatRef.current?.scrollToEnd({ animated: true })
      }, 100)
      return
    }
    const newMessage: ChatMessage = {
      id: localChatData.length + 1,
      msg: text,
      time: new Date().toISOString(),
      me: true,
    }
    setLocalChatData((prev) => [...prev, newMessage])
    onSendMessage?.(text)
    setTimeout(() => {
      chatRef.current?.scrollToIndex({
        animated: true,
        index: localChatData.length,
      })
    }, 200)
  }

  const getStyles = (mode: string | null | undefined) => {
    const isDark = mode === "dark"
    return {
      container: {
        flex: 1,
        backgroundColor: "#050505",
      },
      topBar: {
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
      chatListing: {
        minHeight: "100%" as ViewStyle["minHeight"],
        paddingBottom: 60,
        paddingHorizontal: 15,
        backgroundColor: "#050505",
        paddingTop: 15,
      },
      chatBubble: {
        alignSelf: "flex-start" as const,
        padding: 12,
        backgroundColor: theme.colors.card,
        marginBottom: 10,
        borderTopRightRadius: 14,
        borderBottomRightRadius: 14,
        borderBottomLeftRadius: 14,
        borderTopLeftRadius: 4,
        maxWidth: "80%" as ViewStyle["maxWidth"],
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      chatBubbleMe: {
        backgroundColor: isDark
          ? `${theme.colors.neonPink}99`
          : `${theme.colors.neonPink}22`,
        alignSelf: "flex-end" as const,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
        borderBottomLeftRadius: 15,
      },
      chatText: {
        fontSize: 15,
        color: theme.colors.foreground,
        fontFamily: "Inter_400Regular",
      },
      replyContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderLeftWidth: 3,
        borderColor: theme.colors.neonCyan,
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: isDark
          ? "rgba(0,0,0,0.2)"
          : "rgba(0,0,0,0.04)",
      },
      replyUser: {
        color: theme.colors.neonCyan,
        fontSize: 12,
        marginBottom: 2,
        fontFamily: "Inter_500Medium",
      },
      replyMessage: {
        fontSize: 10,
        color: theme.colors.mutedForeground,
        fontFamily: "Inter_400Regular",
      },
      chatTime: {
        fontSize: 10,
        color: theme.colors.mutedForeground,
        fontFamily: "Inter_400Regular",
      },
      chatInputHolder: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingHorizontal: 15,
        position: "absolute" as const,
        bottom: 0,
        paddingVertical: 10,
        backgroundColor: "#18181f",
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      chatInput: {
        flex: 1,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        backgroundColor: isDark ? theme.colors.card : theme.colors.card,
        marginRight: 10,
        height: 47,
        paddingHorizontal: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      chatInputText: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 15,
        color: theme.colors.foreground,
        fontFamily: "Inter_400Regular",
      },
      sendBtn: {
        width: 47,
        height: 47,
        borderRadius: 25,
        backgroundColor: theme.colors.neonPink,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
    }
  }

  const styles = getStyles(mode)

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <KeyboardAvoidingView behavior={behavior} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={onBack} style={{ marginRight: 3 }}>
              <ArrowLeft size={20} color={theme.colors.foreground} />
            </Pressable>

            <Pressable onPress={onProfilePress} style={{ marginLeft: 3 }}>
              <Image
                source={{ uri: contactAvatar }}
                style={{ width: 40, height: 40, borderRadius: 25 }}
                contentFit="cover"
              />
            </Pressable>

            <View style={{ marginLeft: 13 }}>
              <Text style={styles.topBarMainText}>{displayName}</Text>
              <Text style={styles.topBarSecText}>{headerSubtitle}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {onCallPress && (
              <Pressable onPress={onCallPress} style={{ marginRight: 15 }}>
                <Phone size={20} color={theme.colors.foreground} />
              </Pressable>
            )}

            {onMorePress && (
              <Pressable onPress={onMorePress}>
                <MoreVertical size={20} color={theme.colors.foreground} />
              </Pressable>
            )}
          </View>
        </View>

        <FlatList
          ref={chatRef}
          showsVerticalScrollIndicator={false}
          bounces={false}
          data={chatData}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <ChatItem chat={item} styles={styles} index={index} />
          )}
          ListFooterComponent={
            showGeminiBlock && lastMsgIsOrder ? (
              <GeminiIntelligenceBlock
                theme={theme}
                synced={addToMapSynced}
                onAddToMap={() => setAddToMapSynced(true)}
                onOrderSyncedTap={() =>
                  onOrderSynced?.({ tableNumber: 2, guest: "James", items: "2x Collon" })
                }
              />
            ) : null
          }
          contentContainerStyle={styles.chatListing}
        />

        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          style={styles.chatInputHolder}
        >
          <View style={styles.chatInput}>
            {onEmojiPress && (
              <Pressable onPress={onEmojiPress}>
                <Smile size={20} color={theme.colors.mutedForeground} />
              </Pressable>
            )}

            <TextInput
              placeholder="Message"
              style={styles.chatInputText}
              placeholderTextColor={theme.colors.mutedForeground}
              onChangeText={setMessage}
              value={message}
              onSubmitEditing={sendMessage}
            />

            {onCameraPress && (
              <Pressable onPress={onCameraPress}>
                <Camera size={20} color={theme.colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          <Pressable onPress={sendMessage} style={styles.sendBtn}>
            <Send size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function GeminiIntelligenceBlock({
  theme,
  synced,
  onAddToMap,
  onOrderSyncedTap,
}: {
  theme: ReturnType<typeof useTheme>["theme"]
  synced: boolean
  onAddToMap: () => void
  onOrderSyncedTap: () => void
}) {
  return (
    <View style={{ marginTop: 16, marginBottom: 24 }}>
      <View
        style={{
          borderWidth: 1.5,
          borderColor: theme.colors.neonPurple ?? theme.colors.neonPink,
          borderRadius: 12,
          padding: 12,
          backgroundColor: `${theme.colors.neonPurple ?? theme.colors.neonPink}18`,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Sparkles size={14} color={theme.colors.neonPurple ?? theme.colors.neonPink} />
          <Text
            style={{
              color: theme.colors.neonPurple ?? theme.colors.neonPink,
              fontFamily: "Orbitron_700Bold",
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            GEMINI INTELLIGENCE
          </Text>
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MapPin size={14} color={theme.colors.neonPink} />
            <Text style={{ color: theme.colors.foreground, fontSize: 12 }}>Table: 2</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <User size={14} color={theme.colors.mutedForeground} />
            <Text style={{ color: theme.colors.foreground, fontSize: 12 }}>Guest: James</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Wine size={14} color={theme.colors.neonGreen} />
            <Text style={{ color: theme.colors.foreground, fontSize: 12 }}>Item: 2x Collon</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          {synced ? (
            <HapticPressable
              onPress={onOrderSyncedTap}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: theme.colors.neonGreen,
                borderWidth: 1,
                borderColor: `${theme.colors.neonGreen}AA`,
              }}
            >
              <CheckCheck size={16} color={theme.colors.background} />
              <Text style={{ color: theme.colors.background, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                SYNCED ✓
              </Text>
            </HapticPressable>
          ) : (
            <HapticPressable
              onPress={onAddToMap}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: theme.colors.neonPink,
                borderWidth: 1,
                borderColor: `${theme.colors.neonPink}AA`,
              }}
            >
              <MapPin size={14} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>ADD TO MAP</Text>
            </HapticPressable>
          )}
          <Pressable
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: theme.colors.muted,
              borderWidth: 1,
              borderColor: theme.colors.border,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: theme.colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
              IGNORE
            </Text>
          </Pressable>
        </View>
      </View>
      {synced ? (
        <HapticPressable
          onPress={onOrderSyncedTap}
          style={{
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: theme.colors.neonGreen,
            borderWidth: 1,
            borderColor: `${theme.colors.neonGreen}AA`,
          }}
        >
          <CheckCheck size={20} color={theme.colors.background} />
          <Text style={{ color: theme.colors.background, fontFamily: "Inter_700Bold", fontSize: 14 }}>
            Order Synced. Tap to View Map.
          </Text>
        </HapticPressable>
      ) : null}
      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: theme.colors.muted,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.neonCyan, opacity: 0.9 }} />
        <Text style={{ color: theme.colors.foreground, fontSize: 12, flex: 1 }}>OPS ALERT</Text>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>NOW</Text>
      </View>
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginTop: 6, marginLeft: 4 }}>
        VIP Table 3 is 1 mile away.
      </Text>
    </View>
  )
}

interface ChatItemStyles {
  chatBubble: ViewStyle
  chatBubbleMe: ViewStyle
  chatText: TextStyle
  replyContainer: ViewStyle
  replyUser: TextStyle
  replyMessage: TextStyle
  chatTime: TextStyle
}

function ChatItem({
  chat,
  styles,
  index,
}: {
  chat: ChatMessage
  styles: ChatItemStyles
  index: number
}) {
  const { width } = useWindowDimensions()
  const { theme } = useTheme()

  return (
    <Animated.View
      entering={
        chat.me
          ? FadeInRight.delay(index * 30).duration(250).springify()
          : FadeInLeft.delay(index * 30).duration(250).springify()
      }
    >
      {chat.sender ? (
        <Text
          style={{
            color: theme.colors.neonCyan,
            fontSize: 11,
            fontFamily: "Inter_600SemiBold",
            marginBottom: 4,
          }}
        >
          {chat.sender} {chat.role ? ` · ${chat.role}` : ""}
        </Text>
      ) : null}
      <View
        style={[
          styles.chatBubble,
          chat.me ? styles.chatBubbleMe : null,
        ]}
      >
        {chat.uri && (
          <Image
            source={{ uri: chat.uri }}
            style={{ width: 0.6 * width, minHeight: 200, borderRadius: 10 }}
            contentFit="cover"
          />
        )}

        {chat.reply && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyUser}>Jason Holder</Text>
            <Text style={styles.replyMessage}>Nice</Text>
          </View>
        )}

        {!chat.uri && <Text style={styles.chatText}>{chat.msg}</Text>}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 3,
          }}
        >
          <Text style={styles.chatTime}>{formatTime(chat.time)}</Text>
          {chat.me && (
            <CheckCheck
              size={12}
              color={theme.colors.neonCyan}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>
    </Animated.View>
  )
}

