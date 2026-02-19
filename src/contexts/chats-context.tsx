import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"

export interface ChatItem {
  id: string
  img: string
  name: string
  phone?: string
  lastMsg: string
  time: string
  seen: boolean
  unread: number
  group: boolean
}

export interface ChatMessageItem {
  id: string
  msg: string
  time: string
  me: boolean
  sender?: string
  role?: string
}

function apiChatToItem(r: Record<string, unknown>): ChatItem {
  return {
    id: String(r.id),
    img: (r.avatar as string) || "https://i.pravatar.cc/320?u=default",
    name: (r.name as string) ?? "Chat",
    phone: r.phone as string | undefined,
    lastMsg: (r.lastMessage as string) ?? "",
    time: (r.time as string) ?? new Date().toISOString(),
    seen: (r.seen as boolean) ?? (r.unread as number) === 0,
    unread: (r.unread as number) ?? 0,
    group: (r.isGroup as boolean) ?? false,
  }
}

function apiMessageToItem(r: Record<string, unknown>): ChatMessageItem {
  return {
    id: String(r.id),
    msg: (r.msg as string) ?? "",
    time: (r.time as string) ?? new Date().toISOString(),
    me: (r.me as boolean) ?? false,
    sender: r.sender as string | undefined,
    role: r.role as string | undefined,
  }
}

const DEFAULT_CHATS: ChatItem[] = [
  {
    id: "main-ops",
    img: "https://i.pravatar.cc/300?u=mainops",
    name: "Main Ops",
    lastMsg: "Table 2, i got James he wants 2 bottles of Collon.",
    time: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    seen: false,
    unread: 1,
    group: true,
  },
]

export type ChatUpdate = Partial<Pick<ChatItem, "name" | "img" | "phone" | "group">>
export type ChatMessageUpdate = Partial<Pick<ChatMessageItem, "msg" | "me" | "sender" | "role">>

export interface FetchMessagesOptions {
  limit?: number
  offset?: number
  append?: boolean
}

interface ChatsContextValue {
  chats: ChatItem[]
  getMessages: (chatId: string) => ChatMessageItem[]
  getMessagesTotal: (chatId: string) => number
  hasMoreMessages: (chatId: string) => boolean
  fetchMessages: (chatId: string, options?: FetchMessagesOptions) => Promise<ChatMessageItem[]>
  loadMoreMessages: (chatId: string) => Promise<ChatMessageItem[]>
  sendMessage: (chatId: string, msg: string, options?: { me?: boolean; sender?: string; role?: string }) => Promise<ChatMessageItem | null>
  createChat: (data: { name: string; avatar?: string; phone?: string; isGroup?: boolean; memberIds?: string[] }) => Promise<ChatItem | null>
  updateChat: (chatId: string, patch: ChatUpdate) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  updateMessage: (chatId: string, messageId: string, patch: ChatMessageUpdate) => Promise<void>
  deleteMessage: (chatId: string, messageId: string) => Promise<void>
  markChatRead: (chatId: string) => Promise<void>
  refetchChats: () => Promise<void>
  isApiConnected: boolean
  isLoadingChats: boolean
}

const ChatsContext = React.createContext<ChatsContextValue | null>(null)

const MESSAGES_PAGE_SIZE = 50

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const connected = isApiConnected()
  const { hasBackendToken } = useApiAuth()
  const currentUserIdRef = React.useRef<string | null>(null)
  const [chats, setChats] = React.useState<ChatItem[]>(() => (connected ? [] : DEFAULT_CHATS))
  const [messagesByChatId, setMessagesByChatId] = React.useState<Record<string, ChatMessageItem[]>>({})
  const [totalByChatId, setTotalByChatId] = React.useState<Record<string, number>>({})
  const [isLoadingChats, setIsLoadingChats] = React.useState(connected)

  // Keep current user id for realtime message "me" flag (avoids useSupabaseAuth dependency).
  // Rely only on onAuthStateChange to avoid extra getSession() and auth-token lock contention.
  React.useEffect(() => {
    if (!isSupabaseConfigured()) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      currentUserIdRef.current = session?.user?.id ?? null
    })
    return () => subscription.unsubscribe()
  }, [])

  const refetchChats = React.useCallback(async () => {
    if (!connected) return
    if (!getAccessToken()) {
      setIsLoadingChats(false)
      return
    }
    setIsLoadingChats(true)
    try {
      const res = await api.get<{ chats: Array<Record<string, unknown>> }>("/api/chats")
      const list = (res?.chats ?? []).map((c) => apiChatToItem(c))
      setChats(list)
    } catch {
      // keep current on error
    } finally {
      setIsLoadingChats(false)
    }
  }, [connected])

  React.useEffect(() => {
    if (connected && hasBackendToken) refetchChats()
  }, [connected, hasBackendToken, refetchChats])

  // Realtime: new messages for chats the user is in
  React.useEffect(() => {
    if (!connected || chats.length === 0 || !isSupabaseConfigured()) return
    const chatIds = new Set(chats.map((c) => c.id))
    const channel = supabase
      .channel("chat_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as { id: string; chat_id: string; msg: string; created_at: string; sender_id?: string; sender?: string; role?: string }
          if (!chatIds.has(row.chat_id)) return
          const userId = currentUserIdRef.current
          const me = userId != null && row.sender_id != null ? row.sender_id === userId : (row as { me?: boolean }).me ?? false
          const item = apiMessageToItem({
            id: row.id,
            msg: row.msg,
            time: row.created_at,
            me,
            sender: row.sender,
            role: row.role,
          })
          setMessagesByChatId((prev) => ({
            ...prev,
            [row.chat_id]: [...(prev[row.chat_id] ?? []), item],
          }))
          refetchChats()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [connected, chats, refetchChats])

  const getMessages = React.useCallback(
    (chatId: string): ChatMessageItem[] => messagesByChatId[chatId] ?? [],
    [messagesByChatId]
  )

  const getMessagesTotal = React.useCallback(
    (chatId: string): number => totalByChatId[chatId] ?? 0,
    [totalByChatId]
  )

  const hasMoreMessages = React.useCallback(
    (chatId: string): boolean => {
      const list = messagesByChatId[chatId] ?? []
      const total = totalByChatId[chatId] ?? 0
      return list.length < total
    },
    [messagesByChatId, totalByChatId]
  )

  const fetchMessages = React.useCallback(
    async (chatId: string, options?: FetchMessagesOptions): Promise<ChatMessageItem[]> => {
      const limit = options?.limit ?? MESSAGES_PAGE_SIZE
      const offset = options?.offset ?? 0
      const append = options?.append ?? false
      if (connected) {
        try {
          const res = await api.get<{ messages: Array<Record<string, unknown>>; total: number }>(
            `/api/chats/${chatId}/messages`,
            { params: { limit, offset } }
          )
          const list = (res?.messages ?? []).map((m) => apiMessageToItem(m))
          const total = res?.total ?? list.length
          setTotalByChatId((prev) => ({ ...prev, [chatId]: total }))
          setMessagesByChatId((prev) => {
            const existing = prev[chatId] ?? []
            const next = append ? [...list, ...existing] : list
            return { ...prev, [chatId]: next }
          })
          return list
        } catch {
          return getMessages(chatId)
        }
      }
      return getMessages(chatId)
    },
    [connected, getMessages]
  )

  const loadMoreMessages = React.useCallback(
    async (chatId: string): Promise<ChatMessageItem[]> => {
      const current = messagesByChatId[chatId] ?? []
      return fetchMessages(chatId, { limit: MESSAGES_PAGE_SIZE, offset: current.length, append: true })
    },
    [fetchMessages, messagesByChatId]
  )

  const sendMessage = React.useCallback(
    async (chatId: string, msg: string, options?: { me?: boolean; sender?: string; role?: string }): Promise<ChatMessageItem | null> => {
      const me = options?.me ?? true
      if (connected) {
        try {
          const created = await api.post<ChatMessageItem>(`/api/chats/${chatId}/messages`, {
            msg,
            me,
            sender: options?.sender,
            role: options?.role,
          })
          const item = apiMessageToItem(created as unknown as Record<string, unknown>)
          setMessagesByChatId((prev) => ({ ...prev, [chatId]: [...(prev[chatId] ?? []), item] }))
          return item
        } catch {
          return null
        }
      }
      const item: ChatMessageItem = {
        id: `local-${Date.now()}`,
        msg,
        time: new Date().toISOString(),
        me,
        sender: options?.sender,
        role: options?.role,
      }
      setMessagesByChatId((prev) => ({ ...prev, [chatId]: [...(prev[chatId] ?? []), item] }))
      return item
    },
    [connected]
  )

  const markChatRead = React.useCallback(
    async (chatId: string) => {
      if (!connected) return
      try {
        await api.post(`/api/chats/${chatId}/read`)
        await refetchChats()
      } catch {
        // ignore
      }
    },
    [connected, refetchChats]
  )

  const createChat = React.useCallback(
    async (data: {
      name: string
      avatar?: string
      phone?: string
      isGroup?: boolean
      memberIds?: string[]
    }): Promise<ChatItem | null> => {
      if (connected) {
        try {
          const res = await api.post<Record<string, unknown>>("/api/chats", {
            name: data.name,
            avatar: data.avatar,
            phone: data.phone,
            isGroup: data.isGroup ?? false,
            memberIds: data.memberIds,
          })
          const item = apiChatToItem({ ...res, lastMessage: "", time: new Date().toISOString(), unread: 0, seen: true })
          setChats((prev) => [item, ...prev])
          return item
        } catch {
          return null
        }
      }
      const item: ChatItem = {
        id: `local-${Date.now()}`,
        img: data.avatar || "https://i.pravatar.cc/320?u=default",
        name: data.name,
        phone: data.phone,
        lastMsg: "",
        time: new Date().toISOString(),
        seen: true,
        unread: 0,
        group: data.isGroup ?? false,
      }
      setChats((prev) => [item, ...prev])
      return item
    },
    [connected]
  )

  const updateChat = React.useCallback(
    async (chatId: string, patch: ChatUpdate) => {
      const toApi = {
        name: patch.name,
        avatar: patch.img,
        phone: patch.phone,
        isGroup: patch.group,
      }
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...patch } : c)))
      if (connected) {
        try {
          const res = await api.patch<Record<string, unknown>>(`/api/chats/${chatId}`, toApi)
          const item = apiChatToItem(res)
          setChats((prev) => prev.map((c) => (c.id === chatId ? item : c)))
        } catch {
          setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...patch } : c)))
        }
      }
    },
    [connected]
  )

  const deleteChat = React.useCallback(
    async (chatId: string) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId))
      setMessagesByChatId((prev) => {
        const next = { ...prev }
        delete next[chatId]
        return next
      })
      if (connected) {
        try {
          await api.delete(`/api/chats/${chatId}`)
        } catch {
          refetchChats()
        }
      }
    },
    [connected, refetchChats]
  )

  const updateMessage = React.useCallback(
    async (chatId: string, messageId: string, patch: ChatMessageUpdate) => {
      setMessagesByChatId((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
      }))
      if (connected) {
        try {
          const updated = await api.patch<ChatMessageItem>(`/api/chats/${chatId}/messages/${messageId}`, patch)
          setMessagesByChatId((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] ?? []).map((m) => (m.id === messageId ? apiMessageToItem(updated as unknown as Record<string, unknown>) : m)),
          }))
        } catch {
          setMessagesByChatId((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] ?? []).map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
          }))
        }
      }
    },
    [connected]
  )

  const deleteMessage = React.useCallback(
    async (chatId: string, messageId: string) => {
      setMessagesByChatId((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).filter((m) => m.id !== messageId),
      }))
      if (connected) {
        try {
          await api.delete(`/api/chats/${chatId}/messages/${messageId}`)
        } catch {
          fetchMessages(chatId)
        }
      }
    },
    [connected, fetchMessages]
  )

  const value = React.useMemo(
    () => ({
      chats,
      getMessages,
      getMessagesTotal,
      hasMoreMessages,
      fetchMessages,
      loadMoreMessages,
      sendMessage,
      createChat,
      updateChat,
      deleteChat,
      updateMessage,
      deleteMessage,
      markChatRead,
      refetchChats,
      isApiConnected: connected,
      isLoadingChats,
    }),
    [
      chats,
      getMessages,
      getMessagesTotal,
      hasMoreMessages,
      fetchMessages,
      loadMoreMessages,
      sendMessage,
      createChat,
      updateChat,
      deleteChat,
      updateMessage,
      deleteMessage,
      markChatRead,
      refetchChats,
      connected,
      isLoadingChats,
    ]
  )

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>
}

export function useChats(): ChatsContextValue {
  const ctx = React.useContext(ChatsContext)
  if (!ctx) throw new Error("useChats must be used within ChatsProvider")
  return ctx
}

export function useChatsOptional(): ChatsContextValue | null {
  return React.useContext(ChatsContext)
}
