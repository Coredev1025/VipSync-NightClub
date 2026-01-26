"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Phone, Search, Send, CheckCheck, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NeonAvatar, NeonAvatarGroup } from "@/components/ui/neon-avatar"
import type { GuestChatMessage } from "@/components/guest/guest-types"
import { cn } from "@/lib/utils"

function createMessageId() {
  return `gcm_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function createVenueReply(
  text: string,
  options?: Pick<GuestChatMessage, "threadId" | "authorName" | "authorAvatarSrc" | "authorFallback">
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

const demoThreads: GuestChatThread[] = [
  {
    id: "vip-ops",
    title: "VIP Operations",
    subtitle: "Table 3 confirmed f...",
    kind: "group",
    membersCount: 5,
    avatars: [
      { src: "/images/avatars/man1.png", fallback: "A" },
      { src: "/images/avatars/man2.png", fallback: "B" },
      { src: "/images/avatars/man3.png", fallback: "C" },
      { src: "/images/avatars/man4.png", fallback: "D" },
      { src: "/images/avatars/woman1.png", fallback: "E" },
    ],
  },
  {
    id: "sarah",
    title: "Sarah Miller",
    subtitle: "I need 2 more bottles for Ta...",
    kind: "direct",
    avatars: [{ src: "/images/avatars/woman1.png", fallback: "SM" }],
  },
  {
    id: "door-team",
    title: "Door Team",
    subtitle: "Guest list updated",
    kind: "group",
    membersCount: 4,
    avatars: [
      { src: "/images/avatars/man5.png", fallback: "DT" },
      { src: "/images/avatars/man6.png", fallback: "DT" },
      { src: "/images/avatars/man7.png", fallback: "DT" },
      { src: "/images/avatars/man8.png", fallback: "DT" },
    ],
  },
  {
    id: "mike",
    title: "Mike Johnson",
    subtitle: "VIP arriving in 10 mins",
    kind: "direct",
    avatars: [{ src: "/images/avatars/man3.png", fallback: "MJ" }],
  },
  {
    id: "bar-staff",
    title: "Bar Staff",
    subtitle: "Running low on Grey Goose",
    kind: "group",
    membersCount: 7,
    avatars: [
      { src: "/images/avatars/man2.png", fallback: "BS" },
      { src: "/images/avatars/man4.png", fallback: "BS" },
      { src: "/images/avatars/man7.png", fallback: "BS" },
      { src: "/images/avatars/woman1.png", fallback: "BS" },
    ],
  },
]

function getDefaultMessages(): GuestChatMessage[] {
  return [
    // VIP Ops (matches screenshot thread vibe)
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "vip-ops",
      authorName: "Sarah",
      authorAvatarSrc: "/images/avatars/woman1.png",
      authorFallback: "S",
      text: "Hey team, we have Marcus Chen arriving soon with 6 guests",
      createdAtISO: isoMinutesAgo(6),
    },
    {
      id: createMessageId(),
      sender: "guest",
      threadId: "vip-ops",
      text: "Got it! Table 3 is ready.\nShould I prep the usual?",
      createdAtISO: isoMinutesAgo(5),
    },
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "vip-ops",
      authorName: "Sarah",
      authorAvatarSrc: "/images/avatars/woman1.png",
      authorFallback: "S",
      text: "Yes, 2 bottles of Ace of Spades and mixers",
      createdAtISO: isoMinutesAgo(4),
    },
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "vip-ops",
      authorName: "Mike",
      authorAvatarSrc: "/images/avatars/man3.png",
      authorFallback: "M",
      text: "Table 1 needs 2 bottles of tequila, add sparklers",
      createdAtISO: isoMinutesAgo(3),
    },
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "vip-ops",
      authorName: "VIP Operations",
      authorAvatarSrc: "/images/avatars/man2.png",
      authorFallback: "VO",
      text: "Table 3 confirmed for Marcus — assign runner + ice bucket.",
      createdAtISO: isoMinutesAgo(2),
    },
    // Simple direct threads to populate list
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "sarah",
      authorName: "Sarah",
      authorAvatarSrc: "/images/avatars/woman1.png",
      authorFallback: "S",
      text: "I need 2 more bottles for Table 4.",
      createdAtISO: isoMinutesAgo(5),
    },
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "door-team",
      authorName: "Door Team",
      authorAvatarSrc: "/images/avatars/man6.png",
      authorFallback: "DT",
      text: "Guest list updated.",
      createdAtISO: isoMinutesAgo(15),
    },
    {
      id: createMessageId(),
      sender: "guest",
      threadId: "door-team",
      text: "Thanks — received.",
      createdAtISO: isoMinutesAgo(14),
    },
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "mike",
      authorName: "Mike",
      authorAvatarSrc: "/images/avatars/man3.png",
      authorFallback: "M",
      text: "VIP arriving in 10 mins",
      createdAtISO: isoMinutesAgo(30),
    },
    {
      id: createMessageId(),
      sender: "guest",
      threadId: "mike",
      text: "Copy.",
      createdAtISO: isoMinutesAgo(29),
    },
    {
      id: createMessageId(),
      sender: "venue",
      threadId: "bar-staff",
      authorName: "Bar Staff",
      authorAvatarSrc: "/images/avatars/man2.png",
      authorFallback: "BS",
      text: "Running low on Grey Goose",
      createdAtISO: isoMinutesAgo(60),
    },
    {
      id: createMessageId(),
      sender: "guest",
      threadId: "bar-staff",
      text: "Restocking now.",
      createdAtISO: isoMinutesAgo(59),
    },
  ]
}

function isLikelyReservationQuestion(value: string) {
  return /reserv|book|table|vip/i.test(value)
}

function isLikelyWaitlistQuestion(value: string) {
  return /wait|line|queue/i.test(value)
}

function getAutoReply(userText: string) {
  if (!userText.trim()) return "How can we help?"
  if (isLikelyReservationQuestion(userText))
    return "Got it — if you’d like, go to Reserve and submit your details. We’ll confirm ASAP."
  if (isLikelyWaitlistQuestion(userText))
    return "Sure — join the waitlist and we’ll notify you when your table is ready."
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
  }, list[0])
}

function getThreadUnreadCount(messages: GuestChatMessage[], threadId: string) {
  // Demo-only but deterministic: count venue messages since your last message.
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
  const [text, setText] = React.useState("")
  const [isReplying, setIsReplying] = React.useState(false)
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null)
  const [listFilter, setListFilter] = React.useState<"all" | "groups" | "unread">("all")
  const [query, setQuery] = React.useState("")
  const listRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  const resolvedActiveThreadId = activeThreadId ?? "vip-ops"
  const activeMessages = messages.filter(
    (m) => getThreadIdOrDefault(m.threadId) === resolvedActiveThreadId
  )

  const handleSend = () => {
    const cleaned = text.trim()
    if (!cleaned) return

    const next = [...messages, createGuestMessage(cleaned, { threadId: resolvedActiveThreadId })]
    onChangeMessages(next)
    setText("")
    setIsReplying(true)

    // Demo auto-reply
    window.setTimeout(() => {
      const replyText =
        resolvedActiveThreadId === "vip-ops"
          ? getAutoReply(cleaned)
          : "Copy — we’re on it."

      const replyMeta =
        resolvedActiveThreadId === "vip-ops"
          ? {
              threadId: resolvedActiveThreadId,
              authorName: "Sarah",
              authorAvatarSrc: "/images/avatars/woman1.png",
              authorFallback: "S",
            }
          : {
              threadId: resolvedActiveThreadId,
              authorName: "Concierge",
              authorAvatarSrc: "/images/avatars/man2.png",
              authorFallback: "VC",
            }

      onChangeMessages([...next, createVenueReply(replyText, replyMeta)])
      setIsReplying(false)
    }, 650)
  }

  const threads = React.useMemo(() => {
    const byId = new Map<string, GuestChatThread>()
    for (const t of demoThreads) byId.set(t.id, t)

    // If stored messages contain unknown threadIds, still show them.
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

    // Sort by most recent activity
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

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Pastel chat background (like screenshots) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f6f2ff] via-[#f2f7ff] to-[#f7f7ff] dark:from-background dark:via-background dark:to-background" />
        {/* Soft blobs */}
        <motion.div
          className="absolute -top-12 left-10 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "rgba(255, 0, 170, 0.12)" }}
          animate={{ y: [0, 18, 0], x: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 -right-12 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "rgba(0, 220, 255, 0.12)" }}
          animate={{ y: [0, -20, 0], x: [0, -12, 0] }}
          transition={{ duration: 11, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-20 left-20 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "rgba(187, 120, 255, 0.10)" }}
          animate={{ y: [0, 14, 0], x: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, delay: 0.2 }}
        />
        {/* Chat bubble pattern hint */}
        <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 25%, rgba(255, 0, 170, 0.35) 0 2px, transparent 3px), radial-gradient(circle at 80% 40%, rgba(0, 220, 255, 0.35) 0 2px, transparent 3px), radial-gradient(circle at 50% 80%, rgba(187, 120, 255, 0.35) 0 2px, transparent 3px)",
              backgroundSize: "220px 220px",
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeThreadId === null ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="relative z-10 h-full flex flex-col"
          >
            <div className="px-4 pt-4 pb-3">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="pl-9 h-11 rounded-2xl bg-white/70 dark:bg-muted/40 border border-border"
                  />
                </div>

                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-full px-4 bg-neon-pink/20 text-neon-pink border border-neon-pink/35 hover:bg-neon-pink/25 glow-pink"
                    onClick={() => {
                      // Demo: jump into VIP Ops
                      setActiveThreadId("vip-ops")
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    New Chat
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "groups", label: "Groups" },
                    { id: "unread", label: "Unread" },
                  ] as const
                ).map((t) => {
                  const isActive = listFilter === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setListFilter(t.id)}
                      className={cn(
                        "px-4 h-9 rounded-full text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/25"
                          : "bg-white/60 dark:bg-muted/40 text-muted-foreground hover:bg-white/70 dark:hover:bg-muted/50"
                      )}
                      aria-pressed={isActive}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
              <div className="space-y-1 px-2">
                {filteredThreads.map((t) => {
                  const last = getThreadLastMessage(messages, t.id)
                  const time = last ? formatShortTime(last.createdAtISO) : ""
                  const unread = getThreadUnreadCount(messages, t.id)

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveThreadId(t.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/60 dark:hover:bg-muted/40 transition-colors">
                        <div className="shrink-0">
                          {t.kind === "group" ? (
                            <NeonAvatarGroup
                              avatars={t.avatars.map((a) => ({
                                src: a.src,
                                fallback: a.fallback,
                                status: "online",
                              }))}
                              max={3}
                              size="sm"
                              glow="cyan"
                            />
                          ) : (
                            <NeonAvatar
                              src={t.avatars[0]?.src}
                              fallback={t.avatars[0]?.fallback ?? "U"}
                              size="md"
                              glow="cyan"
                              status="online"
                              showRing
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold truncate">{t.title}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              {time ? (
                                <span className="text-xs text-muted-foreground">{time}</span>
                              ) : null}
                              {unread > 0 ? (
                                <span className="h-6 w-6 rounded-full bg-neon-pink text-white text-xs font-bold flex items-center justify-center glow-pink">
                                  {unread}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {t.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {filteredThreads.length === 0 ? (
                  <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No conversations found.
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="thread"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="relative z-10 h-full flex flex-col"
          >
            {/* Thread header */}
            <div className="px-3 pt-3 pb-2">
              <div className="glass-card-strong border-border rounded-2xl px-3 py-3 flex items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setActiveThreadId(null)}
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                {(() => {
                  const thread = threads.find((t) => t.id === resolvedActiveThreadId) ?? demoThreads[0]
                  return (
                    <>
                      <div className="shrink-0">
                        {thread.kind === "group" ? (
                          <NeonAvatarGroup
                            avatars={thread.avatars.map((a) => ({
                              src: a.src,
                              fallback: a.fallback,
                              status: "online",
                            }))}
                            max={3}
                            size="sm"
                            glow="cyan"
                          />
                        ) : (
                          <NeonAvatar
                            src={thread.avatars[0]?.src}
                            fallback={thread.avatars[0]?.fallback ?? "U"}
                            size="sm"
                            glow="cyan"
                            status="online"
                            showRing
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{thread.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {thread.kind === "group"
                            ? `${thread.membersCount ?? thread.avatars.length} members`
                            : "Online"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-xl"
                        aria-label="Call"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {activeMessages.map((m, index) => {
                const isGuest = m.sender === "guest"
                const author = m.authorName ?? (isGuest ? "You" : "VIPsync")
                const time = formatMessageTime(m.createdAtISO)

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                    className={cn("flex", isGuest ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("max-w-[85%]", isGuest ? "text-right" : "text-left")}>
                      {!isGuest ? (
                        <div className="mb-1 ml-1 flex items-center gap-2">
                          <span className="text-xs font-semibold text-neon-cyan">{author}</span>
                        </div>
                      ) : null}

                      <Card
                        className={cn(
                          "px-4 py-3 rounded-2xl border-0 shadow-sm",
                          isGuest
                            ? "bg-gradient-to-r from-[#ff21b6] to-[#7a3cff] text-white rounded-br-md"
                            : "bg-white/70 dark:bg-muted/40 text-foreground rounded-bl-md"
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      </Card>

                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1 text-[11px] text-muted-foreground",
                          isGuest ? "justify-end" : "justify-start"
                        )}
                      >
                        {time ? <span>{time}</span> : null}
                        {isGuest ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCheck className="h-3.5 w-3.5 text-neon-cyan" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              <AnimatePresence>
                {isReplying ? (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[70%]">
                      <Card className="bg-white/70 dark:bg-muted/40 border-0 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1.5 items-center">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-neon-cyan"
                              animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                            />
                          ))}
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Composer */}
            <div className="p-4">
              <div className="glass-card-strong border-border rounded-2xl p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/60 dark:bg-input/40 border-border h-11 rounded-2xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend()
                    }}
                  />
                  <Button
                    size="icon"
                    className="bg-neon-pink hover:bg-neon-pink/90 glow-pink h-11 w-11 rounded-2xl"
                    onClick={handleSend}
                    aria-label="Send message"
                    disabled={!text.trim()}
                  >
                    <motion.div
                      animate={text.trim() ? { rotate: [0, -8, 8, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <Send className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Demo chat UI (local only). In production, this would sync with staff in real time.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function getDefaultGuestChatMessages() {
  return getDefaultMessages()
}

