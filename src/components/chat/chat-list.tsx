import { CheckCheck, Plus, Search } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import {
    FlatList,
    StyleSheet,
    Text,
    View
} from "react-native"

import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { NeonAvatar, NeonAvatarGroup } from "@/components/ui/neon-avatar"
import { resolveAvatar } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

export interface ChatListItem {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  time: string
  unread: number
  isGroup?: boolean
  isOnline?: boolean
  members?: Array<{ src?: string; fallback: string }>
  seen?: boolean
}

interface ChatListProps {
  chats: ChatListItem[]
  onChatPress: (chat: ChatListItem) => void
  onNewChatPress: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  activeFilter?: "all" | "groups" | "unread"
  onFilterChange?: (filter: "all" | "groups" | "unread") => void
}

export function ChatList({
  chats,
  onChatPress,
  onNewChatPress,
  searchQuery = "",
  onSearchChange,
  activeFilter = "all",
  onFilterChange,
}: ChatListProps) {
  const { theme } = useTheme()

  const filteredChats = React.useMemo(() => {
    let filtered = chats

    // Apply filter
    if (activeFilter === "groups") {
      filtered = filtered.filter((chat) => chat.isGroup)
    } else if (activeFilter === "unread") {
      filtered = filtered.filter((chat) => chat.unread > 0)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (chat) =>
          chat.name.toLowerCase().includes(query) ||
          chat.lastMessage.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [chats, activeFilter, searchQuery])

  const formatTime = (time: string) => {
    // If time is already formatted (like "2m", "5m"), return as is
    if (/^\d+[mhd]$/.test(time)) return time

    // Otherwise, try to format from ISO string
    try {
      const date = new Date(time)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.floor(diffMs / (60 * 1000))

      if (diffMin < 1) return "now"
      if (diffMin < 60) return `${diffMin}m`
      const diffHr = Math.floor(diffMin / 60)
      if (diffHr < 24) return `${diffHr}h`
      const diffDay = Math.floor(diffHr / 24)
      return `${diffDay}d`
    } catch {
      return time
    }
  }

  const ellipsizeText = (text: string, maxLength: number = 30) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "..."
    }
    return text
  }

  return (
    <View style={styles.root}>
      {/* <Image
        source={images.bgChats}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory"
        priority="high"
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.8)" }]} /> */}

      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.searchWrap}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchIcon}>
            <Search size={16} color={theme.colors.mutedForeground} />
          </View>
          <Input
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search conversations..."
            containerStyle={{ flex: 1 }}
            style={{ paddingLeft: 30 }}
          />
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 80 }}
        style={styles.actions}
      >
        <HapticPressable
          onPress={onNewChatPress}
          neonBorder
          borderColor={`${theme.colors.neonPink}AA`}
          style={[
            styles.newChatBtn,
            {
              backgroundColor: `${theme.colors.neonPink}22`,
            },
          ]}
        >
          <View style={styles.rowCenter}>
            <Plus size={18} color={theme.colors.neonPink} />
            <Text style={[styles.pillText, { color: theme.colors.neonPink }]}>
              New Chat
            </Text>
          </View>
        </HapticPressable>

        {onFilterChange && (
          <View style={styles.filters}>
            {(["all", "groups", "unread"] as const).map((filter) => {
              const isActive = activeFilter === filter
              return (
                <HapticPressable
                  key={filter}
                  onPress={() => onFilterChange(filter)}
                  neonBorder
                  borderColor={
                    isActive
                      ? `${theme.colors.neonPink}AA`
                      : `${theme.colors.border}AA`
                  }
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor: isActive
                        ? theme.colors.neonPink
                        : "rgba(0,0,0,0.20)",
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isActive ? "#fff" : theme.colors.mutedForeground,
                      fontFamily: "Orbitron_900Black",
                      textTransform: "capitalize",
                      fontSize: 12,
                    }}
                  >
                    {filter}
                  </Text>
                </HapticPressable>
              )
            })}
          </View>
        )}
      </MotiView>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateX: -18 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 220, delay: index * 40 }}
          >
            <HapticPressable
              onPress={() => onChatPress(item)}
              neonBorder={false}
              style={[
                styles.chatRow,
                {
                  borderBottomColor: `${theme.colors.border}66`,
                  borderLeftWidth: 3,
                  borderLeftColor:
                    item.unread > 0
                      ? `${theme.colors.neonPink}AA`
                      : "transparent",
                },
              ]}
            >
              <View>
                {item.isGroup && item.members ? (
                  <NeonAvatarGroup
                    avatars={item.members.map((m) => ({
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
                    source={resolveAvatar(item.avatar)}
                    fallback={item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                    size="lg"
                    glow={item.isOnline ? "green" : "cyan"}
                    status={item.isOnline ? "online" : undefined}
                    showPulse={item.unread > 0}
                    showRing
                  />
                )}
              </View>

              <View style={styles.chatMeta}>
                <View style={styles.chatTopRow}>
                  <Text
                    style={[
                      styles.chatName,
                      { color: theme.colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      color:
                        item.unread > 0
                          ? theme.colors.neonPink
                          : theme.colors.mutedForeground,
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {formatTime(item.time)}
                  </Text>
                </View>
                <View style={styles.messageRow}>
                  {item.seen !== false && (
                    <CheckCheck
                      size={14}
                      color={theme.colors.mutedForeground}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={{ color: theme.colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {ellipsizeText(item.lastMessage)}
                  </Text>
                </View>
              </View>

              {item.unread > 0 ? (
                <View
                  style={[
                    styles.unread,
                    { backgroundColor: theme.colors.neonPink },
                  ]}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Orbitron_900Black",
                      fontSize: 12,
                    }}
                  >
                    {item.unread > 99 ? "99+" : item.unread}
                  </Text>
                </View>
              ) : null}
            </HapticPressable>
          </MotiView>
        )}
        contentContainerStyle={{ paddingBottom: 12 }}
        style={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    zIndex: 2,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  newChatBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pillText: {
    fontSize: 13,
    fontFamily: "Orbitron_900Black",
    letterSpacing: 0.2,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  chatMeta: {
    flex: 1,
    minWidth: 0,
  },
  chatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chatName: {
    fontSize: 14,
    fontFamily: "Orbitron_900Black",
    flex: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  unread: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24,
  },
})
