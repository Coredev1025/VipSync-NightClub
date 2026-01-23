"use client"

import React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, ArrowRight, Lock, User, Gift, ChevronLeft, Sparkles, Shield, CheckCircle, Users, DoorOpen, Briefcase, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VIPsyncLogo } from "@/components/ui/vipsync-logo"
import { NeonAvatar } from "@/components/ui/neon-avatar"

type AuthStep = "welcome" | "phone" | "otp" | "role" | "profile"
type UserRole = "promoter" | "door" | "manager" | "owner"

interface RoleOption {
  id: UserRole
  title: string
  description: string
  icon: React.ReactNode
  color: string
  glow: string
}

const roles: RoleOption[] = [
  {
    id: "promoter",
    title: "Promoter",
    description: "Bring guests, manage tables & earn commissions",
    icon: <Users className="h-7 w-7" />,
    color: "neon-pink",
    glow: "glow-pink",
  },
  {
    id: "door",
    title: "Door Staff",
    description: "Manage guest lists & venue entry",
    icon: <DoorOpen className="h-7 w-7" />,
    color: "neon-cyan",
    glow: "glow-cyan",
  },
  {
    id: "manager",
    title: "Manager",
    description: "Oversee operations & team performance",
    icon: <Briefcase className="h-7 w-7" />,
    color: "neon-green",
    glow: "glow-green",
  },
  {
    id: "owner",
    title: "Owner",
    description: "Full access to all venue controls",
    icon: <Crown className="h-7 w-7" />,
    color: "neon-orange",
    glow: "glow-orange",
  },
]

interface AuthScreenProps {
  onComplete: () => void
}

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>("welcome")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [name, setName] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [referralCode, setReferralCode] = useState("")

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div 
              className="mb-10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <VIPsyncLogo size="lg" animate showTagline />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-6 mb-10"
            >
              {[
                { icon: <Shield className="h-4 w-4" />, label: "Secure" },
                { icon: <Sparkles className="h-4 w-4" />, label: "Real-time" },
                { icon: <CheckCircle className="h-4 w-4" />, label: "Pro Tools" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span className="text-neon-cyan">{feature.icon}</span>
                  {feature.label}
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4 w-full max-w-xs"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setStep("phone")}
                  className="w-full h-14 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 text-primary-foreground glow-pink text-base font-semibold"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Continue with Phone
                </Button>
              </motion.div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-14 border-neon-cyan/50 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan"
                >
                  <Gift className="mr-2 h-5 w-5" />
                  I have a referral code
                </Button>
              </motion.div>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-10 text-xs text-muted-foreground max-w-xs"
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </motion.p>
          </motion.div>
        )

      case "phone":
        return (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-xs"
          >
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => setStep("welcome")}
              className="flex items-center text-muted-foreground mb-8 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="w-14 h-14 rounded-2xl bg-neon-pink/20 border border-neon-pink/50 flex items-center justify-center mb-6 glow-pink">
                <Phone className="h-7 w-7 text-neon-pink" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Enter your phone</h2>
              <p className="text-muted-foreground text-sm mb-8">{"We'll send you a verification code"}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-12 h-14 bg-input border-border text-lg rounded-xl input-glow-primary"
                />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setStep("otp")}
                  disabled={phone.length < 10}
                  className="w-full h-14 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 text-primary-foreground glow-pink text-base font-semibold rounded-xl"
                >
                  Send Code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )

      case "otp":
        return (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-xs"
          >
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => setStep("phone")}
              className="flex items-center text-muted-foreground mb-8 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="w-14 h-14 rounded-2xl bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center mb-6 glow-cyan">
                <Lock className="h-7 w-7 text-neon-cyan" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verify your phone</h2>
              <p className="text-muted-foreground text-sm mb-8">Enter the 6-digit code sent to {phone}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-2 mb-6 justify-center">
              {otp.map((digit, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }}>
                  <Input
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-10 h-14 text-center text-xl font-mono bg-input border-border rounded-xl transition-all input-glow-cyan"
                  />
                </motion.div>
              ))}
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setStep("role")}
                disabled={otp.some((d) => !d)}
                className="w-full h-14 bg-gradient-to-r from-neon-pink to-neon-purple text-primary-foreground glow-pink text-base font-semibold rounded-xl"
              >
                Verify
                <Lock className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <motion.button whileHover={{ scale: 1.05 }} className="w-full mt-6 text-sm text-neon-cyan hover:underline flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Resend code
            </motion.button>
          </motion.div>
        )

      case "role":
        return (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-sm"
          >
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => setStep("otp")}
              className="flex items-center text-muted-foreground mb-8 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center mx-auto mb-6 glow-pink"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Users className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Select your role</h2>
              <p className="text-muted-foreground text-sm">Choose the role that best describes you</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {roles.map((role, index) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedRole(role.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                    selectedRole === role.id
                      ? `border-${role.color} bg-${role.color}/20 ${role.glow}`
                      : "border-border bg-card/50 hover:border-muted-foreground/50"
                  }`}
                >
                  {/* Animated background for selected */}
                  {selectedRole === role.id && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className={`absolute inset-0 bg-${role.color}/10`}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  )}
                  
                  <div className="relative">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        selectedRole === role.id 
                          ? `bg-${role.color}/30 text-${role.color}` 
                          : "bg-muted text-muted-foreground"
                      }`}
                      animate={selectedRole === role.id ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {role.icon}
                    </motion.div>
                    <h3 className={`font-bold mb-1 ${selectedRole === role.id ? `text-${role.color}` : ""}`}>
                      {role.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-tight">{role.description}</p>
                    
                    {/* Check indicator */}
                    {selectedRole === role.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-${role.color} flex items-center justify-center`}
                      >
                        <CheckCircle className="h-4 w-4 text-background" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setStep("profile")}
                disabled={!selectedRole}
                className="w-full h-14 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 text-primary-foreground glow-pink text-base font-semibold rounded-xl"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )

      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-xs"
          >
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => setStep("role")}
              className="flex items-center text-muted-foreground mb-8 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center mb-8">
              <NeonAvatar
                fallback={name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
                size="xl"
                glow="pink"
                showPulse
              />
              <h2 className="text-2xl font-bold mt-6 mb-2">Complete your profile</h2>
              <p className="text-muted-foreground text-sm text-center">Tell us a bit about yourself</p>
              
              {/* Role badge */}
              {selectedRole && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`mt-4 px-4 py-2 rounded-full bg-${roles.find(r => r.id === selectedRole)?.color}/20 border border-${roles.find(r => r.id === selectedRole)?.color}/50`}
                >
                  <span className={`text-sm font-semibold text-${roles.find(r => r.id === selectedRole)?.color}`}>
                    {roles.find(r => r.id === selectedRole)?.title}
                  </span>
                </motion.div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 h-14 bg-input border-border rounded-xl input-glow-primary"
                />
              </div>

              <div className="relative">
                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-cyan" />
                <Input
                  type="text"
                  placeholder="Referral code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="pl-12 h-14 bg-input border-neon-cyan/30 rounded-xl input-glow-cyan"
                />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onComplete}
                  disabled={!name}
                  className="w-full h-14 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 text-primary-foreground glow-pink text-base font-semibold rounded-xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background p-6 overflow-hidden pt-12 pb-16 rounded-[3rem]">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 z-0"
        style={{ backgroundImage: "url('/images/auth-bg.png')" }}
      />
      
      {/* Animated overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(ellipse at 20% 20%, oklch(0.72 0.28 330 / 0.15) 0%, transparent 50%)",
            "radial-gradient(ellipse at 80% 80%, oklch(0.78 0.18 200 / 0.15) 0%, transparent 50%)",
            "radial-gradient(ellipse at 50% 50%, oklch(0.65 0.24 300 / 0.15) 0%, transparent 50%)",
            "radial-gradient(ellipse at 20% 20%, oklch(0.72 0.28 330 / 0.15) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? "var(--neon-pink)" : i % 3 === 1 ? "var(--neon-cyan)" : "var(--neon-green)",
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}
      
      {/* Cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-[0.03]" />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </div>
  )
}
