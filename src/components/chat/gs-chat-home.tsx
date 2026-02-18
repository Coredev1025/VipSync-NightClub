import { Image } from "expo-image"
import { CheckCheck, MessageSquarePlus, Search } from "lucide-react-native"
import * as React from "react"
import {
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
    useColorScheme
} from "react-native"

import { useTheme } from "@/theme/theme-provider"

export interface ChatItem {
  id: number | string
  img: string
  name: string
  phone?: string
  lastMsg: string
  time: string
  seen: boolean
  unread: number
  group: boolean
}

interface ChatHomeProps {
  onChatPress: (chat: ChatItem) => void
  onAddChatPress: () => void
  onGroupPress?: (chat: ChatItem) => void
  onProfilePress?: (chat: ChatItem) => void
  /** When true, Main Ops is excluded from the chat list (e.g. user/guest mode). */
  hideMainOps?: boolean
  /** When provided, use this list instead of the default hardcoded chats (e.g. from API). */
  chats?: ChatItem[] | null
}

function displayTime(timestamp: string): string {
  try {
    const now = new Date()
    const givenTime = new Date(timestamp)
    const diffMs = now.getTime() - givenTime.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return givenTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return givenTime.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  } catch {
    return ""
  }
}

function ellipString(str: string, size: number): string {
  if (str.length > size) {
    return str.substring(0, size) + "..."
  }
  return str
}

type ChatHomeStyles = {
  container: any
  searchBar: any
  searchBarInput: any
  chatContainer: any
  chatAvatar: any
  chatMessageHolder: any
  chatUsername: any
  chatMessage: any
  chatTime: any
  activeBadge: any
  badgeText: any
  activeText: any
  floatingBtn: any
  chatFilter: any
  chatFilterText: any
  activeChatFilter: any
  activeChatFilterText: any
}

const MAIN_OPS_NAME = "Main Ops"

export function GSChatHome({
  onChatPress,
  onAddChatPress,
  onGroupPress,
  onProfilePress,
  hideMainOps = false,
  chats: chatsProp,
}: ChatHomeProps) {
  const colorScheme = useColorScheme()
  const { theme } = useTheme()
  const [active, setActive] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState("")

  const baseChatData = React.useMemo<ChatItem[]>(
    () => (Array.isArray(chatsProp) ? chatsProp : []),
    [chatsProp]
  )
  const chatData = hideMainOps
    ? baseChatData.filter((item) => item.name !== MAIN_OPS_NAME)
    : baseChatData

  const groupData = chatData.filter((item) => item.group)
  const unreadData = chatData.filter((item) => !item.seen)

  const filteredData = React.useMemo(() => {
    const data = active === 2 ? unreadData : active === 3 ? groupData : chatData
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase()
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.phone?.toLowerCase().includes(query) ?? false) ||
        item.lastMsg.toLowerCase().includes(query)
    )
  }, [active, searchQuery, chatData, groupData, unreadData])

  function getChatDisplayName(item: ChatItem): string {
    return (item.name?.trim() || item.phone || "Unknown").trim()
  }

  const getStyles = (mode: string | null | undefined) => {
    const isDark = mode === "dark"
    return {
      container: {
        flex: 1,
        backgroundColor: "#050505",
      },
      searchBar: {
        backgroundColor: isDark ? theme.colors.input : theme.colors.muted,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 18,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: 36,
      },
      searchBarInput: {
        fontSize: 14,
        flex: 1,
        marginLeft: 10,
        color: theme.colors.foreground,
        fontFamily: "Inter_400Regular",
      },
      chatContainer: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingVertical: 12,
      },
      chatAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
      },
      chatMessageHolder: {
        flexDirection: "row" as const,
        flex: 1,
        marginLeft: 13,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
      },
      chatUsername: {
        fontSize: 16,
        marginBottom: 2,
        color: theme.colors.foreground,
        fontFamily: "Inter_500Medium",
      },
      chatMessage: {
        fontSize: 13,
        color: theme.colors.mutedForeground,
        marginLeft: 2,
        fontFamily: "Inter_400Regular",
      },
      chatTime: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        fontFamily: "Inter_400Regular",
      },
      activeBadge: {
        minWidth: 20,
        minHeight: 20,
        paddingHorizontal: 4,
        borderRadius: 10,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        backgroundColor: theme.colors.neonPink,
        marginTop: 6,
      },
      badgeText: {
        color: "#fff",
        fontSize: 10,
        fontFamily: "Inter_500Medium",
      },
      activeText: {
        color: theme.colors.neonPink,
        fontFamily: "Inter_600SemiBold",
      },
      floatingBtn: {
        position: "absolute" as const,
        bottom: 15,
        right: 15,
        width: 52,
        height: 52,
        backgroundColor: theme.colors.neonPink,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        borderRadius: 15,
      },
      chatFilter: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: isDark ? theme.colors.input : theme.colors.muted,
        alignSelf: "flex-start" as const,
        borderRadius: 15,
        marginRight: 5,
      },
      chatFilterText: {
        fontSize: 13,
        color: theme.colors.mutedForeground,
        fontFamily: "Inter_600SemiBold",
      },
      activeChatFilter: {
        backgroundColor: isDark
          ? `${theme.colors.neonCyan}33`
          : `${theme.colors.neonCyan}22`,
      },
      activeChatFilterText: {
        color: theme.colors.neonCyan,
      },
    }
  }

  const styles = getStyles(colorScheme)

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 15 }}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ChatItem
              item={item}
              displayName={getChatDisplayName(item)}
              onPress={() => onChatPress(item)}
              onAvatarPress={() => {
                if (item.group && onGroupPress) {
                  onGroupPress(item)
                } else if (!item.group && onProfilePress) {
                  onProfilePress(item)
                }
              }}
              styles={styles}
            />
          )}
          ListHeaderComponent={
            <SearchBar
              active={active}
              setActive={setActive}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              styles={styles}
            />
          }
        />
      </View>

      <Pressable onPress={onAddChatPress} style={styles.floatingBtn}>
        <MessageSquarePlus size={20} color="#fff" />
      </Pressable>
    </View>
  )
}

function SearchBar({
  active,
  setActive,
  searchQuery,
  onSearchChange,
  styles,
}: {
  active: number
  setActive: (id: number) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  styles: ChatHomeStyles
}) {
  const { theme } = useTheme()
  
  return (
    <>
      <View style={styles.searchBar}>
        <Search size={15} color={theme.colors.mutedForeground} />
        <TextInput
          placeholder="Search..."
          placeholderTextColor={theme.colors.mutedForeground}
          style={styles.searchBarInput}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>
      <ChatFilter active={active} setActive={setActive} styles={styles} />
    </>
  )
}

function ChatItem({
  item,
  displayName,
  onPress,
  onAvatarPress,
  styles,
}: {
  item: ChatItem
  displayName: string
  onPress: () => void
  onAvatarPress: () => void
  styles: ChatHomeStyles
}) {
  const { theme } = useTheme()
  const showPhoneSubtitle = item.phone && item.name?.trim() && item.phone !== displayName
  const hasLastMsg = Boolean(item.lastMsg?.trim())

  return (
    <Pressable onPress={onPress} style={styles.chatContainer}>
      <Pressable onPress={onAvatarPress}>
        <Image
          source={{ uri: item.img }}
          style={styles.chatAvatar}
          contentFit="cover"
        />
      </Pressable>

      <View style={styles.chatMessageHolder}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatUsername}>{displayName}</Text>
          {showPhoneSubtitle ? (
            <Text style={[styles.chatMessage, { marginTop: 2 }]} numberOfLines={1}>
              {item.phone}
            </Text>
          ) : null}
          {hasLastMsg ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: showPhoneSubtitle ? 2 : 0 }}>
              <CheckCheck size={14} color={theme.colors.mutedForeground} />
              <Text style={[styles.chatMessage, { marginLeft: 2 }]} numberOfLines={1}>
                {ellipString(item.lastMsg, 30)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[
              styles.chatTime,
              !item.seen ? styles.activeText : null,
            ]}
          >
            {displayTime(item.time)}
          </Text>
          {!item.seen && (
            <View style={styles.activeBadge}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

function ChatFilter({
  active,
  setActive,
  styles,
}: {
  active: number
  setActive: (id: number) => void
  styles: ChatHomeStyles
}) {
  const isActive = (id: number) => id === active

  const filterItems = [
    { id: 1, title: "All" },
    { id: 2, title: "Unread" },
    { id: 3, title: "Groups" },
  ]

  return (
    <View style={{ flexDirection: "row", marginVertical: 10 }}>
      {filterItems.map((item) => (
        <Pressable
          onPress={() => setActive(item.id)}
          style={[
            styles.chatFilter,
            isActive(item.id) ? styles.activeChatFilter : null,
          ]}
          key={item.id}
        >
          <Text
            style={[
              styles.chatFilterText,
              isActive(item.id) ? styles.activeChatFilterText : null,
            ]}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

