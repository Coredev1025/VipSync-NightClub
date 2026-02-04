export type GuestTabId = "home" | "chat" | "map" | "account"

export type GuestChatSender = "guest" | "venue"

export interface GuestChatMessage {
  id: string
  sender: GuestChatSender
  authorName?: string
  authorAvatarSrc?: string
  authorFallback?: string
  text: string
  createdAtISO: string
  threadId?: string
}

