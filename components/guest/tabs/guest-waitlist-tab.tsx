"use client"

import React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Clock, MessageSquare, Phone, Users } from "lucide-react"
import type { GuestWaitlistEntry } from "@/components/guest/guest-types"
import { formatDistanceToNowStrict } from "date-fns"
import { cn } from "@/lib/utils"

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundToStep(value: number, step: number) {
  if (!Number.isFinite(value) || step <= 0) return value
  return Math.round(value / step) * step
}

function getGuestEstimateMinutes(partySize: number) {
  // Guest side: keep it stable and readable (demo).
  const base = 20
  const partyPressure =
    partySize >= 10 ? 15 : partySize >= 8 ? 10 : partySize >= 6 ? 5 : partySize <= 2 ? -5 : 0
  return roundToStep(clampNumber(base + partyPressure, 10, 60), 5)
}

function isActive(entry: GuestWaitlistEntry | null) {
  if (!entry) return false
  return entry.status === "waiting" || entry.status === "notified"
}

export function GuestWaitlistTab({
  entry,
  onJoinWaitlist,
  onLeaveWaitlist,
  onSimulateNotified,
  showHeader = true,
  containerClassName,
}: {
  entry: GuestWaitlistEntry | null
  onJoinWaitlist: (entry: GuestWaitlistEntry | null) => void
  onLeaveWaitlist: () => void
  onSimulateNotified: () => void
  showHeader?: boolean
  containerClassName?: string
}) {
  const { toast } = useToast()
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [partySize, setPartySize] = React.useState(2)

  const active = isActive(entry)

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Missing details",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      })
      return
    }

    const estimateMinutes = getGuestEstimateMinutes(partySize)
    const created: GuestWaitlistEntry = {
      id: `gw_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      partySize,
      estimateMinutes,
      status: "waiting",
      createdAtISO: new Date().toISOString(),
    }

    onJoinWaitlist(created)
    toast({
      title: "You’re on the waitlist",
      description: `Estimated wait: ${estimateMinutes} min.`,
    })
  }

  return (
    <div className={cn("h-full overflow-y-auto px-4 py-5", containerClassName)}>
      {showHeader && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-neon-orange" />
            Join the waitlist
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            We’ll notify you when your table is ready.
          </p>
        </motion.div>
      )}

      {active && entry ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Card className="p-5 glass-card border-neon-orange/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-neon-orange" />
                <p className="font-semibold">Waitlist status</p>
              </div>
              <Badge
                className={
                  entry.status === "notified"
                    ? "bg-neon-green/20 text-neon-green border-neon-green/50 glow-green"
                    : "bg-neon-orange/20 text-neon-orange border-neon-orange/50 glow-orange"
                }
              >
                {entry.status === "notified" ? "Notified" : "Waiting"}
              </Badge>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">{entry.name}</span>
              </p>
              <p className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="tabular-nums">{entry.phone}</span>
              </p>
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>{entry.partySize} guests</span>
                <span className="opacity-60">•</span>
                <span className="tabular-nums">
                  Est. <span className="text-foreground font-medium">{entry.estimateMinutes} min</span>
                </span>
                <span className="opacity-60">•</span>
                <span>
                  Added{" "}
                  {formatDistanceToNowStrict(new Date(entry.createdAtISO), {
                    addSuffix: true,
                  })}
                </span>
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-border bg-transparent"
                onClick={() => {
                  onJoinWaitlist(null)
                  toast({ title: "Waitlist cleared" })
                }}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                className="border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onLeaveWaitlist()
                  toast({ title: "You left the waitlist" })
                }}
              >
                Leave
              </Button>
            </div>

            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
                onClick={() => {
                  onSimulateNotified()
                  toast({ title: "Demo: SMS sent", description: "You’ve been notified." })
                }}
                disabled={entry.status !== "waiting"}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Demo: simulate SMS “table ready”
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleJoin}
          className={cn(showHeader ? "mt-4 space-y-4" : "space-y-4")}
        >
          <Card className="p-5 glass-card border-border">
            <div className="space-y-4">
              <div>
                <Label htmlFor="wl-name">Name</Label>
                <Input
                  id="wl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="wl-phone">Phone</Label>
                <Input
                  id="wl-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="wl-party">Party size</Label>
                <div className="relative mt-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="wl-party"
                    type="number"
                    min={1}
                    max={20}
                    value={partySize}
                    onChange={(e) => setPartySize(parseInt(e.target.value || "2", 10))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-5 w-full h-12 bg-neon-orange text-background hover:bg-neon-orange/90 glow-orange"
            >
              Join Waitlist
            </Button>

            <p className="mt-3 text-[11px] text-muted-foreground">
              Demo only. In production, you would receive real SMS updates and live position.
            </p>
          </Card>
        </motion.form>
      )}
    </div>
  )
}

