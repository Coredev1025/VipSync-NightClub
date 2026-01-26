export type GuestTabId = "home" | "chat" | "book" | "account"

export type GuestReservationStatus = "requested" | "confirmed" | "cancelled"

export interface GuestReservation {
  id: string
  name: string
  phone: string
  partySize: number
  dateISO: string // YYYY-MM-DD
  time: string // HH:mm
  notes?: string
  status: GuestReservationStatus
  createdAtISO: string
}

export type GuestWaitlistStatus = "waiting" | "notified" | "seated" | "cancelled"

export interface GuestWaitlistEntry {
  id: string
  name: string
  phone: string
  partySize: number
  estimateMinutes: number
  status: GuestWaitlistStatus
  createdAtISO: string
}

export type GuestChatSender = "guest" | "venue"

export interface GuestChatMessage {
  id: string
  sender: GuestChatSender
  /**
   * Optional author metadata (useful for group chats / nicer UI).
   * Does not affect core chat behavior when omitted.
   */
  authorName?: string
  authorAvatarSrc?: string
  authorFallback?: string
  text: string
  createdAtISO: string
  threadId?: string
}

export interface GuestReserveIntent {
  id: string
  tableId?: string
  tableName?: string
  minSpend?: number
  partySizeSuggested?: number
  notes?: string
  createdAtISO: string
}

