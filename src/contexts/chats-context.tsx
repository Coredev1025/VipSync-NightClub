import * as React from "react"
import { useApiAuth } from "@/contexts/api-auth-context"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

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
    phone: "+1 (555) 100-2000",
    lastMsg: "Table 2, i got James he wants 2 bottles of Collon.",
    time: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    seen: false,
    unread: 1,
    group: true,
  },
]

export type ChatUpdate = Partial<Pick<ChatItem, "name" | "img" | "phone" | "group">>
export type ChatMessageUpdate = Partial<Pick<ChatMessageItem, "msg" | "me" | "sender" | "role">>

interface ChatsContextValue {
  chats: ChatItem[]
  getMessages: (chatId: string) => ChatMessageItem[]
  fetchMessages: (chatId: string) => Promise<ChatMessageItem[]>
  sendMessage: (chatId: string, msg: string, options?: { me?: boolean; sender?: string; role?: string }) => Promise<ChatMessageItem | null>
  createChat: (data: { name: string; avatar?: string; phone?: string; isGroup?: boolean }) => Promise<ChatItem | null>
  updateChat: (chatId: string, patch: ChatUpdate) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  updateMessage: (chatId: string, messageId: string, patch: ChatMessageUpdate) => Promise<void>
  deleteMessage: (chatId: string, messageId: string) => Promise<void>
  refetchChats: () => Promise<void>
  isApiConnected: boolean
  isLoadingChats: boolean
}

const ChatsContext = React.createContext<ChatsContextValue | null>(null)

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const connected = isApiConnected()
  const { hasBackendToken } = useApiAuth()
  const [chats, setChats] = React.useState<ChatItem[]>(() => (connected ? [] : DEFAULT_CHATS))
  const [messagesByChatId, setMessagesByChatId] = React.useState<Record<string, ChatMessageItem[]>>({})
  const [isLoadingChats, setIsLoadingChats] = React.useState(connected)

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

  const getMessages = React.useCallback(
    (chatId: string): ChatMessageItem[] => messagesByChatId[chatId] ?? [],
    [messagesByChatId]
  )

  const fetchMessages = React.useCallback(
    async (chatId: string): Promise<ChatMessageItem[]> => {
      if (connected) {
        try {
          const res = await api.get<{ messages: Array<Record<string, unknown>> }>(`/api/chats/${chatId}/messages`)
          const list = (res?.messages ?? []).map((m) => apiMessageToItem(m))
          setMessagesByChatId((prev) => ({ ...prev, [chatId]: list }))
          return list
        } catch {
          return getMessages(chatId)
        }
      }
      return getMessages(chatId)
    },
    [connected, getMessages]
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
          const item = apiMessageToItem(created as Record<string, unknown>)
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

  const createChat = React.useCallback(
    async (data: { name: string; avatar?: string; phone?: string; isGroup?: boolean }): Promise<ChatItem | null> => {
      if (connected) {
        try {
          const res = await api.post<Record<string, unknown>>("/api/chats", {
            name: data.name,
            avatar: data.avatar,
            phone: data.phone,
            isGroup: data.isGroup ?? false,
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
            [chatId]: (prev[chatId] ?? []).map((m) => (m.id === messageId ? apiMessageToItem(updated as Record<string, unknown>) : m)),
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
      fetchMessages,
      sendMessage,
      createChat,
      updateChat,
      deleteChat,
      updateMessage,
      deleteMessage,
      refetchChats,
      isApiConnected: connected,
      isLoadingChats,
    }),
    [chats, getMessages, fetchMessages, sendMessage, createChat, updateChat, deleteChat, updateMessage, deleteMessage, refetchChats, connected, isLoadingChats]
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
