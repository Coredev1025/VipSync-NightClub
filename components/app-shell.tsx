"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Map, Activity, User, Bell, Search, X, Sparkles, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ChatsTab } from "@/components/tabs/chats-tab"
import { MapTab } from "@/components/tabs/map-tab"
import { OpsTab } from "@/components/tabs/ops-tab"
import { ProfileTab } from "@/components/tabs/profile-tab"
import { VIPsyncLogoCompact } from "@/components/ui/vipsync-logo"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TabType = "chats" | "map" | "ops" | "profile"

const tabs = [
  { id: "chats" as const, label: "Chats", icon: MessageSquare, badge: 3 },
  { id: "map" as const, label: "Map", icon: Map },
  { id: "ops" as const, label: "Ops", icon: Activity, badge: 2 },
  { id: "profile" as const, label: "Profile", icon: User },
]

export interface AppShellProps {
  onLogout?: () => void
}

export function AppShell({ onLogout }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabType>("map")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const renderTab = () => {
    switch (activeTab) {
      case "chats":
        return <ChatsTab />
      case "map":
        return <MapTab />
      case "ops":
        return <OpsTab />
      case "profile":
        return <ProfileTab onLogout={onLogout} />
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-background overflow-hidden rounded-[3rem]">
      {/* Animated background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 rounded-full bg-neon-pink/5 blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-neon-cyan/5 blur-3xl"
          animate={{ 
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1.1, 1, 1.1]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 5 }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 flex items-center justify-between px-4 py-3 pt-12 border-b border-border glass-card-strong rounded-t-[3rem] overflow-hidden"
      >
        <VIPsyncLogoCompact />

        <div className="flex items-center gap-2">
          {/* Search button */}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-xl hover:bg-muted transition-colors relative"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </motion.button>
          
          {/* Theme toggle */}
          <ThemeToggle />
          
          {/* Notifications button */}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <motion.span 
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-neon-pink rounded-full glow-pink" 
            />
          </motion.button>
          
          {/* User avatar with dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="outline-none focus:outline-none focus:ring-0 border-0 bg-transparent p-0 cursor-pointer"
                aria-label="User menu"
              >
                <NeonAvatar
                  src="/images/avatars/man1.png"
                  fallback="JD"
                  size="sm"
                  glow="pink"
                  status="online"
                  showRing
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 glass-card-strong border-border z-[200]"
            >
              <DropdownMenuItem
                onSelect={() => setActiveTab("profile")}
                className="cursor-pointer focus:bg-neon-pink/10 focus:text-neon-pink"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onSelect={onLogout}
                variant="destructive"
                className="cursor-pointer focus:bg-destructive/20 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Search Overlay */}
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
                placeholder="Search tables, guests, orders..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                onClick={() => setShowSearch(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
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
                <X className="h-4 w-4" />
              </motion.button>
            </div>
            <div className="space-y-3">
              <NotificationItem
                title="VIP Arriving"
                message="Marcus Chen - ETA 5 min"
                time="Just now"
                type="vip"
              />
              <NotificationItem
                title="Table Request"
                message="Table 7 needs bottle service"
                time="2 min ago"
                type="order"
              />
              <NotificationItem
                title="Capacity Alert"
                message="VIP Section at 85% capacity"
                time="10 min ago"
                type="alert"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative z-10 rounded-none">
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
        className="relative z-20 flex items-center justify-around px-2 py-2 pb-16 border-t border-border glass-card-strong safe-area-bottom rounded-b-[3rem] overflow-hidden"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all ${
                isActive ? "text-neon-pink" : "text-muted-foreground"
              }`}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-neon-pink/15 rounded-xl border border-neon-pink/30"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              
              {/* Icon container */}
              <div className="relative">
                <motion.div
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <tab.icon className={`h-5 w-5 relative z-10 ${isActive ? "text-glow-pink" : ""}`} />
                </motion.div>
                
                {/* Badge */}
                {tab.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-neon-pink border-0 glow-pink">
                      {tab.badge}
                    </Badge>
                  </motion.div>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium relative z-10 ${isActive ? "text-neon-pink" : ""}`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </motion.nav>

      {/* Safe area for bottom */}
      <style jsx global>{`
        .safe-area-bottom {
          padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}

function NotificationItem({ 
  title, 
  message, 
  time, 
  type 
}: { 
  title: string
  message: string
  time: string
  type: "vip" | "order" | "alert"
}) {
  const configs = {
    vip: { 
      bg: "bg-neon-pink/10 border-neon-pink/30 hover:bg-neon-pink/20", 
      icon: "text-neon-pink",
      glow: "glow-pink"
    },
    order: { 
      bg: "bg-neon-cyan/10 border-neon-cyan/30 hover:bg-neon-cyan/20", 
      icon: "text-neon-cyan",
      glow: "glow-cyan"
    },
    alert: { 
      bg: "bg-neon-orange/10 border-neon-orange/30 hover:bg-neon-orange/20", 
      icon: "text-neon-orange",
      glow: "glow-orange"
    },
  }

  const config = configs[type]

  return (
    <motion.div 
      whileHover={{ scale: 1.02, x: 5 }}
      className={`p-3 rounded-xl border transition-all cursor-pointer ${config.bg}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${config.icon} ${config.glow}`}
            style={{ backgroundColor: "currentColor" }}
          />
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <span className="text-[10px] text-muted-foreground">{time}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 ml-4">{message}</p>
    </motion.div>
  )
}
