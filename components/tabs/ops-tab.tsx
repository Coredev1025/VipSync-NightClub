"use client"

import React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  MapPin, 
  Wine, 
  AlertCircle,
  ChevronRight,
  Target,
  Zap,
  Sparkles,
  ArrowUpRight,
  Activity
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NeonAvatar } from "@/components/ui/neon-avatar"

interface FeedItem {
  id: string
  type: "order" | "arrival" | "alert" | "geo"
  title: string
  description: string
  time: string
  table?: number
  avatar?: string
}

const mockFeed: FeedItem[] = [
  {
    id: "1",
    type: "order",
    title: "New Order",
    description: "2x Ace of Spades - Table 1",
    time: "Just now",
    table: 1,
  },
  {
    id: "2",
    type: "arrival",
    title: "VIP Arrived",
    description: "Marcus Chen checked in at entrance",
    time: "2 min ago",
    avatar: "/images/avatars/man2.png",
  },
  {
    id: "3",
    type: "geo",
    title: "Geo-fence Alert",
    description: "Williams Party within 500m",
    time: "5 min ago",
  },
  {
    id: "4",
    type: "order",
    title: "Order Completed",
    description: "3x Dom Perignon delivered - Table 6",
    time: "8 min ago",
    table: 6,
  },
  {
    id: "5",
    type: "alert",
    title: "Capacity Warning",
    description: "Table 2 is over capacity",
    time: "10 min ago",
    table: 2,
  },
  {
    id: "6",
    type: "arrival",
    title: "Guest Expected",
    description: "Johnson Party - ETA 15 minutes",
    time: "12 min ago",
  },
]

export function OpsTab() {
  const [activeFilter, setActiveFilter] = useState<string>("all")

  const revenueGoal = 25000
  const currentRevenue = 10600
  const revenueProgress = (currentRevenue / revenueGoal) * 100

  const filteredFeed = activeFilter === "all" 
    ? mockFeed 
    : mockFeed.filter(item => item.type === activeFilter)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Revenue Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-4"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Target className="h-5 w-5 text-neon-pink" />
          </motion.div>
          {"Tonight's Revenue"}
        </h2>

        <Card className="p-5 glass-card border-border relative overflow-hidden">
          {/* Animated background pulse */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-neon-green/10 via-transparent to-neon-pink/10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="relative flex items-center justify-between mb-4">
            <div>
              <motion.p 
                className="text-4xl font-bold text-neon-green text-glow-green"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                ${currentRevenue.toLocaleString()}
              </motion.p>
              <p className="text-sm text-muted-foreground">
                of ${revenueGoal.toLocaleString()} goal
              </p>
            </div>
            <div className="text-right">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Badge className="bg-neon-green/20 text-neon-green border-neon-green/50 glow-green">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +18%
                </Badge>
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">vs last Saturday</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-pink rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${revenueProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          <div className="flex justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              <span className="text-neon-green font-bold">{revenueProgress.toFixed(0)}%</span> of goal
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Updated live
            </p>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <QuickStatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Guests"
            value="156"
            trend="+12"
            color="cyan"
            delay={0.1}
          />
          <QuickStatCard
            icon={<Wine className="h-5 w-5" />}
            label="Bottles Sold"
            value="24"
            trend="+5"
            color="pink"
            delay={0.2}
          />
          <QuickStatCard
            icon={<Clock className="h-5 w-5" />}
            label="Avg Stay"
            value="2.5h"
            color="orange"
            delay={0.3}
          />
          <QuickStatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Avg Spend"
            value="$442"
            trend="+$23"
            color="green"
            delay={0.4}
          />
        </div>
      </motion.div>

      {/* Live Feed */}
      <div className="flex-1 px-4 pb-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-4"
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="h-5 w-5 text-neon-cyan" />
            </motion.div>
            Live Feed
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-neon-green ml-1"
            />
          </h2>
          <div className="flex gap-1">
            {["all", "order", "arrival", "alert"].map((filter) => (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${
                  activeFilter === filter
                    ? "bg-neon-pink text-primary-foreground glow-pink"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {filter}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredFeed.map((item, index) => (
              <FeedItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function QuickStatCard({
  icon,
  label,
  value,
  trend,
  color,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: string
  color: string
  delay: number
}) {
  const colorClasses: Record<string, string> = {
    pink: "text-neon-pink border-neon-pink/30 bg-neon-pink/10",
    cyan: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10",
    green: "text-neon-green border-neon-green/30 bg-neon-green/10",
    orange: "text-neon-orange border-neon-orange/30 bg-neon-orange/10",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.03, y: -2 }}
    >
      <Card className={`p-4 border glass-card ${colorClasses[color]} relative overflow-hidden`}>
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              `radial-gradient(circle at 0% 0%, var(--neon-${color}) 0%, transparent 50%)`,
              `radial-gradient(circle at 100% 100%, var(--neon-${color}) 0%, transparent 50%)`,
              `radial-gradient(circle at 0% 0%, var(--neon-${color}) 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ opacity: 0.1 }}
        />
        
        <div className="relative flex items-center gap-3 mb-2">
          <motion.span 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className={colorClasses[color].split(" ")[0]}
          >
            {icon}
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <div className="relative flex items-end justify-between">
          <motion.p 
            className="text-2xl font-bold"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
          >
            {value}
          </motion.p>
          {trend && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className="text-xs text-neon-green font-semibold flex items-center"
            >
              <ArrowUpRight className="h-3 w-3" />
              {trend}
            </motion.span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function FeedItemCard({ item, index }: { item: FeedItem; index: number }) {
  const typeConfig = {
    order: {
      icon: <Wine className="h-5 w-5" />,
      color: "pink",
      glow: "glow-pink",
    },
    arrival: {
      icon: <MapPin className="h-5 w-5" />,
      color: "green",
      glow: "glow-green",
    },
    alert: {
      icon: <AlertCircle className="h-5 w-5" />,
      color: "orange",
      glow: "glow-orange",
    },
    geo: {
      icon: <Sparkles className="h-5 w-5" />,
      color: "cyan",
      glow: "glow-cyan",
    },
  }

  const config = typeConfig[item.type]
  const colorClasses: Record<string, string> = {
    pink: "text-neon-pink border-neon-pink/30 bg-neon-pink/10",
    green: "text-neon-green border-neon-green/30 bg-neon-green/10",
    orange: "text-neon-orange border-neon-orange/30 bg-neon-orange/10",
    cyan: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10",
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      layout
    >
      <Card className={`p-4 border glass-card ${colorClasses[config.color]} flex items-center gap-4 cursor-pointer transition-all`}>
        {item.avatar ? (
          <NeonAvatar
            src={item.avatar.startsWith("/") ? item.avatar : undefined}
            fallback={item.avatar.startsWith("/") ? item.avatar.split("/").pop()?.charAt(0).toUpperCase() || "U" : item.avatar}
            size="md"
            glow={config.color as "pink" | "cyan" | "green" | "orange"}
            showPulse
          />
        ) : (
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[config.color]} ${config.glow}`}
          >
            {config.icon}
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{item.title}</p>
            {item.table && (
              <Badge variant="outline" className={`text-[10px] ${colorClasses[config.color]}`}>
                Table {item.table}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
          <motion.div
            whileHover={{ x: 3 }}
            className="text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}
