import { useLocalStorageState } from "@/components/guest/guest-storage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ModalSheet } from "@/components/ui/modal"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { useToast } from "@/hooks/use-toast"
import { images } from "@/lib/assets"
import { formatNumber } from "@/lib/utils"
import { useTheme } from "@/theme/theme-provider"
import { Image } from "expo-image"
import { Calendar, Check, Clock, Gavel } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
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

const vipBiddingTables: VipBiddingTable[] = [
  { id: "table-4", name: "TABLE 4", capacity: 8, currentBid: 1200, leader: "@CryptoKing", nextBidAmount: 1250 },
  { id: "jade-booth", name: "Jade Booth", capacity: 6, currentBid: 1100, leader: "@VIPGuest", nextBidAmount: 1200 },
]

const vipBookingTables: VipBookingTable[] = [
  { id: "table-6", name: "TABLE 6", capacity: 6, description: "Great view of the stage. Standard minimum spend applies.", minSpend: 500 },
  { id: "pearl-sofa", name: "Pearl Sofa", capacity: 4, description: "Intimate setting. Min spend applies.", minSpend: 800 },
]

const featuredTables: FeaturedTable[] = [
  { id: "jade-booth", name: "Jade Booth", seats: "4–6", minSpend: 1200, tag: "HOT" },
  { id: "pearl-sofa", name: "Pearl Sofa", seats: "2–4", minSpend: 800, tag: "BEST VALUE" },
  { id: "tokyo-stage", name: "Tokyo Stage", seats: "6–10", minSpend: 2200, tag: "LIMITED" },
]

/** Combined list for VIP TABLES: bidding items first, then booking (same order as reference UI). */
const vipTableItems: VipTableItem[] = [
  ...vipBiddingTables.map((data) => ({ type: "bidding" as const, data })),
  ...vipBookingTables.map((data) => ({ type: "booking" as const, data })),
]

interface HomeEvent {
  id: string
  title: string
  dateLabel: string
  time: string
  venue: string
  tag?: "TONIGHT" | "LIVE" | "UPCOMING"
}

const homeEvents: HomeEvent[] = [
  { id: "e1", title: "Neon Nights", dateLabel: "Fri, Jan 31", time: "22:00", venue: "Main Floor", tag: "TONIGHT" },
  { id: "e2", title: "Deep House Session", dateLabel: "Sat, Feb 1", time: "23:00", venue: "Tokyo Pearl", tag: "UPCOMING" },
  { id: "e3", title: "VIP Rooftop", dateLabel: "Sat, Feb 1", time: "21:00", venue: "Rooftop", tag: "UPCOMING" },
]

function getIsOpenNow(date: Date) {
  const hour = date.getHours()
  return hour >= 21 || hour < 3
}

export function GuestHomeTab() {
  const { toast } = useToast()
  const { theme } = useTheme()

  const [mode, setMode] = useLocalStorageState<"vibe" | "vip">(homeStorageKeys.mode, "vibe")
  const [follows, setFollows] = useLocalStorageState<HomeFollows>(homeStorageKeys.follows, {
    djKhaled: false,
    teamAlpha: false,
  })
  const [biddingTable, setBiddingTable] = React.useState<FeaturedTable | null>(null)
  const [bidAmount, setBidAmount] = React.useState("")
  const [tableBids, setTableBids] = React.useState<Record<string, number>>({})
  const isOpenNow = getIsOpenNow(new Date())

  const openBidSheet = React.useCallback((table: FeaturedTable) => {
    setBiddingTable(table)
    setBidAmount("")
  }, [])

  const closeBidSheet = React.useCallback(() => {
    setBiddingTable(null)
    setBidAmount("")
  }, [])

  const submitBid = React.useCallback(() => {
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
    setTableBids((prev) => ({ ...prev, [biddingTable.id]: amount }))
    toast({
      title: "Bid placed",
      description: `${biddingTable.name}: ${formatNumber(amount, { prefix: "$" })}. We'll notify you if your bid is accepted.`,
    })
    closeBidSheet()
  }, [biddingTable, bidAmount, toast, closeBidSheet])

  const openBidSheetForVip = React.useCallback((data: VipBiddingTable) => {
    setBiddingTable({ id: data.id, name: data.name, seats: `${data.capacity}`, minSpend: data.nextBidAmount, tag: "HOT" })
    setBidAmount(String(data.nextBidAmount))
  }, [])

  const handleBookNow = React.useCallback(
    (data: VipBookingTable) => {
      toast({
        title: "Booking requested",
        description: `${data.name} at ${formatNumber(data.minSpend, { prefix: "$" })} min spend. We'll confirm shortly.`,
      })
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
                <NeonAvatar fallback="DK" size="xl" glow="purple" showPulse showRing />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                    <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 16 }} numberOfLines={1}>
                      DJ KHALED
                    </Text>
                    <Badge tone="pink">ON DECKS</Badge>
                  </View>
                  <Text style={{ color: theme.colors.mutedForeground, marginTop: 4 }}>
                    Deep House • Techno
                  </Text>
                  <View style={{ marginTop: 10 }}>
                    <Button
                      variant="outline"
                      tone={follows.djKhaled ? "pink" : "neutral"}
                      style={{ borderRadius: 999 }}
                      onPress={() => {
                        const next = !follows.djKhaled
                        setFollows((prev) => ({ ...prev, djKhaled: next }))
                        toast({
                          title: next ? "Following DJ Khaled" : "Unfollowed DJ Khaled",
                          description: next
                            ? "You’ll see updates on the Home vibe feed (demo)."
                            : "No more updates (demo).",
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
                </View>
              </View>
              </Card>
            </Animated.View>
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
                            >
                              <View style={styles.rowCenter}>
                                <Check size={16} color="#fff" />
                                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>BOOK NOW</Text>
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

        <Animated.View entering={FadeInDown.delay(200).duration(300).springify()} style={{ marginTop: 4 }}>
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 14, marginBottom: 10 }}>
            Events
          </Text>
          <View style={{ gap: 8 }}>
            {homeEvents.map((evt, idx) => (
              <Animated.View key={evt.id} entering={FadeInDown.delay(220 + idx * 40).duration(280).springify()}>
                <Card variant="glass" style={{ padding: 12, borderColor: `${theme.colors.neonCyan}33` }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 40, alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={18} color={theme.colors.neonCyan} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 14 }} numberOfLines={1}>
                          {evt.title}
                        </Text>
                        {evt.tag && (
                          <Badge tone={evt.tag === "TONIGHT" ? "pink" : evt.tag === "LIVE" ? "green" : "cyan"}>
                            {evt.tag}
                          </Badge>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <Clock size={12} color={theme.colors.mutedForeground} />
                        <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
                          {evt.dateLabel} · {evt.time} · {evt.venue}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </View>
    </ScrollView>

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
                onChangeText={setBidAmount}
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

