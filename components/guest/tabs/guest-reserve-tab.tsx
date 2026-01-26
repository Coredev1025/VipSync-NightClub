"use client"

import React from "react"
import { motion } from "framer-motion"
import { Calendar, CheckCircle, Phone, Trash2, Users } from "lucide-react"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { GuestReservation, GuestReserveIntent } from "@/components/guest/guest-types"
import { cn } from "@/lib/utils"
import { readJsonFromStorage, removeFromStorage } from "@/components/guest/guest-storage"

function toDateISO(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const reserveIntentStorageKey = "vipsync_guest_reserve_intent_v1"

function isActiveReservation(reservation: GuestReservation | null) {
  if (!reservation) return false
  return reservation.status === "requested" || reservation.status === "confirmed"
}

export function GuestReserveTab({
  reservation,
  onCreateReservation,
  onCancelReservation,
  showHeader = true,
  containerClassName,
}: {
  reservation: GuestReservation | null
  onCreateReservation: (reservation: GuestReservation | null) => void
  onCancelReservation: () => void
  showHeader?: boolean
  containerClassName?: string
}) {
  const { toast } = useToast()
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)

  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [partySize, setPartySize] = React.useState(2)
  const [date, setDate] = React.useState<Date>(new Date())
  const [time, setTime] = React.useState("22:00")
  const [notes, setNotes] = React.useState("")

  const active = isActiveReservation(reservation)

  const [reserveIntent, setReserveIntent] = React.useState<GuestReserveIntent | null>(null)
  const hasAppliedIntentRef = React.useRef(false)

  React.useEffect(() => {
    setReserveIntent(readJsonFromStorage<GuestReserveIntent>(reserveIntentStorageKey))
  }, [])

  React.useEffect(() => {
    if (!reserveIntent) return
    if (active) return
    if (hasAppliedIntentRef.current) return

    const shouldAutofill =
      !name.trim() && !phone.trim() && partySize === 2 && !notes.trim()
    if (!shouldAutofill) return

    hasAppliedIntentRef.current = true
    if (reserveIntent.partySizeSuggested) setPartySize(reserveIntent.partySizeSuggested)
    if (reserveIntent.notes) setNotes(reserveIntent.notes)
  }, [active, name, notes, partySize, phone, reserveIntent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Missing details",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      })
      return
    }

    const created: GuestReservation = {
      id: `gr_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      partySize,
      dateISO: toDateISO(date),
      time,
      notes: notes.trim() ? notes.trim() : undefined,
      status: "confirmed",
      createdAtISO: new Date().toISOString(),
    }

    onCreateReservation(created)
    if (reserveIntent) {
      removeFromStorage(reserveIntentStorageKey)
      setReserveIntent(null)
    }
    toast({
      title: "Reservation confirmed",
      description: `We’ll see you ${format(date, "EEE, MMM d")} at ${time}.`,
    })
  }

  return (
    <div className={cn("h-full overflow-y-auto px-4 py-5", containerClassName)}>
      {showHeader && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-neon-cyan" />
            Reserve a table
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Book ahead to skip the wait.
          </p>
        </motion.div>
      )}

      {!active && reserveIntent?.tableName && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={showHeader ? "mt-4" : ""}>
          <Card className="p-4 glass-card border-neon-pink/30">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground tracking-wider font-semibold">
                  VIP REQUEST
                </p>
                <p className="font-semibold truncate">{reserveIntent.tableName}</p>
                {typeof reserveIntent.minSpend === "number" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Min spend: <span className="text-foreground font-medium tabular-nums">${reserveIntent.minSpend}</span>
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-border bg-transparent"
                onClick={() => {
                  removeFromStorage(reserveIntentStorageKey)
                  setReserveIntent(null)
                  toast({ title: "VIP request cleared" })
                }}
              >
                Clear
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {active && reservation ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Card className="p-5 glass-card border-neon-cyan/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-neon-green" />
                <p className="font-semibold">Reservation confirmed</p>
              </div>
              <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 glow-cyan">
                {reservation.partySize} guests
              </Badge>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">{reservation.name}</span>
              </p>
              <p className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="tabular-nums">{reservation.phone}</span>
              </p>
              <p className="text-muted-foreground">
                {format(new Date(`${reservation.dateISO}T00:00:00`), "EEE, MMM d")} at{" "}
                <span className="tabular-nums">{reservation.time}</span>
              </p>
              {reservation.notes && (
                <p className="text-xs text-muted-foreground italic">“{reservation.notes}”</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-border bg-transparent"
                onClick={() => {
                  onCreateReservation(null)
                  toast({ title: "Reservation cleared" })
                }}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                className="border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onCancelReservation()
                  toast({ title: "Reservation cancelled" })
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className={cn(showHeader ? "mt-4 space-y-4" : "space-y-4")}
        >
          <Card className="p-5 glass-card border-border">
            <div className="space-y-4">
              <div>
                <Label htmlFor="guest-name">Name</Label>
                <Input
                  id="guest-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="guest-phone">Phone</Label>
                <Input
                  id="guest-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="guest-party">Party size</Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="guest-party"
                      type="number"
                      min={1}
                      max={20}
                      value={partySize}
                      onChange={(e) => setPartySize(parseInt(e.target.value || "2", 10))}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="guest-time">Time</Label>
                  <Input
                    id="guest-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1 justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        if (!selectedDate) return
                        setDate(selectedDate)
                        setDatePickerOpen(false)
                      }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="guest-notes">Notes (optional)</Label>
                <Textarea
                  id="guest-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Birthday, VIP, dietary notes, etc."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-5 w-full h-12 bg-gradient-to-r from-neon-pink to-neon-purple text-primary-foreground glow-pink"
            >
              Confirm Reservation
            </Button>

            <p className="mt-3 text-[11px] text-muted-foreground">
              Demo only. In production, this would submit to the venue and send SMS updates.
            </p>
          </Card>
        </motion.form>
      )}
    </div>
  )
}

