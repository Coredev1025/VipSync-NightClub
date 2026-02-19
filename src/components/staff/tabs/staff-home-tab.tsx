import DateTimePicker from "@react-native-community/datetimepicker"
import { Image } from "expo-image"
import { Calendar, ChevronRight, Clock, List, Music, Plus, X } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated"

import { BottlesTab } from "@/components/tabs/bottles-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { ModalSheet } from "@/components/ui/modal"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { canManageVibeEvents } from "@/constants/role-permissions"
import { useVibe, type VibeEvent, type VibeState } from "@/contexts/vibe-context"
import { useToast } from "@/hooks/use-toast"
import { images } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

const TOP_VIBE_EVENTS = 5
const STATUS_ORDER: Record<VibeEvent["status"], number> = { live: 0, upcoming: 1 }

function getIsOpenNow(date: Date) {
  const hour = date.getHours()
  return hour >= 21 || hour < 3
}

function formatDateForDisplay(d: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
}

function formatDateForApi(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatTimeForDisplay(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const isPm = h >= 12
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, "0")} ${isPm ? "PM" : "AM"}`
}

function ScheduledTimePicker({
  value,
  onChange,
  theme,
  formatTimeForDisplay,
}: {
  value: string
  onChange: (t: string) => void
  theme: ReturnType<typeof useTheme>["theme"]
  formatTimeForDisplay: (d: Date) => string
}) {
  const [showPicker, setShowPicker] = React.useState(false)
  const [pickerValue, setPickerValue] = React.useState(() => {
    const d = new Date()
    d.setHours(22, 0, 0, 0)
    return d
  })
  const parseTime = (t: string): Date => {
    const [match, h, m, ampm] = t.match(/(\d+):(\d+)\s*(AM|PM)/i) ?? []
    if (match) {
      let hour = parseInt(h!, 10)
      if (ampm?.toUpperCase() === "PM" && hour < 12) hour += 12
      if (ampm?.toUpperCase() === "AM" && hour === 12) hour = 0
      const d = new Date()
      d.setHours(hour, parseInt(m!, 10), 0, 0)
      return d
    }
    const d = new Date()
    d.setHours(22, 0, 0, 0)
    return d
  }
  return (
    <View>
      <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>
        Scheduled Time
      </Text>
      <Pressable
        onPress={() => {
          if (value) setPickerValue(parseTime(value))
          setShowPicker(true)
        }}
        style={({ pressed }) => [
          { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={{ color: value ? theme.colors.foreground : theme.colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 15 }}>
          {value || "Select time"}
        </Text>
      </Pressable>
      {showPicker && (
        Platform.OS === "android" ? (
          <View style={{ marginTop: 8 }}>
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display="default"
              onChange={(ev, d) => {
                if (ev.type === "set" && d) {
                  setPickerValue(d)
                  onChange(formatTimeForDisplay(d))
                }
                setShowPicker(false)
              }}
            />
          </View>
        ) : (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            display="spinner"
            onChange={(ev, d) => {
              if (ev.type === "set" && d) {
                setPickerValue(d)
                onChange(formatTimeForDisplay(d))
              }
              setShowPicker(false)
            }}
          />
        )
      )}
    </View>
  )
}

/** Sort by most recent ranking: live first, then upcoming; within same status by id (newer first). */
function sortVibeEventsByRecent(events: VibeEvent[]): VibeEvent[] {
  return [...events].sort((a, b) => {
    const orderA = STATUS_ORDER[a.status as keyof typeof STATUS_ORDER] ?? 1
    const orderB = STATUS_ORDER[b.status as keyof typeof STATUS_ORDER] ?? 1
    const statusDiff = orderA - orderB
    if (statusDiff !== 0) return statusDiff
    const idA = a.id.startsWith("event-") ? parseInt(a.id.replace("event-", ""), 10) : parseInt(a.id, 10) || 0
    const idB = b.id.startsWith("event-") ? parseInt(b.id.replace("event-", ""), 10) : parseInt(b.id, 10) || 0
    return idB - idA
  })
}

export function StaffHomeTab({ userRole }: { userRole?: "promoter" | "manager" | "owner" | "door" } = {}) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const { vibe, setVibe, vibeEvents, addVibeEvent } = useVibe()
  const [showMenuModal, setShowMenuModal] = React.useState(false)
  const [showAddEventSheet, setShowAddEventSheet] = React.useState(false)
  const [showAllEventsSheet, setShowAllEventsSheet] = React.useState(false)
  const sortedEvents = React.useMemo(() => sortVibeEventsByRecent(vibeEvents), [vibeEvents])
  const topVibeEvents = React.useMemo(() => sortedEvents.slice(0, TOP_VIBE_EVENTS), [sortedEvents])
  /** Nightclub permissions: only manager & owner can add/edit events; promoter & door view only. */
  const canAddEvents = canManageVibeEvents(userRole)
  const [addEventForm, setAddEventForm] = React.useState<Omit<VibeEvent, "id">>({
    djName: "",
    date: "",
    time: "",
    genres: "",
    status: "upcoming",
  })
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const [showTimePicker, setShowTimePicker] = React.useState(false)
  const [datePickerValue, setDatePickerValue] = React.useState(() => new Date())
  const [timePickerValue, setTimePickerValue] = React.useState(() => {
    const d = new Date()
    d.setHours(22, 0, 0, 0)
    return d
  })

  const isOpenNow = getIsOpenNow(new Date())

  const currentEvent = React.useMemo(() => {
    return sortedEvents.find((e) => e.status === "live") ?? sortedEvents[0] ?? null
  }, [sortedEvents])

  const displayDjName = currentEvent?.djName || vibe.djName
  const displayGenres = currentEvent?.genres || vibe.genres
  const hasCurrentVibe = Boolean(displayDjName?.trim() || displayGenres?.trim() || vibe.djStatus !== "OFF DECKS")
  const displayInitials =
    (displayDjName || "")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || vibe.djInitials || "DJ"

  function handleToggleDecks() {
    const nextStatus: VibeState["djStatus"] = vibe.djStatus === "ON DECKS" ? "OFF DECKS" : "ON DECKS"
    const updated: VibeState = { ...vibe, djStatus: nextStatus }
    setVibe(updated)
    toast({
      title: "Vibe updated",
      description: `Status set to ${nextStatus}.`,
    })
  }

  async function handleAddEvent() {
    const trimmedDj = addEventForm.djName.trim()
    const trimmedDate = addEventForm.date.trim()
    const trimmedTime = addEventForm.time.trim()
    const trimmedGenres = addEventForm.genres.trim()
    if (!trimmedDj || !trimmedDate || !trimmedTime) {
      toast({ title: "Missing fields", description: "DJ Name, Date, and Time are required." })
      return
    }
    const newEvent = await addVibeEvent({
      djName: trimmedDj.toUpperCase(),
      date: trimmedDate,
      time: trimmedTime,
      genres: trimmedGenres || "—",
      status: addEventForm.status,
    })
    setShowAddEventSheet(false)
    setAddEventForm({ djName: "", date: "", time: "", genres: "", status: "upcoming" })
    setDatePickerValue(new Date())
    setTimePickerValue((prev) => {
      const d = new Date(prev)
      d.setHours(22, 0, 0, 0)
      return d
    })
    toast({ title: "Event added", description: `${newEvent.djName} has been added to Vibe Events.` })
  }

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
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(300).springify()}>
          <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonPurple}55` }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <NeonAvatar fallback={displayInitials} size="xl" glow="purple" showPulse showRing />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 16 }} numberOfLines={1}>
                  {hasCurrentVibe ? (displayDjName || "DJ") : "No vibe"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Music size={14} color={theme.colors.mutedForeground} />
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>
                    {hasCurrentVibe ? (displayGenres || "—") : "Set the vibe in this card"}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {hasCurrentVibe ? (
                  <HapticPressable
                    onPress={handleToggleDecks}
                    accessibilityLabel={vibe.djStatus === "ON DECKS" ? "Set off decks" : "Set on decks"}
                  >
                    <Badge
                      tone={
                        vibe.djStatus === "ON DECKS"
                          ? "pink"
                          : vibe.djStatus === "SCHEDULED"
                            ? "cyan"
                            : vibe.djStatus === "BREAK"
                              ? "orange"
                              : "neutral"
                      }
                    >
                      {vibe.djStatus}
                    </Badge>
                  </HapticPressable>
                ) : null}
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Main Bar / offers card - VIEW MENU only (no CLAIMED) */}
        <Animated.View entering={FadeInDown.delay(125).duration(300).springify()}>
          <Card variant="glass" style={{ overflow: "hidden", padding: 0 }}>
            <View style={{ height: 160 }}>
              <Image
                source={images.mainBar}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory"
                priority="high"
              />
              <View style={{ position: "absolute", left: 14, bottom: 10 }}>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "Orbitron_900Black" }}>MAIN BAR</Text>
              </View>
            </View>
            <View style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Card variant="glass" style={{ flex: 1, padding: 12, borderColor: `${theme.colors.neonCyan}44` }}>
                  <Text style={{ color: theme.colors.neonCyan, fontSize: 10, fontFamily: "Orbitron_900Black" }}>
                    FLASH DEAL
                  </Text>
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", marginTop: 6 }}>
                    2-for-1 Shots
                  </Text>
                  <Text style={{ color: theme.colors.mutedForeground, marginTop: 4, fontSize: 12 }}>
                    Tequila
                  </Text>
                </Card>
                <Card variant="glass" style={{ flex: 1, padding: 12, borderColor: `${theme.colors.neonPurple}44` }}>
                  <Text style={{ color: theme.colors.neonPink, fontSize: 10, fontFamily: "Orbitron_900Black" }}>
                    SIGNATURE
                  </Text>
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", marginTop: 6 }}>
                    Neon Haze
                  </Text>
                  <Text style={{ color: theme.colors.mutedForeground, marginTop: 4, fontSize: 12 }}>
                    $18.00
                  </Text>
                </Card>
              </View>
              <Button
                variant="outline"
                tone="neutral"
                onPress={() => setShowMenuModal(true)}
              >
                VIEW MENU
              </Button>
            </View>
          </Card>
        </Animated.View>

        {/* Vibe Events List */}
        <Animated.View entering={FadeInDown.delay(150).duration(300).springify()}>
          <Card variant="glass" style={{ padding: 14, borderColor: `${theme.colors.neonPurple}44` }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black" }}>Vibe Events</Text>
              {canAddEvents ? (
                <HapticPressable
                  onPress={() => setShowAddEventSheet(true)}
                  style={{ padding: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}18` }}
                  accessibilityLabel="Add event"
                  accessibilityRole="button"
                >
                  <Plus size={20} color={theme.colors.neonCyan} />
                </HapticPressable>
              ) : null}
            </View>
            <HapticPressable
              onPress={() => setShowAllEventsSheet(true)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: `${theme.colors.muted}22` }}
              accessibilityLabel="View all events"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <List size={18} color={theme.colors.neonCyan} />
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold", fontSize: 13 }}>Details</Text>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>View all {vibeEvents.length} events</Text>
              </View>
              <ChevronRight size={18} color={theme.colors.mutedForeground} />
            </HapticPressable>
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
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>
                            {event.date}
                          </Text>
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>•</Text>
                          <Clock size={12} color={theme.colors.mutedForeground} />
                          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>
                            {event.time}
                          </Text>
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
      </View>

    </ScrollView>

    {/* Add Event Sheet */}
    <ModalSheet open={showAddEventSheet} onClose={() => setShowAddEventSheet(false)} maxHeightPct={0.85} showHeader={false}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 12 }}>
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 18 }}>Add Event</Text>
          <HapticPressable onPress={() => setShowAddEventSheet(false)} style={{ padding: 8 }} accessibilityLabel="Close">
            <X size={22} color={theme.colors.foreground} />
          </HapticPressable>
        </View>
        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>DJ Name</Text>
            <Input
              placeholder="e.g. DJ KHALED"
              value={addEventForm.djName}
              onChangeText={(text) => setAddEventForm((prev) => ({ ...prev, djName: text }))}
            />
          </View>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Date</Text>
            <Pressable
              onPress={() => {
                setDatePickerValue(addEventForm.date ? new Date(addEventForm.date + "T12:00:00") : new Date())
                setShowDatePicker(true)
              }}
              style={({ pressed }) => [
                { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={{ color: addEventForm.date ? theme.colors.foreground : theme.colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                {addEventForm.date ? formatDateForDisplay(new Date(addEventForm.date + "T12:00:00")) : "Select date"}
              </Text>
            </Pressable>
            {showDatePicker && (
              Platform.OS === "android" ? (
                <View style={{ marginTop: 8 }}>
                  <DateTimePicker
                    value={datePickerValue}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(ev, d) => {
                      if (ev.type === "set" && d) {
                        setDatePickerValue(d)
                        setAddEventForm((prev) => ({ ...prev, date: formatDateForApi(d) }))
                      }
                      setShowDatePicker(false)
                    }}
                  />
                </View>
              ) : (
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(ev, d) => {
                    if (ev.type === "set" && d) {
                      setDatePickerValue(d)
                      setAddEventForm((prev) => ({ ...prev, date: formatDateForApi(d) }))
                    }
                    setShowDatePicker(false)
                  }}
                />
              )
            )}
          </View>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Time</Text>
            <Pressable
              onPress={() => {
                if (addEventForm.time) {
                  const [match, h, m, ampm] = addEventForm.time.match(/(\d+):(\d+)\s*(AM|PM)/i) ?? []
                  if (match) {
                    let hour = parseInt(h, 10)
                    if (ampm?.toUpperCase() === "PM" && hour < 12) hour += 12
                    if (ampm?.toUpperCase() === "AM" && hour === 12) hour = 0
                    const d = new Date()
                    d.setHours(hour, parseInt(m, 10), 0, 0)
                    setTimePickerValue(d)
                  }
                }
                setShowTimePicker(true)
              }}
              style={({ pressed }) => [
                { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={{ color: addEventForm.time ? theme.colors.foreground : theme.colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                {addEventForm.time || "Select time"}
              </Text>
            </Pressable>
            {showTimePicker && (
              Platform.OS === "android" ? (
                <View style={{ marginTop: 8 }}>
                  <DateTimePicker
                    value={timePickerValue}
                    mode="time"
                    display="default"
                    onChange={(ev, d) => {
                      if (ev.type === "set" && d) {
                        setTimePickerValue(d)
                        setAddEventForm((prev) => ({ ...prev, time: formatTimeForDisplay(d) }))
                      }
                      setShowTimePicker(false)
                    }}
                  />
                </View>
              ) : (
                <DateTimePicker
                  value={timePickerValue}
                  mode="time"
                  display="spinner"
                  onChange={(ev, d) => {
                    if (ev.type === "set" && d) {
                      setTimePickerValue(d)
                      setAddEventForm((prev) => ({ ...prev, time: formatTimeForDisplay(d) }))
                    }
                    setShowTimePicker(false)
                  }}
                />
              )
            )}
          </View>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Genres (optional)</Text>
            <Input
              placeholder="e.g. Deep House • Techno"
              value={addEventForm.genres}
              onChangeText={(text) => setAddEventForm((prev) => ({ ...prev, genres: text }))}
            />
          </View>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Status</Text>
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {(["upcoming", "live"] as const).map((status) => {
                const isSelected = addEventForm.status === status
                const accentColor = status === "live" ? theme.colors.neonPink : theme.colors.neonCyan
                return (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    tone={status === "live" ? "pink" : "cyan"}
                    style={isSelected ? { backgroundColor: `${accentColor}33` } : undefined}
                    onPress={() => setAddEventForm((prev) => ({ ...prev, status }))}
                  >
                    {status.toUpperCase()}
                  </Button>
                )
              })}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Button variant="outline" tone="neutral" style={{ flex: 1 }} onPress={() => setShowAddEventSheet(false)}>
              Cancel
            </Button>
            <Button variant="gradient" style={{ flex: 1 }} onPress={handleAddEvent}>
              <View style={styles.rowCenter}>
                <Plus size={16} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Orbitron_900Black" }}>Add Event</Text>
              </View>
            </Button>
          </View>
        </View>
      </View>
    </ModalSheet>

    {/* All Events (Details) Sheet */}
    <ModalSheet open={showAllEventsSheet} onClose={() => setShowAllEventsSheet(false)} maxHeightPct={0.9} showHeader={false}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 12 }}>
          <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 18 }}>All Vibe Events</Text>
          <HapticPressable onPress={() => setShowAllEventsSheet(false)} style={{ padding: 8 }} accessibilityLabel="Close">
            <X size={22} color={theme.colors.foreground} />
          </HapticPressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            {sortedEvents.map((event) => (
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

    <ModalSheet open={showMenuModal} onClose={() => setShowMenuModal(false)} maxHeightPct={1} showHeader={false}>
      <BottlesTab userRole={userRole} onClose={() => setShowMenuModal(false)} />
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
