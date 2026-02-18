import { ArrowLeft, CheckCheck, Phone, Plus, Search, Send } from "lucide-react-native"
import { AnimatePresence, MotiView } from "moti"
import * as React from "react"
import {
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native"

import type { GuestChatMessage } from "@/components/guest/guest-types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NeonAvatar, NeonAvatarGroup } from "@/components/ui/neon-avatar"
import { resolveAvatar } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

function createMessageId() {
  return `gcm_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function createVenueReply(
  text: string,
  options?: Pick<
    GuestChatMessage,
    "threadId" | "authorName" | "authorAvatarSrc" | "authorFallback"
  >
): GuestChatMessage {
  return {
    id: createMessageId(),
    sender: "venue",
    threadId: options?.threadId,
    authorName: options?.authorName,
    authorAvatarSrc: options?.authorAvatarSrc,
    authorFallback: options?.authorFallback,
    text,
    createdAtISO: new Date().toISOString(),
  }
}

function createGuestMessage(
  text: string,
  options?: Pick<GuestChatMessage, "threadId">
): GuestChatMessage {
  return {
    id: createMessageId(),
    sender: "guest",
    threadId: options?.threadId,
    text,
    createdAtISO: new Date().toISOString(),
  }
}

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function formatShortTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / (60 * 1000)))
  if (diffMin < 1) return "now"
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d`
}

function formatMessageTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

interface GuestChatThread {
  id: string
  title: string
  subtitle: string
  kind: "group" | "direct"
  membersCount?: number
  avatars: Array<{ src?: string; fallback: string }>
}

function getDefaultMessages(): GuestChatMessage[] {
  return []
}

function getAutoReply(userText: string) {
  if (!userText.trim()) return "How can we help?"
  return "Thanks — a host will reply shortly. If you need faster service, please call the venue."
}

function getThreadIdOrDefault(value: string | undefined) {
  return value && value.trim() ? value : "vip-ops"
}

function getThreadLastMessage(messages: GuestChatMessage[], threadId: string) {
  const list = messages.filter((m) => getThreadIdOrDefault(m.threadId) === threadId)
  if (!list.length) return null
  return list.reduce<GuestChatMessage>((best, next) => {
    const bt = new Date(best.createdAtISO).getTime()
    const nt = new Date(next.createdAtISO).getTime()
    if (Number.isNaN(bt)) return next
    if (Number.isNaN(nt)) return best
    return nt >= bt ? next : best
  }, list[0]!)
}

function getThreadUnreadCount(messages: GuestChatMessage[], threadId: string) {
  const list = messages.filter((m) => getThreadIdOrDefault(m.threadId) === threadId)
  if (!list.length) return 0
  const lastGuestIdx = [...list].map((m) => m.sender).lastIndexOf("guest")
  const after = lastGuestIdx === -1 ? list : list.slice(lastGuestIdx + 1)
  const count = after.filter((m) => m.sender === "venue").length
  return Math.min(9, count)
}

export function GuestChatTab({
  messages,
  onChangeMessages,
}: {
  messages: GuestChatMessage[]
  onChangeMessages: (next: GuestChatMessage[]) => void
}) {
  const { theme } = useTheme()
  const [text, setText] = React.useState("")
  const [isReplying, setIsReplying] = React.useState(false)
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null)
  const [listFilter, setListFilter] = React.useState<"all" | "groups" | "unread">("all")
  const [query, setQuery] = React.useState("")
  const listRef = React.useRef<ScrollView | null>(null)

  const resolvedActiveThreadId = activeThreadId ?? "vip-ops"
  const activeMessages = messages.filter(
    (m) => getThreadIdOrDefault(m.threadId) === resolvedActiveThreadId
  )

  React.useEffect(() => {
    listRef.current?.scrollToEnd?.({ animated: true })
  }, [messages.length, activeThreadId])

  const threads = React.useMemo(() => {
    const byId = new Map<string, GuestChatThread>()
    for (const m of messages) {
      const tid = getThreadIdOrDefault(m.threadId)
      if (byId.has(tid)) continue
      byId.set(tid, {
        id: tid,
        title: tid,
        subtitle: "",
        kind: "direct",
        avatars: [{ fallback: tid.slice(0, 2).toUpperCase() }],
      })
    }
    const list = [...byId.values()].map((t) => {
      const last = getThreadLastMessage(messages, t.id)
      const subtitle = last?.text?.replace(/\s+/g, " ").slice(0, 24) ?? t.subtitle
      return { ...t, subtitle }
    })
    list.sort((a, b) => {
      const la = getThreadLastMessage(messages, a.id)?.createdAtISO ?? isoMinutesAgo(999999)
      const lb = getThreadLastMessage(messages, b.id)?.createdAtISO ?? isoMinutesAgo(999999)
      return new Date(lb).getTime() - new Date(la).getTime()
    })
    return list
  }, [messages])

  const filteredThreads = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return threads.filter((t) => {
      if (listFilter === "groups" && t.kind !== "group") return false
      const unread = getThreadUnreadCount(messages, t.id)
      if (listFilter === "unread" && unread === 0) return false
      if (!q) return true
      const last = getThreadLastMessage(messages, t.id)
      const hay = `${t.title} ${t.subtitle} ${last?.text ?? ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [threads, query, listFilter, messages])

  const handleSend = () => {
    const cleaned = text.trim()
    if (!cleaned) return

    const next = [
      ...messages,
      createGuestMessage(cleaned, { threadId: resolvedActiveThreadId }),
    ]
    onChangeMessages(next)
    setText("")
    setIsReplying(true)

    setTimeout(() => {
      const replyText =
        resolvedActiveThreadId === "vip-ops"
          ? getAutoReply(cleaned)
          : "Copy — we’re on it."

      onChangeMessages([...next, createVenueReply(replyText)])
      setIsReplying(false)
    }, 650)
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#050505" }}>
      <MotiView
        from={{ opacity: 0.12, translateX: 0, translateY: 0 }}
        animate={{ opacity: 0.16, translateX: 10, translateY: 12 }}
        transition={{ type: "timing", duration: 9000, loop: true }}
        style={[styles.blob, { top: -30, left: 30, backgroundColor: "rgba(255, 0, 170, 0.12)" }]}
      />
      <MotiView
        from={{ opacity: 0.12, translateX: 0, translateY: 0 }}
        animate={{ opacity: 0.16, translateX: -12, translateY: -14 }}
        transition={{ type: "timing", duration: 10000, loop: true, delay: 500 }}
        style={[styles.blob, { top: 120, right: -50, backgroundColor: "rgba(0, 220, 255, 0.12)" }]}
      />
      <MotiView
        from={{ opacity: 0.10, translateX: 0, translateY: 0 }}
        animate={{ opacity: 0.14, translateX: -10, translateY: 10 }}
        transition={{ type: "timing", duration: 11000, loop: true, delay: 200 }}
        style={[styles.blob, { bottom: 60, left: 40, backgroundColor: "rgba(187, 120, 255, 0.10)" }]}
      />

      <AnimatePresence>
        {activeThreadId === null ? (
          <MotiView
            key="list"
            from={{ opacity: 0, translateX: 10 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -10 }}
            style={{ flex: 1 }}
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Search size={16} color={theme.colors.mutedForeground} />
                <Input
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search conversations..."
                  containerStyle={{ flex: 1, backgroundColor: theme.colors.input }}
                />
              </View>

              <View style={{ alignSelf: "flex-start" }}>
                <Button
                  variant="outline"
                  tone="pink"
                  style={{ borderRadius: 999, height: 40, paddingHorizontal: 16 }}
                  onPress={() => setActiveThreadId("vip-ops")}
                >
                  <View style={styles.rowCenter}>
                    <Plus size={16} color={theme.colors.neonPink} />
                    <Text style={{ color: theme.colors.neonPink, fontFamily: "Orbitron_900Black" }}>New Chat</Text>
                  </View>
                </Button>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {([
                  { id: "all", label: "All" },
                  { id: "groups", label: "Groups" },
                  { id: "unread", label: "Unread" },
                ] as const).map((t) => {
                  const isActive = listFilter === t.id
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setListFilter(t.id)}
                      style={[
                        styles.filter,
                        {
                          backgroundColor: isActive ? `${theme.colors.neonCyan}22` : theme.colors.muted,
                          borderColor: isActive ? `${theme.colors.neonCyan}33` : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isActive ? theme.colors.neonCyan : theme.colors.mutedForeground,
                          fontFamily: "Orbitron_900Black",
                        }}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 16 }}>
              {filteredThreads.map((t) => {
                const last = getThreadLastMessage(messages, t.id)
                const time = last ? formatShortTime(last.createdAtISO) : ""
                const unread = getThreadUnreadCount(messages, t.id)
                return (
                  <Pressable key={t.id} onPress={() => setActiveThreadId(t.id)} style={{ paddingHorizontal: 6 }}>
                    <View style={styles.threadRow}>
                      <View style={{ width: 48, alignItems: "center" }}>
                        {t.kind === "group" ? (
                          <NeonAvatarGroup
                            avatars={t.avatars.map((a) => ({
                              source: resolveAvatar(a.src),
                              fallback: a.fallback,
                              status: "online",
                            }))}
                            max={3}
                            size="sm"
                            glow="cyan"
                          />
                        ) : (
                          <NeonAvatar
                            source={resolveAvatar(t.avatars[0]?.src)}
                            fallback={t.avatars[0]?.fallback ?? "U"}
                            size="md"
                            glow="cyan"
                            status="online"
                            showRing
                          />
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", flex: 1 }} numberOfLines={1}>
                            {t.title}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {time ? (
                              <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
                                {time}
                              </Text>
                            ) : null}
                            {unread > 0 ? (
                              <View style={[styles.unread, { backgroundColor: theme.colors.neonPink }]}>
                                <Text style={{ color: "#fff", fontFamily: "Orbitron_900Black" }}>{unread}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <Text style={{ color: theme.colors.mutedForeground, marginTop: 4 }} numberOfLines={1}>
                          {t.subtitle}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )
              })}
              {filteredThreads.length === 0 ? (
                <Text style={{ color: theme.colors.mutedForeground, textAlign: "center", paddingVertical: 30 }}>
                  No conversations found.
                </Text>
              ) : null}
            </ScrollView>
          </MotiView>
        ) : (
          <MotiView
            key="thread"
            from={{ opacity: 0, translateX: 10 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -10 }}
            style={{ flex: 1 }}
          >
            <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
              <Card variant="glass" style={{ padding: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Button
                    size="icon"
                    variant="ghost"
                    onPress={() => setActiveThreadId(null)}
                    accessibilityLabel="Back"
                  >
                    <ArrowLeft size={20} color={theme.colors.foreground} />
                  </Button>

                  {(() => {
                    const thread = threads.find((t) => t.id === resolvedActiveThreadId)
                    if (!thread) return null
                    return (
                      <>
                        <View style={{ width: 50, alignItems: "center" }}>
                          {thread.kind === "group" ? (
                            <NeonAvatarGroup
                              avatars={thread.avatars.map((a) => ({
                                source: resolveAvatar(a.src),
                                fallback: a.fallback,
                                status: "online",
                              }))}
                              max={3}
                              size="sm"
                              glow="cyan"
                            />
                          ) : (
                            <NeonAvatar
                              source={resolveAvatar(thread.avatars[0]?.src)}
                              fallback={thread.avatars[0]?.fallback ?? "U"}
                              size="sm"
                              glow="cyan"
                              status="online"
                              showRing
                            />
                          )}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }} numberOfLines={1}>
                            {thread.title}
                          </Text>
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }} numberOfLines={1}>
                            {thread.kind === "group"
                              ? `${thread.membersCount ?? thread.avatars.length} members`
                              : "Online"}
                          </Text>
                        </View>
                        <Button size="icon" variant="ghost" accessibilityLabel="Call">
                          <Phone size={20} color={theme.colors.foreground} />
                        </Button>
                      </>
                    )
                  })()}
                </View>
              </Card>
            </View>

            <ScrollView
              ref={(r) => {
                listRef.current = r
              }}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 16, gap: 10 }}
              onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
            >
              {activeMessages.map((m, index) => {
                const isGuest = m.sender === "guest"
                const author = m.authorName ?? (isGuest ? "You" : "VIPsync")
                const time = formatMessageTime(m.createdAtISO)

                return (
                  <MotiView
                    key={m.id}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 180, delay: Math.min(index * 18, 180) }}
                    style={{ alignItems: isGuest ? "flex-end" : "flex-start" }}
                  >
                    <View style={{ maxWidth: "86%" }}>
                      {!isGuest ? (
                        <Text style={{ color: theme.colors.neonCyan, fontFamily: "Orbitron_900Black", marginLeft: 6, marginBottom: 4 }}>
                          {author}
                        </Text>
                      ) : null}

                      <Card
                        variant="glass"
                        style={[
                          styles.bubble,
                          {
                            borderWidth: 0,
                            backgroundColor: isGuest ? "transparent" : theme.colors.muted,
                          },
                        ]}
                      >
                        {isGuest ? (
                          <View style={[styles.bubbleGradient, { backgroundColor: theme.colors.neonPink }]}>
                            <Text style={{ color: "#fff", lineHeight: 18 }}>{m.text}</Text>
                          </View>
                        ) : (
                          <Text style={{ color: theme.colors.foreground, lineHeight: 18 }}>{m.text}</Text>
                        )}
                      </Card>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, justifyContent: isGuest ? "flex-end" : "flex-start" }}>
                        {time ? (
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{time}</Text>
                        ) : null}
                        {isGuest ? <CheckCheck size={14} color={theme.colors.neonCyan} /> : null}
                      </View>
                    </View>
                  </MotiView>
                )
              })}

              <AnimatePresence>
                {isReplying ? (
                  <MotiView
                    key="typing"
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: 10 }}
                    style={{ alignItems: "flex-start" }}
                  >
                    <Card variant="glass" style={[styles.bubble, { backgroundColor: theme.colors.muted }]}>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {[0, 1, 2].map((i) => (
                          <MotiView
                            key={i}
                            from={{ translateY: 0, opacity: 0.6 }}
                            animate={{ translateY: -4, opacity: 1 }}
                            transition={{ type: "timing", duration: 600, loop: true, delay: i * 120 }}
                            style={[styles.dot, { backgroundColor: theme.colors.neonCyan }]}
                          />
                        ))}
                      </View>
                    </Card>
                  </MotiView>
                ) : null}
              </AnimatePresence>
            </ScrollView>

            <KeyboardAvoidingView behavior="padding">
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                <Card variant="glass" style={{ padding: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Input
                      value={text}
                      onChangeText={setText}
                      placeholder="Type a message..."
                      containerStyle={{ flex: 1, backgroundColor: theme.colors.input }}
                      onSubmitEditing={handleSend}
                      returnKeyType="send"
                    />
                    <Pressable
                      onPress={handleSend}
                      disabled={!text.trim()}
                      style={[
                        styles.sendBtn,
                        { backgroundColor: theme.colors.neonPink, opacity: text.trim() ? 1 : 0.5 },
                      ]}
                    >
                      <Send size={18} color="#fff" />
                    </Pressable>
                  </View>
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, marginTop: 8 }}>
                    Guest chat UI (local only). This version does not yet sync with staff in real time.
                  </Text>
                </Card>
              </View>
            </KeyboardAvoidingView>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  )
}

export function getDefaultGuestChatMessages() {
  return getDefaultMessages()
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  filter: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  threadRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 18,
  },
  unread: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: "hidden",
  },
  bubbleGradient: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: -14,
    marginVertical: -10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
})

