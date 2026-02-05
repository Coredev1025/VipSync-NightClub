import { Image } from "expo-image"
import { Calendar, ChevronRight, Clock, List, Music, Plus, Save, X } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated"

import { useLocalStorageState } from "@/components/guest/guest-storage"
import { BottlesTab } from "@/components/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { ModalCard, ModalSheet } from "@/components/ui/modal"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { canManageVibeEvents } from "@/constants/role-permissions"
import { useToast } from "@/hooks/use-toast"
import { images } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

const vibeStorageKey = "vipsync_staff_vibe_v1"
const vibeEventsStorageKey = "vipsync_staff_vibe_events_v1"

interface VibeState {
  djName: string
  djStatus: "ON DECKS" | "OFF DECKS" | "SCHEDULED" | "BREAK"
  genres: string
  djInitials: string
  scheduledTime?: string
}

interface VibeEvent {
  id: string
  djName: string
  date: string
  time: string
  genres: string
  status: "upcoming" | "live"
}

const defaultVibe: VibeState = {
  djName: "DJ KHALED",
  djStatus: "ON DECKS",
  genres: "Deep House • Techno",
  djInitials: "DK",
}

const defaultVibeEvents: VibeEvent[] = [
  {
    id: "1",
    djName: "DJ KHALED",
    date: "Today",
    time: "10:00 PM",
    genres: "Deep House • Techno",
    status: "live",
  },
  {
    id: "2",
    djName: "TEAM ALPHA",
    date: "Tomorrow",
    time: "11:00 PM",
    genres: "EDM • Progressive House",
    status: "upcoming",
  },
  {
    id: "3",
    djName: "DJ SPARK",
    date: "Friday",
    time: "9:00 PM",
    genres: "Hip Hop • R&B",
    status: "upcoming",
  },
  {
    id: "4",
    djName: "NEON NIGHTS",
    date: "Saturday",
    time: "10:30 PM",
    genres: "Techno • Trance",
    status: "upcoming",
  },
]

const TOP_VIBE_EVENTS = 5
const STATUS_ORDER: Record<VibeEvent["status"], number> = { live: 0, upcoming: 1 }

function getIsOpenNow(date: Date) {
  const hour = date.getHours()
  return hour >= 21 || hour < 3
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

  const [vibe, setVibe] = useLocalStorageState<VibeState>(vibeStorageKey, defaultVibe)
  const [vibeEvents, setVibeEvents] = useLocalStorageState<VibeEvent[]>(vibeEventsStorageKey, defaultVibeEvents)
  const [showEditVibe, setShowEditVibe] = React.useState(false)
  const [showMenuModal, setShowMenuModal] = React.useState(false)
  const [showAddEventSheet, setShowAddEventSheet] = React.useState(false)
  const [showAllEventsSheet, setShowAllEventsSheet] = React.useState(false)
  const [editForm, setEditForm] = React.useState<VibeState>(vibe)
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

  const isOpenNow = getIsOpenNow(new Date())

  React.useEffect(() => {
    setEditForm(vibe)
  }, [vibe])

  function handleSaveVibe() {
    // Generate initials from DJ name
    const initials = editForm.djName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    const updatedVibe: VibeState = {
      ...editForm,
      djInitials: initials || "DJ",
    }

    setVibe(updatedVibe)
    setShowEditVibe(false)
    toast({
      title: "Vibe updated",
      description: "Changes will be visible to guests immediately.",
    })
  }

  function handleStatusChange(status: VibeState["djStatus"]) {
    setEditForm((prev) => ({ ...prev, djStatus: status }))
  }

  function handleToggleDecks() {
    const nextStatus: VibeState["djStatus"] = vibe.djStatus === "ON DECKS" ? "OFF DECKS" : "ON DECKS"
    const updated: VibeState = { ...vibe, djStatus: nextStatus }
    setVibe(updated)
    setEditForm(updated)
    toast({
      title: "Vibe updated",
      description: `Status set to ${nextStatus}.`,
    })
  }

  function handleAddEvent() {
    const trimmedDj = addEventForm.djName.trim()
    const trimmedDate = addEventForm.date.trim()
    const trimmedTime = addEventForm.time.trim()
    const trimmedGenres = addEventForm.genres.trim()
    if (!trimmedDj || !trimmedDate || !trimmedTime) {
      toast({ title: "Missing fields", description: "DJ Name, Date, and Time are required." })
      return
    }
    const newEvent: VibeEvent = {
      id: `event-${Date.now()}`,
      djName: trimmedDj.toUpperCase(),
      date: trimmedDate,
      time: trimmedTime,
      genres: trimmedGenres || "—",
      status: addEventForm.status,
    }
    setVibeEvents((prev) => [newEvent, ...prev])
    setShowAddEventSheet(false)
    setAddEventForm({ djName: "", date: "", time: "", genres: "", status: "upcoming" })
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
              <NeonAvatar fallback={vibe.djInitials} size="xl" glow="purple" showPulse showRing />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 16 }} numberOfLines={1}>
                  {vibe.djName}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Music size={14} color={theme.colors.mutedForeground} />
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>
                    {vibe.genres}
                  </Text>
                </View>
                {vibe.scheduledTime && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <Calendar size={14} color={theme.colors.neonCyan} />
                    <Text style={{ color: theme.colors.neonCyan, fontSize: 12, fontFamily: "Orbitron_800ExtraBold" }}>
                      Scheduled: {vibe.scheduledTime}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
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
                <HapticPressable
                  onPress={() => setShowEditVibe(true)}
                  accessibilityLabel="Edit vibe details"
                >
                  <Badge tone="cyan">Edit vibe</Badge>
                </HapticPressable>
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

      {/* Edit Vibe Modal */}
      <ModalCard open={showEditVibe} onClose={() => setShowEditVibe(false)}>
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_900Black", fontSize: 18 }}>
              Manage Vibe
            </Text>
            <Button
              size="icon"
              variant="ghost"
              tone="neutral"
              onPress={() => setShowEditVibe(false)}
            >
              <X size={18} color={theme.colors.mutedForeground} />
            </Button>
          </View>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>
                DJ Name
              </Text>
              <Input
                placeholder="DJ Name"
                value={editForm.djName}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, djName: text.toUpperCase() }))}
              />
            </View>

            <View>
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>
                Status
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {(["ON DECKS", "OFF DECKS", "SCHEDULED", "BREAK"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={editForm.djStatus === status ? "solid" : "outline"}
                    tone={editForm.djStatus === status ? "pink" : "neutral"}
                    style={{ flex: status === "ON DECKS" || status === "OFF DECKS" ? 1 : undefined, minWidth: status === "SCHEDULED" || status === "BREAK" ? 120 : undefined }}
                    onPress={() => handleStatusChange(status)}
                  >
                    {status}
                  </Button>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>
                Genres
              </Text>
              <Input
                placeholder="e.g., Deep House • Techno"
                value={editForm.genres}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, genres: text }))}
              />
            </View>

            {editForm.djStatus === "SCHEDULED" && (
              <View>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>
                  Scheduled Time
                </Text>
                <Input
                  placeholder="e.g., 10:00 PM"
                  value={editForm.scheduledTime || ""}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, scheduledTime: text }))}
                />
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Button
                variant="outline"
                tone="neutral"
                style={{ flex: 1 }}
                onPress={() => {
                  setEditForm(vibe)
                  setShowEditVibe(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                style={{ flex: 1 }}
                onPress={handleSaveVibe}
              >
                <View style={styles.rowCenter}>
                  <Save size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontFamily: "Orbitron_900Black" }}>Save</Text>
                </View>
              </Button>
            </View>
          </View>
        </View>
      </ModalCard>
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
            <Input
              placeholder="e.g. Today, Tomorrow, Friday"
              value={addEventForm.date}
              onChangeText={(text) => setAddEventForm((prev) => ({ ...prev, date: text }))}
            />
          </View>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_800ExtraBold", marginBottom: 6, fontSize: 12 }}>Time</Text>
            <Input
              placeholder="e.g. 10:00 PM"
              value={addEventForm.time}
              onChangeText={(text) => setAddEventForm((prev) => ({ ...prev, time: text }))}
            />
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
