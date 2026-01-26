"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Calendar,
  Check,
  Clock,
  Crown,
  Lock,
} from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { useToast } from "@/hooks/use-toast"
import {
  useLocalStorageState,
  writeJsonToStorage,
} from "@/components/guest/guest-storage"
import { formatNumber } from "@/lib/utils"

import type {
  GuestReservation,
  GuestReserveIntent,
  GuestWaitlistEntry,
} from "@/components/guest/guest-types"

function formatDateISO(dateISO: string) {
  const date = new Date(`${dateISO}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateISO
  return format(date, "EEE, MMM d")
}

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${pad2(minutes)}:${pad2(seconds)}`
}

const homeStorageKeys = {
  mode: "vipsync_guest_home_mode_v1",
  follows: "vipsync_guest_home_follows_v1",
  offers: "vipsync_guest_home_offers_v1",
  reserveIntent: "vipsync_guest_reserve_intent_v1",
} as const

interface HomeFollows {
  djKhaled: boolean
  teamAlpha: boolean
}

interface HomeOffers {
  mainBarClaimed: boolean
}

interface FeaturedTable {
  id: string
  name: string
  seats: string
  minSpend: number
  tag: "HOT" | "LIMITED" | "BEST VALUE"
}

const featuredTables: FeaturedTable[] = [
  { id: "jade-booth", name: "Jade Booth", seats: "4–6", minSpend: 1200, tag: "HOT" },
  { id: "pearl-sofa", name: "Pearl Sofa", seats: "2–4", minSpend: 800, tag: "BEST VALUE" },
  { id: "tokyo-stage", name: "Tokyo Stage", seats: "6–10", minSpend: 2200, tag: "LIMITED" },
]

function getIsOpenNow(date: Date) {
  // Demo hours: open 9PM–3AM (local time)
  const hour = date.getHours()
  return hour >= 21 || hour < 3
}

export function GuestHomeTab({
  onGoReserve,
  onGoWaitlist,
  reservation,
  waitlistEntry,
}: {
  onGoReserve: () => void
  onGoWaitlist: () => void
  reservation: GuestReservation | null
  waitlistEntry: GuestWaitlistEntry | null
}) {
  const { toast } = useToast()
  const [mode, setMode] = useLocalStorageState<"vibe" | "vip">(homeStorageKeys.mode, "vibe")
  const [follows, setFollows] = useLocalStorageState<HomeFollows>(homeStorageKeys.follows, {
    djKhaled: false,
    teamAlpha: false,
  })
  const [offers, setOffers] = useLocalStorageState<HomeOffers>(homeStorageKeys.offers, {
    mainBarClaimed: false,
  })

  const hasReservation =
    reservation?.status === "requested" || reservation?.status === "confirmed"
  const hasWait =
    waitlistEntry?.status === "waiting" || waitlistEntry?.status === "notified"
  const isOpenNow = getIsOpenNow(new Date())
  const isOffersUnlocked = hasReservation || hasWait

  const offerEndsAtRef = React.useRef<number>(Date.now() + (8 * 60 + 42) * 1000)
  const [offerRemainingMs, setOfferRemainingMs] = React.useState(
    offerEndsAtRef.current - Date.now()
  )

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setOfferRemainingMs(offerEndsAtRef.current - Date.now())
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      {/* Vibe-first header */}
      <div className="relative px-4 pt-6 pb-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: "url('/images/nightclub-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/70 pointer-events-none" />

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/70"
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 19) % 70}%`,
              }}
              animate={{
                y: [0, -14, 0],
                opacity: [0.15, 0.55, 0.15],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 2.2 + (i % 4) * 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="text-center">
            <motion.h1
              className="text-2xl font-black tracking-[0.22em] uppercase"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              TOKYO PEARL
            </motion.h1>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge
                className={
                  isOpenNow
                    ? "bg-neon-green/20 text-neon-green border-neon-green/40"
                    : "bg-muted text-muted-foreground border-border"
                }
              >
                {isOpenNow ? "OPEN" : "CLOSED"}
              </Badge>
              <Badge className="bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30">
                Downtown • 21+
              </Badge>
            </div>
          </div>

          {/* Mode switch */}
          <div className="mt-5">
            <Card className="p-2 glass-card border-border">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMode("vibe")}
                  aria-pressed={mode === "vibe"}
                  className={
                    mode === "vibe"
                      ? "bg-neon-cyan/25 text-neon-cyan border-neon-cyan/40 glow-cyan"
                      : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                  }
                >
                  THE VIBE
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMode("vip")}
                  aria-pressed={mode === "vip"}
                  className={
                    mode === "vip"
                      ? "bg-neon-pink/25 text-neon-pink border-neon-pink/40 glow-pink"
                      : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                  }
                >
                  VIP TABLES
                </Button>
              </div>
            </Card>
          </div>

          {/* Status chips (compact) */}
          {(hasReservation || hasWait) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {hasReservation && reservation && (
                <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/40">
                  <Calendar className="h-3 w-3 mr-1" />
                  Reserved • {reservation.partySize} • {formatDateISO(reservation.dateISO)}{" "}
                  {reservation.time}
                </Badge>
              )}
              {hasWait && waitlistEntry && (
                <Badge
                  className={
                    waitlistEntry.status === "notified"
                      ? "bg-neon-green/20 text-neon-green border-neon-green/40"
                      : "bg-neon-orange/20 text-neon-orange border-neon-orange/40"
                  }
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Waitlist • {waitlistEntry.partySize} • Est. {waitlistEntry.estimateMinutes}m
                </Badge>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4 pb-6">
        {mode === "vibe" ? (
          <>
            {/* DJ card */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 glass-card border-neon-purple/30 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                  transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
                  style={{
                    background:
                      "radial-gradient(circle at center, oklch(0.65 0.24 300 / 0.25) 0%, transparent 70%)",
                  }}
                />
                <div className="relative flex items-center gap-4">
                  <NeonAvatar
                    src="/images/avatars/man4.png"
                    fallback="DK"
                    size="xl"
                    glow="purple"
                    showPulse
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-lg font-black tracking-wide truncate">DJ KHALED</p>
                      <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/40">
                        ON DECKS
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Deep House • Techno</p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const next = !follows.djKhaled
                          setFollows((prev) => ({ ...prev, djKhaled: next }))
                          toast({
                            title: next ? "Following DJ Khaled" : "Unfollowed DJ Khaled",
                            description: next
                              ? "You’ll see updates on the Home vibe feed (demo)."
                              : "No more updates (demo).",
                          })
                        }}
                        className={
                          follows.djKhaled
                            ? "h-9 w-full rounded-full bg-neon-pink/20 text-neon-pink border border-neon-pink/40 glow-pink"
                            : "h-9 w-full rounded-full border-neon-pink/35 text-neon-pink hover:bg-neon-pink/10"
                        }
                      >
                        {follows.djKhaled ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            <span className="truncate">FOLLOWING</span>
                          </>
                        ) : (
                          <span className="truncate">+ FOLLOW</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Main bar offer card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="glass-card border-neon-cyan/30 overflow-hidden">
                <div className="relative h-44">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/club-floor.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

                  <div className="absolute top-3 right-3">
                    <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40">
                      Offer ends in:{" "}
                      <span className="tabular-nums ml-1">
                        {formatCountdown(offerRemainingMs)}
                      </span>
                    </Badge>
                  </div>

                  <div className="absolute left-4 bottom-3">
                    <p className="text-xl font-black tracking-tight">MAIN BAR</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 glass-card border-neon-cyan/30">
                      <p className="text-[10px] font-semibold text-neon-cyan tracking-wider">
                        FLASH DEAL
                      </p>
                      <p className="text-sm font-bold">2-for-1 Shots</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Tequila</p>
                    </Card>
                    <Card className="p-3 glass-card border-neon-purple/30">
                      <p className="text-[10px] font-semibold text-neon-pink tracking-wider">
                        SIGNATURE
                      </p>
                      <p className="text-sm font-bold">Neon Haze</p>
                      <p className="text-xs text-muted-foreground mt-0.5">$18.00</p>
                    </Card>
                  </div>

                  {!isOffersUnlocked ? (
                    <Button
                      className="w-full h-11 bg-gradient-to-r from-neon-cyan to-neon-purple text-primary-foreground glow-cyan"
                      onClick={() => {
                        toast({
                          title: "Unlock offers",
                          description: "Join the waitlist or reserve to unlock deals (demo).",
                        })
                        onGoWaitlist()
                      }}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      UNLOCK DEALS
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="border-border bg-transparent hover:bg-muted"
                        onClick={() => {
                          toast({
                            title: "Menu unlocked",
                            description: "Menu view is demo-only right now.",
                          })
                        }}
                      >
                        VIEW MENU
                      </Button>
                      <Button
                        className={
                          offers.mainBarClaimed
                            ? "bg-neon-green/20 text-neon-green border border-neon-green/40 hover:bg-neon-green/25"
                            : "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/25 glow-cyan"
                        }
                        variant="outline"
                        onClick={() => {
                          if (offers.mainBarClaimed) return
                          setOffers((prev) => ({ ...prev, mainBarClaimed: true }))
                          toast({
                            title: "Deal claimed",
                            description: "Show this to the bartender (demo).",
                          })
                        }}
                      >
                        {offers.mainBarClaimed ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            CLAIMED
                          </>
                        ) : (
                          "CLAIM DEAL"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Hosted by */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 glass-card border-neon-orange/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-orange/20 border border-neon-orange/40 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-neon-orange" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground tracking-wider font-semibold">
                        HOSTED BY
                      </p>
                      <p className="font-bold">Team Alpha</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = !follows.teamAlpha
                      setFollows((prev) => ({ ...prev, teamAlpha: next }))
                      toast({
                        title: next ? "Following Team Alpha" : "Unfollowed Team Alpha",
                        description: next
                          ? "You’ll get host updates on Home (demo)."
                          : "No more updates (demo).",
                      })
                    }}
                    className={
                      follows.teamAlpha
                        ? "rounded-full bg-neon-orange/20 text-neon-orange border border-neon-orange/40 glow-orange hover:bg-neon-orange/25"
                        : "rounded-full border-neon-orange/35 text-neon-orange hover:bg-neon-orange/10"
                    }
                  >
                    {follows.teamAlpha ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        FOLLOWING
                      </>
                    ) : (
                      "+ FOLLOW"
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Soft CTA into booking */}
            {!hasReservation && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <Card className="p-4 glass-card border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Want VIP tonight?</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Book ahead to unlock perks and deals.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={onGoReserve}
                      className="h-9 bg-gradient-to-r from-neon-pink to-neon-purple text-primary-foreground glow-pink rounded-full"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 glass-card border-neon-pink/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-neon-pink" />
                    <p className="font-semibold">VIP Tables</p>
                  </div>
                  <Badge className="bg-neon-green/20 text-neon-green border-neon-green/40">
                    Limited
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reserve ahead to skip the line and unlock VIP perks.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    onClick={onGoReserve}
                    className="h-11 bg-gradient-to-r from-neon-pink to-neon-purple text-primary-foreground glow-pink"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reserve
                  </Button>
                  <Button
                    onClick={onGoWaitlist}
                    variant="outline"
                    className="h-11 border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Waitlist
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Featured tables */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
            >
              <Card className="p-4 glass-card border-border">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Featured VIP</p>
                  <Badge className="bg-neon-pink/15 text-neon-pink border-neon-pink/30">
                    Tonight
                  </Badge>
                </div>

                <div className="mt-3 space-y-3">
                  {featuredTables.map((t) => (
                    <Card key={t.id} className="p-4 glass-card border-neon-pink/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold truncate">{t.name}</p>
                            <Badge
                              className={
                                t.tag === "HOT"
                                  ? "bg-neon-orange/20 text-neon-orange border-neon-orange/35"
                                  : t.tag === "LIMITED"
                                    ? "bg-neon-green/20 text-neon-green border-neon-green/35"
                                    : "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/35"
                              }
                            >
                              {t.tag}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Seats {t.seats} • Min spend{" "}
                            <span className="text-foreground font-medium">
                              {formatNumber(t.minSpend, { prefix: "$" })}
                            </span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-9 rounded-full bg-neon-pink/20 text-neon-pink border border-neon-pink/40 hover:bg-neon-pink/30"
                          variant="outline"
                          onClick={() => {
                            const intent: GuestReserveIntent = {
                              id: `gri_${Date.now()}`,
                              tableId: t.id,
                              tableName: t.name,
                              minSpend: t.minSpend,
                              partySizeSuggested:
                                t.id === "tokyo-stage" ? 8 : t.id === "jade-booth" ? 6 : 4,
                              notes: `Requesting ${t.name} (min spend ${formatNumber(t.minSpend, { prefix: "$" })}).`,
                              createdAtISO: new Date().toISOString(),
                            }
                            writeJsonToStorage(homeStorageKeys.reserveIntent, intent)
                            toast({
                              title: "VIP request added",
                              description: `${t.name} • Min ${formatNumber(t.minSpend, { prefix: "$" })}`,
                            })
                            onGoReserve()
                          }}
                        >
                          Request
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </motion.div>

          </>
        )}

        <p className="text-[11px] text-muted-foreground pt-2">
          Demo guest experience (no real backend yet). In production, this content would update live.
        </p>
      </div>
    </div>
  )
}

