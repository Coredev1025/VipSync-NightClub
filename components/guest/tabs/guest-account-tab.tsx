"use client"

import React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, LogOut, RefreshCw, Shield } from "lucide-react"
import type { GuestReservation, GuestWaitlistEntry } from "@/components/guest/guest-types"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

function isActiveReservation(reservation: GuestReservation | null) {
  if (!reservation) return false
  return reservation.status === "requested" || reservation.status === "confirmed"
}

function isActiveWait(entry: GuestWaitlistEntry | null) {
  if (!entry) return false
  return entry.status === "waiting" || entry.status === "notified"
}

export function GuestAccountTab({
  reservation,
  waitlistEntry,
  onResetAll,
}: {
  reservation: GuestReservation | null
  waitlistEntry: GuestWaitlistEntry | null
  onResetAll: () => void
}) {
  const { toast } = useToast()

  return (
    <div className="h-full overflow-y-auto px-4 py-5 space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-neon-cyan" />
          Your account
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your guest session (demo).
        </p>
      </motion.div>

      <Card className="p-5 glass-card border-border">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Guest session</p>
          <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 glow-cyan">
            Demo
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          This guest UI runs locally. In production, this would be linked to your phone + venue records.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 glass-card border-neon-pink/30">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-neon-pink" />
            <p className="font-semibold text-sm">Reservation</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isActiveReservation(reservation) && reservation
              ? `${reservation.partySize} guests • ${format(
                  new Date(`${reservation.dateISO}T00:00:00`),
                  "MMM d",
                )} ${reservation.time}`
              : "None"}
          </p>
        </Card>

        <Card className="p-4 glass-card border-neon-orange/30">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-neon-orange" />
            <p className="font-semibold text-sm">Waitlist</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isActiveWait(waitlistEntry) && waitlistEntry
              ? `${waitlistEntry.partySize} guests • Est. ${waitlistEntry.estimateMinutes} min`
              : "None"}
          </p>
        </Card>
      </div>

      <Card className="p-5 glass-card border-border">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Actions</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="border-border bg-transparent"
            onClick={() => {
              onResetAll()
              toast({ title: "Reset complete", description: "Guest demo data cleared." })
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            className="border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
            onClick={() => {
              onResetAll()
              toast({ title: "Signed out", description: "Guest session cleared." })
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}

