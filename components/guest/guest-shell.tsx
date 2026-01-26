"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Calendar, LogOut, MessageSquare, Search, Sparkles, User } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { VIPsyncLogoCompact } from "@/components/ui/vipsync-logo"
import { Badge } from "@/components/ui/badge"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { GuestChatMessage, GuestTabId, GuestReservation, GuestWaitlistEntry } from "./guest-types"
import { useLocalStorageState } from "./guest-storage"
import { GuestHomeTab } from "@/components/guest/tabs/guest-home-tab"
import { GuestAccountTab } from "@/components/guest/tabs/guest-account-tab"
import { GuestChatTab, getDefaultGuestChatMessages } from "@/components/guest/tabs/guest-chat-tab"
import { GuestBookTab, type GuestBookSection } from "@/components/guest/tabs/guest-book-tab"

const storageKeys = {
  reservation: "vipsync_guest_reservation_v1",
  waitlist: "vipsync_guest_waitlist_v1",
  chat: "vipsync_guest_chat_v1",
} as const

const tabs = [
  { id: "home" as const, label: "Home", icon: Sparkles },
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "book" as const, label: "Book", icon: Calendar },
  { id: "account" as const, label: "Me", icon: User },
]

function getActiveWaitlistCount(entry: GuestWaitlistEntry | null) {
  if (!entry) return 0
  if (entry.status === "waiting" || entry.status === "notified") return 1
  return 0
}

function getActiveReservationCount(res: GuestReservation | null) {
  if (!res) return 0
  if (res.status === "requested" || res.status === "confirmed") return 1
  return 0
}

export function GuestShell() {
  const [activeTab, setActiveTab] = React.useState<GuestTabId>("home")
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(false)
  const [bookSection, setBookSection] = React.useState<GuestBookSection>("reserve")

  const [reservation, setReservation] = useLocalStorageState<GuestReservation | null>(
    storageKeys.reservation,
    null
  )
  const [waitlistEntry, setWaitlistEntry] = useLocalStorageState<GuestWaitlistEntry | null>(
    storageKeys.waitlist,
    null
  )
  const [chatMessages, setChatMessages] = useLocalStorageState<GuestChatMessage[]>(
    storageKeys.chat,
    getDefaultGuestChatMessages()
  )

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <GuestHomeTab
            onGoReserve={() => {
              setBookSection("reserve")
              setActiveTab("book")
            }}
            onGoWaitlist={() => {
              setBookSection("waitlist")
              setActiveTab("book")
            }}
            reservation={reservation}
            waitlistEntry={waitlistEntry}
          />
        )
      case "chat":
        return (
          <GuestChatTab
            messages={chatMessages}
            onChangeMessages={setChatMessages}
          />
        )
      case "book":
        return (
          <GuestBookTab
            section={bookSection}
            onSectionChange={setBookSection}
            reservation={reservation}
            onCreateReservation={setReservation}
            onCancelReservation={() =>
              setReservation((prev) =>
                prev ? { ...prev, status: "cancelled" } : prev
              )
            }
            waitlistEntry={waitlistEntry}
            onJoinWaitlist={setWaitlistEntry}
            onLeaveWaitlist={() =>
              setWaitlistEntry((prev) =>
                prev ? { ...prev, status: "cancelled" } : prev
              )
            }
            onSimulateNotified={() =>
              setWaitlistEntry((prev) =>
                prev && prev.status === "waiting"
                  ? { ...prev, status: "notified" }
                  : prev
              )
            }
          />
        )
      case "account":
        return (
          <GuestAccountTab
            reservation={reservation}
            waitlistEntry={waitlistEntry}
            onResetAll={() => {
              setReservation(null)
              setWaitlistEntry(null)
              setActiveTab("home")
            }}
          />
        )
    }
  }

  const reservationCount = getActiveReservationCount(reservation)
  const waitlistCount = getActiveWaitlistCount(waitlistEntry)
  const notificationCount =
    (waitlistEntry?.status === "notified" ? 1 : 0) + (reservationCount > 0 ? 1 : 0)

  return (
    <div className="absolute inset-0 flex flex-col bg-background overflow-hidden rounded-[3rem]">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 rounded-full bg-neon-pink/5 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-neon-cyan/5 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 5 }}
        />
      </div>
          {/* Subtle neon sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-30"
            initial={{ x: "-120%" }}
            animate={{ x: "140%" }}
            transition={{ duration: 6, repeat: Infinity, repeatDelay: 2 }}
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 flex items-center justify-between px-4 py-3 pt-12 border-b border-border glass-card-strong rounded-t-[3rem] overflow-hidden"
      >
        <VIPsyncLogoCompact />

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSearch((v) => !v)}
            className="p-2.5 rounded-xl hover:bg-muted transition-colors relative"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </motion.button>

          <ThemeToggle />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {notificationCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-neon-pink rounded-full glow-pink"
              />
            )}
          </motion.button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="outline-none focus:outline-none focus:ring-0 border-0 bg-transparent p-0 cursor-pointer"
                aria-label="Guest menu"
              >
                <NeonAvatar
                  src="/images/avatars/man1.png"
                  fallback="GU"
                  size="sm"
                  glow="pink"
                  status="online"
                  showRing
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card-strong border-border z-[200]">
              <DropdownMenuItem
                onSelect={() => setActiveTab("account")}
                className="cursor-pointer focus:bg-neon-pink/10 focus:text-neon-pink"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onSelect={() => {
                  setReservation(null)
                  setWaitlistEntry(null)
                  setChatMessages(getDefaultGuestChatMessages())
                  setActiveTab("home")
                }}
                variant="destructive"
                className="cursor-pointer focus:bg-destructive/20 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Clear session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Search Overlay (UI only) */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-30 glass-card-strong rounded-xl p-4 border border-border"
          >
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events, tables, info..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                onClick={() => setShowSearch(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <span className="sr-only">Close</span>
                <span className="text-muted-foreground">×</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications (simple guest summaries) */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 right-4 z-30 w-80 glass-card-strong rounded-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-neon-pink" />
                Notifications
              </h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <span className="sr-only">Close</span>
                <span className="text-muted-foreground">×</span>
              </motion.button>
            </div>
            <div className="space-y-3">
              {reservationCount > 0 && (
                <div className="p-3 rounded-xl border transition-all cursor-pointer bg-neon-cyan/10 border-neon-cyan/30 hover:bg-neon-cyan/20">
                  <p className="text-sm font-semibold">Reservation active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You have a reservation in progress. Check Reserve for details.
                  </p>
                </div>
              )}
              {waitlistEntry?.status === "notified" && (
                <div className="p-3 rounded-xl border transition-all cursor-pointer bg-neon-green/10 border-neon-green/30 hover:bg-neon-green/20">
                  <p className="text-sm font-semibold">Table ready</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You’ve been notified. Please check in with the host stand.
                  </p>
                </div>
              )}
              {notificationCount === 0 && (
                <p className="text-xs text-muted-foreground">No notifications right now.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 flex items-center justify-around px-2 py-2 pb-16 glass-card-strong safe-area-bottom rounded-b-[3rem] overflow-hidden"
      >
        {/* Animated shimmer */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-20"
          animate={{ x: ["-30%", "30%", "-30%"] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.10), transparent 60%)",
          }}
        />
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const badge =
            tab.id === "book" ? reservationCount + waitlistCount : 0

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all ${
                isActive ? "text-neon-pink" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="guestActiveTab"
                  className="absolute inset-0 rounded-xl border border-neon-pink/30"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="guestActiveTabGlow"
                  className="absolute -inset-6 rounded-2xl blur-2xl pointer-events-none"
                  animate={{ opacity: [0.15, 0.35, 0.15] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(255, 0, 170, 0.25), transparent 60%)",
                  }}
                />
              )}

              <div className="relative">
                <motion.div
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <tab.icon
                    className={`h-5 w-5 relative z-10 ${isActive ? "text-glow-pink" : ""}`}
                  />
                </motion.div>

                {badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-neon-cyan border-0 glow-cyan">
                      {badge}
                    </Badge>
                  </motion.div>
                )}
              </div>

              <span className={`text-xs font-medium relative z-10 ${isActive ? "text-neon-pink" : ""}`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </motion.nav>

      <style jsx global>{`
        .safe-area-bottom {
          padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}

