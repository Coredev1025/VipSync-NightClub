import { useLocalStorageState } from "@/components/guest/guest-storage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ModalSheet } from "@/components/ui/modal"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { useToast } from "@/hooks/use-toast"
import { images } from "@/lib/assets"
import { formatNumber } from "@/lib/utils"
import { useTheme } from "@/theme/theme-provider"
import { Image } from "expo-image"
import { Calendar, Check, Clock } from "lucide-react-native"
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

const featuredTables: FeaturedTable[] = [
  { id: "jade-booth", name: "Jade Booth", seats: "4–6", minSpend: 1200, tag: "HOT" },
  { id: "pearl-sofa", name: "Pearl Sofa", seats: "2–4", minSpend: 800, tag: "BEST VALUE" },
  { id: "tokyo-stage", name: "Tokyo Stage", seats: "6–10", minSpend: 2200, tag: "LIMITED" },
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
  const isOpenNow = getIsOpenNow(new Date())

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
                <View style={{ marginTop: 10, gap: 10 }}>
                  {featuredTables.map((t, idx) => (
                    <Animated.View key={t.id} entering={FadeInRight.delay(200 + idx * 50).duration(250).springify()}>
                      <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonPink}33` }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }} numberOfLines={1}>
                                {t.name}
                              </Text>
                              <Badge
                                tone={
                                  t.tag === "HOT"
                                    ? "orange"
                                    : t.tag === "LIMITED"
                                      ? "green"
                                      : "cyan"
                                }
                              >
                                {t.tag}
                              </Badge>
                            </View>
                            <Text style={{ color: theme.colors.mutedForeground, marginTop: 6 }}>
                              Seats {t.seats} • Min spend{" "}
                              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold" }}>
                                {formatNumber(t.minSpend, { prefix: "$" })}
                              </Text>
                            </Text>
                          </View>
                          <Badge tone="pink">
                            Min {formatNumber(t.minSpend, { prefix: "$" })}
                          </Badge>
                        </View>
                      </Card>
                    </Animated.View>
                  ))}
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

