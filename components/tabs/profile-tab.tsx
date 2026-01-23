"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  User, 
  Trophy, 
  DollarSign, 
  Table, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Star,
  Zap,
  Crown,
  Gift,
  TrendingUp,
  Share2,
  Copy
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProfileAvatar } from "@/components/ui/neon-avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  color: string
}

const achievements: Achievement[] = [
  {
    id: "1",
    title: "Top Seller",
    description: "Sold 100+ tables this month",
    icon: <Trophy className="h-5 w-5" />,
    unlocked: true,
    color: "orange",
  },
  {
    id: "2",
    title: "Revenue King",
    description: "Generated $50K+ revenue",
    icon: <Crown className="h-5 w-5" />,
    unlocked: true,
    color: "pink",
  },
  {
    id: "3",
    title: "Night Owl",
    description: "Worked 20+ nights",
    icon: <Star className="h-5 w-5" />,
    unlocked: false,
    progress: 75,
    color: "cyan",
  },
]

const menuItems = [
  { icon: <Settings className="h-5 w-5" />, label: "Account Settings", href: "#", color: "cyan" },
  { icon: <Bell className="h-5 w-5" />, label: "Notifications", href: "#", badge: "3", color: "pink" },
  { icon: <Shield className="h-5 w-5" />, label: "Privacy & Security", href: "#", color: "green" },
  { icon: <HelpCircle className="h-5 w-5" />, label: "Help & Support", href: "#", color: "orange" },
]

interface ProfileTabProps {
  onLogout?: () => void
}

export function ProfileTab({ onLogout }: ProfileTabProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-8">
      {/* Profile Header */}
      <div className="relative">
        {/* Animated Banner with Nightclub Background */}
        <motion.div 
          className="h-48 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Nightclub Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 z-0"
            style={{
              backgroundImage: "url('/images/nightclub-bg.png')",
            }}
          />
          
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30 z-10" />
          
          {/* Neon color overlay for brand consistency */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 via-neon-purple/8 to-neon-cyan/10 z-10" />
          
          {/* Animated particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
          
          {/* Grid overlay */}
          <div className="absolute inset-0 cyber-grid opacity-10" />
        </motion.div>
        
        {/* Profile Info */}
        <div className="px-4 -mt-16 relative z-10">
          <div className="flex items-end gap-4">
            <ProfileAvatar
              src="/images/avatars/man1.png"
              fallback="JD"
              glow="pink"
              level={3}
            />
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="pb-2 flex-1 ml-4"
            >
              <h1 className="text-2xl font-bold text-glow-pink">John Doe</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-gradient-to-r from-neon-pink to-neon-purple text-white border-0 glow-pink">
                  <Zap className="h-3 w-3 mr-1" />
                  Elite Promoter
                </Badge>
                <Badge className="bg-neon-green/20 text-neon-green border-neon-green/50">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top 5%
                </Badge>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mt-12"
      >
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Table className="h-5 w-5" />}
            label="Tables Sold"
            value="127"
            color="pink"
            trend="+12"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Revenue"
            value="$48.5K"
            color="green"
            trend="+8%"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Rating"
            value="4.9"
            color="cyan"
          />
        </div>
      </motion.div>

      {/* Level Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mt-6"
      >
        <Card className="p-5 glass-card border-neon-pink/30 overflow-hidden relative">
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 via-transparent to-neon-cyan/10"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="h-6 w-6 text-neon-pink" />
                </motion.div>
                <span className="font-bold text-lg">Level Progress</span>
              </div>
              <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50">
                Level 3 → 4
              </Badge>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "65%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                <span className="text-neon-green font-semibold">65</span> / 100 XP
              </p>
              <p className="text-xs text-muted-foreground">
                35 more tables to reach Level 4
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 mt-6"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Trophy className="h-5 w-5 text-neon-orange" />
          </motion.div>
          Achievements
        </h2>
        <div className="space-y-3">
          {achievements.map((achievement, index) => (
            <AchievementCard key={achievement.id} achievement={achievement} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Menu Items */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-6"
      >
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <Card className="glass-card border-border overflow-hidden">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ backgroundColor: "var(--muted)", x: 5 }}
              className="w-full flex items-center gap-4 px-4 py-4 transition-all border-b border-border last:border-0"
            >
              <span className={`text-neon-${item.color}`}>{item.icon}</span>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="bg-neon-pink text-primary-foreground border-0 h-5 w-5 p-0 flex items-center justify-center text-xs glow-pink">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          ))}
        </Card>
      </motion.div>

      {/* Referral Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-4 mt-6"
      >
        <Card className="p-5 glass-card border-neon-pink/30 relative overflow-hidden">
          {/* Animated gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-neon-pink/20 via-transparent to-neon-cyan/20"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="relative flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center glow-pink"
            >
              <Gift className="h-7 w-7 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Invite Friends</h3>
              <p className="text-xs text-muted-foreground">Earn 500 points per referral</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-neon-pink/20 text-neon-pink"
            >
              <Share2 className="h-5 w-5" />
            </motion.button>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="mt-4 p-3 bg-muted/50 rounded-xl flex items-center justify-between"
          >
            <p className="text-sm font-mono text-neon-cyan">
              VIPSYNC-JOHN2024
            </p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </motion.div>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="px-4 mt-6"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-4 text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-destructive/30"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-semibold">Log Out</span>
            </motion.button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card-strong border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                Confirm Logout
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You'll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  trend?: string
}) {
  const colorClasses: Record<string, string> = {
    pink: "text-neon-pink border-neon-pink/30 bg-neon-pink/10",
    green: "text-neon-green border-neon-green/30 bg-neon-green/10",
    cyan: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10",
  }

  return (
    <motion.div whileHover={{ scale: 1.05, y: -2 }}>
      <Card className={`p-4 glass-card border ${colorClasses[color]} text-center relative overflow-hidden`}>
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
          style={{
            background: `radial-gradient(circle at center, var(--neon-${color}) 0%, transparent 70%)`,
          }}
        />
        <div className={`flex justify-center mb-2 relative ${colorClasses[color].split(" ")[0]}`}>
          {icon}
        </div>
        <p className="text-2xl font-bold relative">{value}</p>
        {trend && (
          <span className="text-xs text-neon-green font-semibold">{trend}</span>
        )}
        <p className="text-xs text-muted-foreground mt-1 relative">{label}</p>
      </Card>
    </motion.div>
  )
}

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const colorClasses: Record<string, string> = {
    orange: "border-neon-orange/50 bg-neon-orange/10 text-neon-orange",
    pink: "border-neon-pink/50 bg-neon-pink/10 text-neon-pink",
    cyan: "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan",
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      whileHover={{ scale: 1.02, x: 5 }}
    >
      <Card className={`p-4 border glass-card ${achievement.unlocked ? colorClasses[achievement.color] : "border-border"}`}>
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              achievement.unlocked 
                ? `${colorClasses[achievement.color]} ${achievement.color === 'orange' ? 'glow-orange' : achievement.color === 'pink' ? 'glow-pink' : 'glow-cyan'}`
                : "bg-muted text-muted-foreground"
            }`}
          >
            {achievement.icon}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{achievement.title}</p>
              {achievement.unlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Badge className={`${colorClasses[achievement.color]} border text-[10px]`}>
                    Unlocked
                  </Badge>
                </motion.div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
            {achievement.progress && !achievement.unlocked && (
              <div className="mt-2 relative h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-cyan to-neon-pink rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
