"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Calendar, Clock, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { GuestReservation, GuestWaitlistEntry } from "@/components/guest/guest-types"
import { GuestReserveTab } from "@/components/guest/tabs/guest-reserve-tab"
import { GuestWaitlistTab } from "@/components/guest/tabs/guest-waitlist-tab"

export type GuestBookSection = "reserve" | "waitlist"

export function GuestBookTab({
  section,
  onSectionChange,
  reservation,
  onCreateReservation,
  onCancelReservation,
  waitlistEntry,
  onJoinWaitlist,
  onLeaveWaitlist,
  onSimulateNotified,
}: {
  section: GuestBookSection
  onSectionChange: (section: GuestBookSection) => void
  reservation: GuestReservation | null
  onCreateReservation: (reservation: GuestReservation | null) => void
  onCancelReservation: () => void
  waitlistEntry: GuestWaitlistEntry | null
  onJoinWaitlist: (entry: GuestWaitlistEntry | null) => void
  onLeaveWaitlist: () => void
  onSimulateNotified: () => void
}) {
  const isReserveActive = section === "reserve"

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="px-4 pt-5 pb-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-pink" />
            Book your night
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reserve ahead or join the waitlist.
          </p>
        </motion.div>

        <Card className="mt-4 p-2 glass-card border-border">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSectionChange("reserve")}
              className={cn(
                "rounded-xl border-border",
                isReserveActive
                  ? "bg-neon-pink/20 text-neon-pink border-neon-pink/40 glow-pink"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reserve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSectionChange("waitlist")}
              className={cn(
                "rounded-xl border-border",
                !isReserveActive
                  ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 glow-cyan"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-4 w-4 mr-2" />
              Waitlist
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {section === "reserve" ? (
            <motion.div
              key="reserve"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <GuestReserveTab
                reservation={reservation}
                onCreateReservation={onCreateReservation}
                onCancelReservation={onCancelReservation}
                showHeader={false}
                containerClassName="px-0 py-0"
              />
            </motion.div>
          ) : (
            <motion.div
              key="waitlist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <GuestWaitlistTab
                entry={waitlistEntry}
                onJoinWaitlist={onJoinWaitlist}
                onLeaveWaitlist={onLeaveWaitlist}
                onSimulateNotified={onSimulateNotified}
                showHeader={false}
                containerClassName="px-0 py-0"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

