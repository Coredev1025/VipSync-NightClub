"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, ChevronLeft, Send, Mic, ImageIcon, Sparkles, MapPin, Phone, MoreVertical, Check, CheckCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NeonAvatar, NeonAvatarGroup } from "@/components/ui/neon-avatar"

interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  isGroup?: boolean
  isOnline?: boolean
  members?: Array<{ src?: string; fallback: string }>
}

interface Message {
  id: string
  content: string
  sender: string
  time: string
  isMe: boolean
  status?: "sent" | "delivered" | "read"
  aiAction?: {
    type: string
    label: string
  }
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "VIP Operations",
    avatar: "",
    lastMessage: "Table 3 confirmed for Marcus Chen",
    time: "2m",
    unread: 3,
    isGroup: true,
    members: [
      { src: "/images/avatars/man2.png", fallback: "SM" },
      { src: "/images/avatars/man3.png", fallback: "MJ" },
      { src: "/images/avatars/man4.png", fallback: "JD" },
      { src: "/images/avatars/man5.png", fallback: "KL" },
      { src: "/images/avatars/man6.png", fallback: "TR" }
    ],
  },
  {
    id: "2",
    name: "Sarah Miller",
    avatar: "/images/avatars/woman1.png",
    lastMessage: "I need 2 more bottles for Table 7",
    time: "5m",
    unread: 1,
    isOnline: true,
  },
  {
    id: "3",
    name: "Door Team",
    avatar: "",
    lastMessage: "Guest list updated",
    time: "15m",
    unread: 0,
    isGroup: true,
    members: [
      { src: "/images/avatars/man7.png", fallback: "DT" },
      { src: "/images/avatars/man8.png", fallback: "KC" },
      { src: "/images/avatars/man1.png", fallback: "RJ" }
    ],
  },
  {
    id: "4",
    name: "Mike Johnson",
    avatar: "/images/avatars/man2.png",
    lastMessage: "VIP arriving in 10 mins",
    time: "30m",
    unread: 0,
    isOnline: true,
  },
  {
    id: "5",
    name: "Bar Staff",
    avatar: "",
    lastMessage: "Running low on Grey Goose",
    time: "1h",
    unread: 0,
    isGroup: true,
    members: [
      { src: "/images/avatars/man3.png", fallback: "BS" },
      { src: "/images/avatars/man4.png", fallback: "TL" }
    ],
  },
]

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hey team, we have Marcus Chen arriving soon with 6 guests",
    sender: "Sarah",
    time: "9:45 PM",
    isMe: false,
  },
  {
    id: "2",
    content: "Got it! Table 3 is ready. Should I prep the usual?",
    sender: "Me",
    time: "9:46 PM",
    isMe: true,
    status: "read",
  },
  {
    id: "3",
    content: "Yes, 2 bottles of Ace of Spades and mixers",
    sender: "Sarah",
    time: "9:47 PM",
    isMe: false,
  },
  {
    id: "4",
    content: "Table 1 needs 2 bottles of Dom Perignon ASAP",
    sender: "Mike",
    time: "9:50 PM",
    isMe: false,
    aiAction: {
      type: "order",
      label: "ADD TO MAP",
    },
  },
  {
    id: "5",
    content: "On it! ETA 5 minutes",
    sender: "Me",
    time: "9:51 PM",
    isMe: true,
    status: "delivered",
  },
]

export function ChatsTab() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "groups" | "unread">("all")

  const filteredChats = mockChats.filter(chat => {
    if (activeFilter === "groups") return chat.isGroup
    if (activeFilter === "unread") return chat.unread > 0
    return true
  })

  if (selectedChat) {
    return (
      <ChatThread
        chat={selectedChat}
        onBack={() => setSelectedChat(null)}
        message={message}
        setMessage={setMessage}
      />
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: "url('/images/bg-chats.jpg')" }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/30 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-3 relative z-10"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border h-11 rounded-xl"
          />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 pb-3 flex flex-col gap-2 relative z-10"
      >
        <Button 
          size="sm" 
          className="bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 rounded-full glow-pink w-fit"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Chat
        </Button>
        <div className="flex gap-2">
          {["all", "groups", "unread"].map((filter) => (
            <Button 
              key={filter}
              size="sm" 
              variant="outline" 
              onClick={() => setActiveFilter(filter as typeof activeFilter)}
              className={`border-border rounded-full capitalize ${
                activeFilter === filter 
                  ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30" 
                  : "bg-transparent"
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {filteredChats.map((chat, index) => (
          <motion.button
            key={chat.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ backgroundColor: "var(--muted)", x: 5 }}
            onClick={() => setSelectedChat(chat)}
            className="w-full flex items-center gap-3 px-4 py-4 transition-all border-b border-border/30"
          >
            <div className="relative">
              {chat.isGroup && chat.members ? (
                <NeonAvatarGroup 
                  avatars={chat.members} 
                  max={3} 
                  size="sm" 
                  glow="cyan"
                />
              ) : (
                <NeonAvatar
                  src={chat.avatar}
                  fallback={chat.name.split(" ").map(n => n[0]).join("")}
                  size="lg"
                  glow={chat.isOnline ? "green" : "cyan"}
                  status={chat.isOnline ? "online" : undefined}
                  showPulse={chat.unread > 0}
                />
              )}
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                <span className={`text-xs ${chat.unread > 0 ? "text-neon-pink" : "text-muted-foreground"}`}>
                  {chat.time}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
            </div>

            {chat.unread > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <Badge className="bg-neon-pink text-primary-foreground border-0 h-6 w-6 p-0 flex items-center justify-center glow-pink">
                  {chat.unread}
                </Badge>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ChatThread({
  chat,
  onBack,
  message,
  setMessage,
}: {
  chat: Chat
  onBack: () => void
  message: string
  setMessage: (m: string) => void
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(true)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 border-b border-border glass-card-strong"
      >
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        
        {chat.isGroup && chat.members ? (
          <NeonAvatarGroup avatars={chat.members} max={3} size="sm" glow="cyan" />
        ) : (
          <NeonAvatar
            src={chat.avatar}
            fallback={chat.name.split(" ").map(n => n[0]).join("")}
            size="md"
            glow={chat.isOnline ? "green" : "cyan"}
            status={chat.isOnline ? "online" : undefined}
          />
        )}
        
        <div className="flex-1">
          <h3 className="font-semibold">{chat.name}</h3>
          <p className="text-xs text-muted-foreground">
            {chat.isGroup 
              ? `${chat.members?.length || 5} members` 
              : chat.isOnline 
                ? <span className="text-neon-green">Online</span>
                : "Last seen 2h ago"
            }
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <Phone className="h-5 w-5 text-muted-foreground" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockMessages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] ${msg.isMe ? "order-2" : ""}`}>
              {!msg.isMe && (
                <span className="text-xs text-neon-cyan mb-1 block font-medium">{msg.sender}</span>
              )}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-2xl px-4 py-2.5 ${
                  msg.isMe
                    ? "bg-gradient-to-r from-neon-pink to-neon-purple text-primary-foreground rounded-br-sm"
                    : "glass-card rounded-bl-sm"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </motion.div>
              
              {/* AI Action Button */}
              {msg.aiAction && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/50 rounded-xl text-neon-cyan text-xs font-semibold hover:bg-neon-cyan/30 transition-colors glow-cyan"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {msg.aiAction.label}
                  <MapPin className="h-3.5 w-3.5" />
                </motion.button>
              )}
              
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {msg.time}
                </span>
                {msg.isMe && msg.status && (
                  <span className="text-neon-cyan">
                    {msg.status === "read" ? (
                      <CheckCheck className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <NeonAvatar src="/images/avatars/man2.png" fallback="SM" size="sm" glow="cyan" />
            <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-neon-cyan rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-border glass-card-strong"
      >
        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            className="p-2.5 hover:bg-muted rounded-xl transition-colors"
          >
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </motion.button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-input border-border h-11 rounded-xl"
          />
          {message ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Button size="icon" className="bg-neon-pink hover:bg-neon-pink/90 glow-pink h-11 w-11 rounded-xl">
                <Send className="h-5 w-5" />
              </Button>
            </motion.div>
          ) : (
            <Button
              size="icon"
              variant={isRecording ? "default" : "outline"}
              className={`h-11 w-11 rounded-xl ${isRecording ? "bg-destructive glow-pink animate-pulse" : "border-border bg-transparent"}`}
              onClick={() => setIsRecording(!isRecording)}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
