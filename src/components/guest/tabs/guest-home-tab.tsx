import { useLocalStorageState } from "@/components/guest/guest-storage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ModalSheet } from "@/components/ui/modal"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { useToast } from "@/hooks/use-toast"
import { images } from "@/lib/assets"
import { useVibeOptional, type VibeEvent } from "@/contexts/vibe-context"
import { api } from "@/lib/api"
import { formatNumber } from "@/lib/utils"
import { useTheme } from "@/theme/theme-provider"
import { Image } from "expo-image"
import { Calendar, Check, ChevronRight, Clock, Gavel, List, Music } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated"
const homeStorageKeys = {
  mode: "vipsync_guest_home_mode_v1",
  follows: "vipsync_guest_home_follows_v1",
} as const

interface HomeFollows {
  djKhaled: boolean
  teamAlpha: boolean
}

interface FeaturedTable {
  id: string
  name: string
  seats: string
  minSpend: number
  tag: "HOT" | "LIMITED" | "BEST VALUE"
}

/** VIP table available for bidding: shows current bid, leader, next bid amount. */
interface VipBiddingTable {
  id: string
  name: string
  capacity: number
  currentBid: number
  leader: string
  nextBidAmount: number
}

/** VIP table available for fixed booking: shows min spend and book now. */
interface VipBookingTable {
  id: string
  name: string
  capacity: number
  description: string
  minSpend: number
}

type VipTableItem = { type: "bidding"; data: VipBiddingTable } | { type: "booking"; data: VipBookingTable }

/** Combined list for VIP TABLES: from API (bidding first, then booking). */

const TOP_VIBE_EVENTS = 5
const STATUS_ORDER: Record<VibeEvent["status"], number> = { live: 0, upcoming: 1 }

function sortVibeEventsByRecent(events: VibeEvent[]): VibeEvent[] {
  return [...events].sort((a, b) => {
    const orderA = STATUS_ORDER[a.status] ?? 1
    const orderB = STATUS_ORDER[b.status] ?? 1
    const statusDiff = orderA - orderB
    if (statusDiff !== 0) return statusDiff
    const idA = a.id.startsWith("event-") ? parseInt(a.id.replace("event-", ""), 10) : parseInt(a.id, 10) || 0
    const idB = b.id.startsWith("event-") ? parseInt(b.id.replace("event-", ""), 10) : parseInt(b.id, 10) || 0
    return idB - idA
  })
}

function getIsOpenNow(date: Date) {
  const hour = date.getHours()
  return hour >= 21 || hour < 3
}

export function GuestHomeTab() {
  const { toast } = useToast()
  const { theme } = useTheme()
  const vibeCtx = useVibeOptional()

  const [mode, setMode] = useLocalStorageState<"vibe" | "vip">(homeStorageKeys.mode, "vibe")
  const [follows, setFollows] = useLocalStorageState<HomeFollows>(homeStorageKeys.follows, {
    djKhaled: false,
    teamAlpha: false,
  })
  const [vipBidding, setVipBidding] = React.useState<VipBiddingTable[]>([])
  const [vipBooking, setVipBooking] = React.useState<VipBookingTable[]>([])
  const vipTableItems: VipTableItem[] = React.useMemo(
    () => [
      ...vipBidding.map((data) => ({ type: "bidding" as const, data })),
      ...vipBooking.map((data) => ({ type: "booking" as const, data })),
    ],
    [vipBidding, vipBooking]
  )
  React.useEffect(() => {
    api.get<{ bidding: VipBiddingTable[]; booking: VipBookingTable[] }>("/api/guest/vip-tables").then((res) => {
      if (res?.bidding) setVipBidding(res.bidding)
      if (res?.booking) setVipBooking(res.booking)
    }).catch(() => {})
  }, [])
  const [biddingTable, setBiddingTable] = React.useState<FeaturedTable | null>(null)
  const [bidAmount, setBidAmount] = React.useState("")
  const [tableBids, setTableBids] = React.useState<Record<string, number>>({})
  const [bookedTableIds, setBookedTableIds] = React.useState<Set<string>>(new Set())
  const isOpenNow = getIsOpenNow(new Date())
  const sortedVibeEvents = React.useMemo(
    () => (vibeCtx?.vibeEvents ? sortVibeEventsByRecent(vibeCtx.vibeEvents) : []),
    [vibeCtx?.vibeEvents]
  )
  const topVibeEvents = React.useMemo(() => sortedVibeEvents.slice(0, TOP_VIBE_EVENTS), [sortedVibeEvents])
  const [showAllVibeEventsSheet, setShowAllVibeEventsSheet] = React.useState(false)

  const currentVibeDj = vibeCtx?.vibe?.djName?.trim()
  const currentVibeGenres = vibeCtx?.vibe?.genres?.trim()
  const currentLiveEvent = vibeCtx?.vibeEvents?.find((e) => e.status === "live") ?? vibeCtx?.vibeEvents?.[0]
  const hasCurrentVibe = Boolean(
    currentVibeDj ||
    currentVibeGenres ||
    currentLiveEvent?.djName
  )
  const displayVibeName = currentLiveEvent?.djName || currentVibeDj || ""
  const displayVibeGenres = currentLiveEvent?.genres || currentVibeGenres || ""

  const openBidSheet = React.useCallback((table: FeaturedTable) => {
    setBiddingTable(table)
    setBidAmount("")
  }, [])

  const closeBidSheet = React.useCallback(() => {
    setBiddingTable(null)
    setBidAmount("")
  }, [])

  const submitBid = React.useCallback(async () => {
    if (!biddingTable) return
    const amount = parseInt(bidAmount.replace(/[^0-9]/g, ""), 10)
    if (Number.isNaN(amount) || amount < biddingTable.minSpend) {
      toast({
        title: "Invalid bid",
        description: `Minimum spend for ${biddingTable.name} is ${formatNumber(biddingTable.minSpend, { prefix: "$" })}`,
        variant: "destructive",
      })
      return
    }
    try {
      const res = await api.post<{ ok: boolean; newBid?: number; leader?: string; nextBidAmount?: number }>(
        `/api/guest/vip-tables/${biddingTable.id}/bid`,
        { amount }
      )
      setTableBids((prev) => ({ ...prev, [biddingTable.id]: amount }))
      setVipBidding((prev) =>
        prev.map((t) =>
          t.id === biddingTable.id
            ? {
                ...t,
                currentBid: res?.newBid ?? amount,
                leader: res?.leader ?? "You",
                nextBidAmount: res?.nextBidAmount ?? t.nextBidAmount,
              }
            : t
        )
      )
      toast({
        title: "Bid placed",
        description: `${biddingTable.name}: ${formatNumber(amount, { prefix: "$" })}. We'll notify you if your bid is accepted.`,
      })
      closeBidSheet()
    } catch {
      toast({ title: "Bid failed", description: "Could not place bid. Try again.", variant: "destructive" })
    }
  }, [biddingTable, bidAmount, toast, closeBidSheet])

  const openBidSheetForVip = React.useCallback((data: VipBiddingTable) => {
    setBiddingTable({ id: data.id, name: data.name, seats: `${data.capacity}`, minSpend: data.nextBidAmount, tag: "HOT" })
    setBidAmount(String(data.nextBidAmount))
  }, [])

  const handleBookNow = React.useCallback(
    async (data: VipBookingTable) => {
      try {
        await api.post<{ ok: boolean }>(`/api/guest/vip-tables/${data.id}/book`, {})
        setBookedTableIds((prev) => new Set(prev).add(data.id))
        toast({
          title: "Table booked",
          description: `${data.name} is reserved. See you soon!`,
        })
      } catch {
        toast({
          title: "Booking failed",
          description: "Could not book this table. Try again or contact the venue.",
          variant: "destructive",
        })
      }
    },
    [toast]
  )

  return (
    <>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
        <View style={{ height: 170, borderRadius: 22, overflow: "hidden" }}>
          <Image
            source={images.bgHome}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            cachePolicy="memory"
            priority="high"
          />
          <View style={{ padding: 14, flex: 1, justifyContent: "space-between" }}>
            <View>
              <MotiView
                from={{ opacity: 0.9 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 3500, loop: true }}
              >
                <Text style={{ color: "#fff", fontSize: 22, fontFamily: "Orbitron_900Black", letterSpacing: 4, textAlign: "center" }}>
                  TOKYO PEARL
                </Text>
              </MotiView>
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10 }}>
                <Badge tone={isOpenNow ? "green" : "neutral"}>{isOpenNow ? "OPEN" : "CLOSED"}</Badge>
                <Badge tone="cyan">Downtown • 21+</Badge>
              </View>
            </View>
          </View>
        </View>

        <Card variant="glass" style={{ marginTop: 12, padding: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              size="sm"
              variant="outline"
              tone={mode === "vibe" ? "cyan" : "neutral"}
              style={{ flex: 1, borderRadius: 14, height: 42 }}
              onPress={() => setMode("vibe")}
            >
              THE VIBE
            </Button>
            <Button
              size="sm"
              variant="outline"
              tone={mode === "vip" ? "pink" : "neutral"}
              style={{ flex: 1, borderRadius: 14, height: 42 }}
              onPress={() => setMode("vip")}
            >
              VIP TABLES
            </Button>
          </View>
        </Card>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {mode === "vibe" ? (
          <>
            <Animated.View entering={FadeInDown.delay(100).duration(300).springify()}>
              <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonPurple}55` }}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <NeonAvatar
                  fallback={hasCurrentVibe ? (displayVibeName.slice(0, 2).toUpperCase() || "DJ") : "—"}
                  size="xl"
                  glow="purple"
                  showPulse={hasCurrentVibe}
                  showRing={hasCurrentVibe}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                    <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 16 }} numberOfLines={1}>
                      {hasCurrentVibe ? (displayVibeName || "DJ") : "No vibe"}
                    </Text>
                    {hasCurrentVibe ? <Badge tone="pink">ON DECKS</Badge> : null}
                  </View>
                  <Text style={{ color: theme.colors.mutedForeground, marginTop: 4 }}>
                    {hasCurrentVibe ? (displayVibeGenres || "—") : "No current vibe set"}
                  </Text>
                  {hasCurrentVibe ? (
                    <View style={{ marginTop: 10 }}>
                      <Button
                        variant="outline"
                        tone={follows.djKhaled ? "pink" : "neutral"}
                        style={{ borderRadius: 999 }}
                        onPress={() => {
                        const next = !follows.djKhaled
                        setFollows((prev) => ({ ...prev, djKhaled: next }))
                        toast({
                          title: next ? "Following" : "Unfollowed",
                          description: next
                            ? "You’ll see updates on the Home vibe feed."
                            : "No more updates from this DJ.",
                        })
                      }}
                    >
                      {follows.djKhaled ? (
                        <View style={styles.rowCenter}>
                          <Check size={16} color={theme.colors.neonPink} />
                          <Text style={{ color: theme.colors.neonPink, fontFamily: "Orbitron_900Black" }}>FOLLOWING</Text>
                        </View>
                      ) : (
                        <Text style={{ color: theme.colors.neonPink, fontFamily: "Orbitron_900Black" }}>+ FOLLOW</Text>
                      )}
                    </Button>
                    </View>
                  ) : null}
                </View>
              </View>
              </Card>
            </Animated.View>

            {/* Vibe Events List (same style as pro mode) */}
            {sortedVibeEvents.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(150).duration(300).springify()} style={{ marginTop: 12 }}>
                <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonPurple}44` }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }}>Vibe Events</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowAllVibeEventsSheet(true)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: `${theme.colors.muted}22`,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <List size={18} color={theme.colors.neonCyan} />
                      <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 13 }}>Details</Text>
                      <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>View all {sortedVibeEvents.length} events</Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.mutedForeground} />
                  </Pressable>
                  <View style={{ gap: 10 }}>
                    {topVibeEvents.map((event, idx) => (
                      <Animated.View
                        key={event.id}
                        entering={FadeInRight.delay(250 + idx * 50).duration(250).springify()}
                      >
                        <Card
                          variant="glass"
                          style={{
                            padding: 12,
                            borderColor:
                              event.status === "live"
                                ? `${theme.colors.neonPink}55`
                                : `${theme.colors.neonCyan}44`,
                          }}
                        >
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 14 }} numberOfLines={1}>
                                  {event.djName}
                                </Text>
                                <Badge tone={event.status === "live" ? "pink" : "cyan"}>
                                  {event.status === "live" ? "LIVE" : "UPCOMING"}
                                </Badge>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <Calendar size={12} color={theme.colors.mutedForeground} />
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{event.date}</Text>
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>•</Text>
                                <Clock size={12} color={theme.colors.mutedForeground} />
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{event.time}</Text>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Music size={12} color={theme.colors.mutedForeground} />
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }} numberOfLines={1}>
                                  {event.genres}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </Card>
                      </Animated.View>
                    ))}
                  </View>
                </Card>
              </Animated.View>
            ) : null}
          </>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(100).duration(300).springify()}>
              <Card variant="glass" style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }}>Featured VIP</Text>
                  <Badge tone="pink">Tonight</Badge>
                </View>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginTop: 8, textAlign: "center" }}>
                  Select a table to bid or book.
                </Text>
                <View style={{ marginTop: 12, gap: 12 }}>
                  {vipTableItems.map((item, idx) =>
                    item.type === "bidding" ? (
                      <Animated.View key={item.data.id} entering={FadeInRight.delay(200 + idx * 50).duration(250).springify()}>
                        <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonCyan}55`, borderWidth: 1.5 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                <Text style={{ color: theme.colors.neonCyan, fontFamily: "Orbitron_900Black", fontSize: 18 }} numberOfLines={1}>
                                  {item.data.name}
                                </Text>
                                <Badge tone="cyan">BIDDING OPEN</Badge>
                              </View>
                              <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                                Cap: {item.data.capacity} Guests
                              </Text>
                              <View style={{ marginTop: 10, gap: 4 }}>
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>Current Bid</Text>
                                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 16 }}>
                                  {formatNumber(item.data.currentBid, { prefix: "$" })}
                                </Text>
                              </View>
                              <View style={{ marginTop: 6, gap: 2 }}>
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>Leader</Text>
                                <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{item.data.leader}</Text>
                              </View>
                            </View>
                            <Button
                              size="md"
                              variant="outline"
                              tone="cyan"
                              style={{ borderRadius: 12, minHeight: 44, borderWidth: 1.5 }}
                              onPress={() => openBidSheetForVip(item.data)}
                            >
                              <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                                PLACE BID ({formatNumber(item.data.nextBidAmount, { prefix: "$" })})
                              </Text>
                            </Button>
                          </View>
                        </Card>
                      </Animated.View>
                    ) : (
                      <Animated.View key={item.data.id} entering={FadeInRight.delay(200 + idx * 50).duration(250).springify()}>
                        <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonGreen}55`, borderWidth: 1.5 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                <Text style={{ color: theme.colors.neonGreen, fontFamily: "Orbitron_900Black", fontSize: 18 }} numberOfLines={1}>
                                  {item.data.name}
                                </Text>
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>Cap: {item.data.capacity} Guests</Text>
                              </View>
                              <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginTop: 8 }} numberOfLines={2}>
                                {item.data.description}
                              </Text>
                              <View style={{ marginTop: 10, gap: 4 }}>
                                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>Min Spend:</Text>
                                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 16 }}>
                                  {formatNumber(item.data.minSpend, { prefix: "$" })}
                                </Text>
                              </View>
                            </View>
                            <Button
                              size="md"
                              variant="solid"
                              tone="green"
                              style={{ borderRadius: 12, minHeight: 44 }}
                              onPress={() => handleBookNow(item.data)}
                              disabled={bookedTableIds.has(item.data.id)}
                            >
                              <View style={styles.rowCenter}>
                                <Check size={16} color="#fff" />
                                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>
                                  {bookedTableIds.has(item.data.id) ? "BOOKED" : "BOOK NOW"}
                                </Text>
                              </View>
                            </Button>
                          </View>
                        </Card>
                      </Animated.View>
                    )
                  )}
                </View>
              </Card>
            </Animated.View>
          </>
        )}
      </View>
    </ScrollView>

      {/* All Vibe Events sheet (guest) */}
      <ModalSheet open={showAllVibeEventsSheet} onClose={() => setShowAllVibeEventsSheet(false)} maxHeightPct={0.9} showHeader={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 12 }}>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 18 }}>All Vibe Events</Text>
            <Pressable onPress={() => setShowAllVibeEventsSheet(false)} style={{ padding: 8 }}>
              <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold" }}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {sortedVibeEvents.map((event) => (
                <Card
                  key={event.id}
                  variant="glass"
                  style={{
                    padding: 12,
                    borderColor:
                      event.status === "live"
                        ? `${theme.colors.neonPink}55`
                        : `${theme.colors.neonCyan}44`,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 14 }} numberOfLines={1}>
                          {event.djName}
                        </Text>
                        <Badge tone={event.status === "live" ? "pink" : "cyan"}>
                          {event.status === "live" ? "LIVE" : "UPCOMING"}
                        </Badge>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Calendar size={12} color={theme.colors.mutedForeground} />
                        <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{event.date}</Text>
                        <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>•</Text>
                        <Clock size={12} color={theme.colors.mutedForeground} />
                        <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{event.time}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Music size={12} color={theme.colors.mutedForeground} />
                        <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }} numberOfLines={1}>
                          {event.genres}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </ScrollView>
        </View>
      </ModalSheet>

      <ModalSheet
        open={biddingTable != null}
        onClose={closeBidSheet}
        maxHeightPct={0.5}
        title={biddingTable ? `Place bid — ${biddingTable.name}` : "Place bid"}
        showHeader
      >
        {biddingTable ? (
          <View style={{ padding: 16, gap: 14 }}>
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>
              Min spend: {formatNumber(biddingTable.minSpend, { prefix: "$" })} • Seats {biddingTable.seats}
            </Text>
            <View>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginBottom: 6 }}>Your bid amount</Text>
              <Input
                value={bidAmount}
                onChangeText={(text) => setBidAmount(text.replace(/[^0-9]/g, ""))}
                placeholder={`e.g. ${biddingTable.minSpend}`}
                keyboardType="number-pad"
                containerStyle={{ borderColor: theme.colors.border, borderRadius: 12 }}
                style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold" }}
                placeholderTextColor={theme.colors.mutedForeground}
              />
            </View>
            <Button variant="solid" tone="pink" onPress={submitBid} style={{ marginTop: 4 }}>
              <View style={styles.rowCenter}>
                <Gavel size={18} color={theme.colors.neonPink} />
                <Text style={{ color: theme.colors.neonPink, fontFamily: "Orbitron_700Bold" }}>Submit bid</Text>
              </View>
            </Button>
          </View>
        ) : null}
      </ModalSheet>
    </>
  )
}

const styles = StyleSheet.create({
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
})

