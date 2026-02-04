import DateTimePicker from "@react-native-community/datetimepicker"
import { Canvas, Group, Path, Skia } from "@shopify/react-native-skia"
import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Grid3X3,
  List,
  Mic,
  Pencil,
  Plus,
  Satellite,
  Search,
  Trash2,
  User,
  UserPlus,
  Users,
  Wine,
  X,
  Zap
} from "lucide-react-native"
import * as React from "react"
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { AlertDialog, ModalCard, ModalSheet } from "@/components/ui/modal"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { useToast } from "@/hooks/use-toast"
import { avatars, bottleImages, resolveAvatar, tableImages, type BottleImageKey, type TableImageKey } from "@/lib/assets"
import { formatNumber } from "@/lib/utils"
import { useTheme } from "@/theme/theme-provider"

type ViewMode = "map" | "list"
type TableStatus = "open" | "occupied" | "booked" | "pending"
type TopSegment = "map" | "list"
type TableFilter = "all" | TableStatus

type AvatarKey = keyof typeof avatars

interface Table {
  id: string
  number: number
  x: number
  y: number
  status: TableStatus
  capacity: number
  currentGuests: number
  guestName?: string
  spend?: number
  pendingSpend?: number
  itemsSummary?: string
  primaryStaff?: string
  backupStaff?: string
  assignedTo?: string
  promoter?: string
  server?: string
  eta?: string
  /** Avatar keys from @/lib/assets for card display */
  guestAvatarKey?: AvatarKey
  promoterAvatarKey?: AvatarKey
  bottleGirlAvatarKey?: AvatarKey
  isVip?: boolean
  /** When true, display as "DJ" instead of number (DJ booth) */
  isDjBooth?: boolean
  /** DJ set time / slot (e.g. "10pm–2am") – only for DJ booth */
  djSetTime?: string
}

interface StaffMember {
  id: string
  name: string
  role: string
  avatar: string
  isOnline: boolean
  tablesAssigned: number
}

const availableStaff: StaffMember[] = [
  {
    id: "1",
    name: "Sarah M.",
    role: "Promoter",
    avatar: "/images/avatars/woman1.png",
    isOnline: true,
    tablesAssigned: 2,
  },
  {
    id: "2",
    name: "Mike J.",
    role: "Promoter",
    avatar: "/images/avatars/man2.png",
    isOnline: true,
    tablesAssigned: 1,
  },
  {
    id: "3",
    name: "John Doe",
    role: "Promoter",
    avatar: "/images/avatars/man1.png",
    isOnline: true,
    tablesAssigned: 0,
  },
  {
    id: "4",
    name: "Marcus Chen",
    role: "Promoter",
    avatar: "/images/avatars/man3.png",
    isOnline: false,
    tablesAssigned: 0,
  },
  {
    id: "5",
    name: "Alex Kim",
    role: "Promoter",
    avatar: "/images/avatars/man4.png",
    isOnline: true,
    tablesAssigned: 1,
  },
  {
    id: "6",
    name: "Lisa Wang",
    role: "Promoter",
    avatar: "/images/avatars/man5.png",
    isOnline: true,
    tablesAssigned: 0,
  },
]

const availableBottleGirls: StaffMember[] = [
  { id: "bg1", name: "Jessica K.", role: "Bottle girl", avatar: "/images/avatars/woman1.png", isOnline: true, tablesAssigned: 3 },
  { id: "bg2", name: "Maya L.", role: "Bottle girl", avatar: "/images/avatars/woman1.png", isOnline: true, tablesAssigned: 2 },
  { id: "bg3", name: "Sofia R.", role: "Bottle girl", avatar: "/images/avatars/woman1.png", isOnline: false, tablesAssigned: 0 },
  { id: "bg4", name: "Emma T.", role: "Bottle girl", avatar: "/images/avatars/woman1.png", isOnline: true, tablesAssigned: 1 },
]

// Table positions: 1 & 2 up, 3 & 4 down — dance floor (50,50) fully visible
const initialTables: Table[] = [
  {
    id: "1",
    number: 5,
    x: 8,
    y: 5,
    status: "occupied",
    capacity: 12,
    currentGuests: 10,
    guestName: "Marcus Thompson",
    spend: 1200,
    pendingSpend: 600,
    itemsSummary: "1x Ace, 2x Goose",
    primaryStaff: "Mike Tyson",
    backupStaff: "Jessica Stone",
    assignedTo: "Sarah M.",
    promoter: "",
    server: "",
    guestAvatarKey: "man3",
    promoterAvatarKey: "man2",
    bottleGirlAvatarKey: "woman1",
    isVip: true,
  },
  {
    id: "2",
    number: 2,
    x: 55,
    y: 5,
    status: "occupied",
    capacity: 10,
    currentGuests: 8,
    guestName: "Elite Group",
    spend: 4200,
    pendingSpend: 400,
    primaryStaff: "Mike J.",
    backupStaff: "Lisa Wang",
    assignedTo: "Mike J.",
    promoter: "",
    server: "",
  },
  { id: "3", number: 3, x: 8, y: 63, status: "pending", capacity: 6, currentGuests: 0, guestName: "Reservation", eta: "15m" },
  { id: "4", number: 4, x: 75, y: 63, status: "open", capacity: 8, currentGuests: 0 },
  { id: "dj", number: 0, x: 85, y: 50, status: "occupied", capacity: 1, currentGuests: 1, guestName: "DJ Booth", isDjBooth: true, djSetTime: "10pm–2am" },
]

const entrancePos = { x: 50, y: 95 }

// Main Bar & Specials – Table & Bar Menu sample data
interface TableServiceItem {
  id: string
  title: string
  price: string
  capacity?: string
  desc?: string
  /** LTO: limited-time offer with date range */
  limitedOffer?: boolean
  limitedDateStart?: string
  limitedDate?: string
  iconKey?: BottleImageKey
  /** Discount: toggle to show/hide discount fields (like LTO) */
  discountOffer?: boolean
  discountPrice?: string
  discountTimeLimitStart?: string
  discountTimeLimit?: string
}
interface BarDrinkItem {
  id: string
  title: string
  desc?: string
  price: string
  iconKey?: BottleImageKey
  iconColor?: string
  /** LTO: limited-time offer with date range */
  limitedOffer?: boolean
  limitedDateStart?: string
  limitedDate?: string
  /** Discount: toggle to show/hide discount fields (like LTO) */
  discountOffer?: boolean
  discountPrice?: string
  discountTimeLimitStart?: string
  discountTimeLimit?: string
}

const tableServiceItems: TableServiceItem[] = [
  {
    id: "1",
    title: "Ace of Spades Gold",
    price: "$600 Table Minimum",
    capacity: "✓ COVERS 6 GUESTS",
    desc: "($100 per person coverage)",
    iconKey: "ace",
  },
  {
    id: "2",
    title: "Don Julio 1942",
    price: "$550 (Was $700)",
    limitedOffer: true,
    limitedDate: "2025-12-31",
    iconKey: "champagne",
  },
]
const TABLE_IMAGE_KEYS: TableImageKey[] = ["table1", "table2", "table3", "table4", "table5", "table6", "table7"]
const BAR_ITEM_COLORS = ["#E8A838", "#00F0FF", "#00D26A"] as const // amber, cyan, green per item
const barDrinkItems: BarDrinkItem[] = [
  { id: "1", title: "Espresso Martini", desc: "Premium Vodka, Cold Brew", price: "$18", iconKey: "coffee", iconColor: BAR_ITEM_COLORS[0], limitedOffer: true, limitedDate: "2025-12-31" },
  { id: "2", title: "Old Fashioned", desc: "Bourbon, Bitters, Orange", price: "$16", iconKey: "cocktail", iconColor: BAR_ITEM_COLORS[1] },
  { id: "3", title: "Asahi Draft", desc: "Japanese Lager", price: "$9", iconKey: "beer", iconColor: BAR_ITEM_COLORS[2] },
]

/** Guest list (date-specific); one-time guests are tied to a list. */
interface GuestList {
  id: string
  date: string // YYYY-MM-DD
}

interface ExpectingGuest {
  id: string
  initials: string
  name: string
  table: number
  extraGuests: number
  avatarKey?: AvatarKey
  /** Recurring = always on list; one-time = part of tonight's table for this list. */
  tier: "recurring" | "one-time"
  /** Required when tier === "one-time" — which guest list (date) they belong to. */
  listId?: string
  /** Date added (YYYY-MM-DD); shown in list for display. */
  dateAdded?: string
}

function formatGuestDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function todayGuestListId(): string {
  return new Date().toISOString().slice(0, 10)
}

const initialGuestLists: GuestList[] = [{ id: todayGuestListId(), date: todayGuestListId() }]
const initialRecurringGuests: ExpectingGuest[] = [
  { id: "r1", initials: "JW", name: "John Wick", table: 5, extraGuests: 2, avatarKey: "man1", tier: "recurring", dateAdded: todayGuestListId() },
  { id: "r2", initials: "SC", name: "Sarah Connor", table: 3, extraGuests: 1, avatarKey: "woman1", tier: "recurring", dateAdded: todayGuestListId() },
  { id: "r3", initials: "DK", name: "Diana King", table: 1, extraGuests: 0, avatarKey: "woman1", tier: "recurring", dateAdded: todayGuestListId() },
  { id: "r4", initials: "TB", name: "Tom Bradley", table: 4, extraGuests: 3, avatarKey: "man1", tier: "recurring", dateAdded: todayGuestListId() },
  { id: "r5", initials: "LR", name: "Lisa Rivera", table: 6, extraGuests: 1, avatarKey: "woman1", tier: "recurring", dateAdded: todayGuestListId() },
]
const initialOneTimeGuests: ExpectingGuest[] = [
  { id: "o1", initials: "MJ", name: "Marcus Johnson", table: 7, extraGuests: 4, avatarKey: "man3", tier: "one-time", listId: todayGuestListId(), dateAdded: todayGuestListId() },
  { id: "o2", initials: "EL", name: "Emma Lee", table: 2, extraGuests: 0, avatarKey: "woman1", tier: "one-time", listId: todayGuestListId(), dateAdded: todayGuestListId() },
  { id: "o3", initials: "JP", name: "James Park", table: 8, extraGuests: 2, avatarKey: "man1", tier: "one-time", listId: todayGuestListId(), dateAdded: todayGuestListId() },
  { id: "o4", initials: "NC", name: "Nina Chen", table: 9, extraGuests: 0, avatarKey: "woman1", tier: "one-time", listId: todayGuestListId(), dateAdded: todayGuestListId() },
  { id: "o5", initials: "RW", name: "Ryan Wright", table: 10, extraGuests: 1, avatarKey: "man3", tier: "one-time", listId: todayGuestListId(), dateAdded: todayGuestListId() },
]

export interface PendingChatOrder {
  tableNumber: number
  guest: string
  items: string
}

export type MapTabUserRole = "promoter" | "manager" | "owner" | "door"

export interface MapTabProps {
  /** When true (user/guest mode), hides Guests, voice, and PDF import controls */
  guestMode?: boolean
  /** Order from chat "Order Synced. Tap to View Map." – applied to table and then cleared */
  pendingChatOrder?: PendingChatOrder | null
  onConsumePendingOrder?: () => void
  /** Manager/owner can edit promoter + table girl; promoter can only edit promoter. All pro roles can see all table info. */
  userRole?: MapTabUserRole
}

const canEditTableGirl = (role: MapTabUserRole | undefined) =>
  role === "manager" || role === "owner"

/** Door staff: view-only (no editing tables). Other roles can edit. */
const canEditMapTables = (role: MapTabUserRole | undefined) => role !== "door"

export function MapTab({ guestMode = false, pendingChatOrder, onConsumePendingOrder, userRole = "manager" }: MapTabProps = {}) {
  const { theme } = useTheme()

  const [viewMode, setViewMode] = React.useState<ViewMode>("map")
  const [tables, setTables] = React.useState<Table[]>(initialTables)
  const [highlightTableFromChat, setHighlightTableFromChat] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!pendingChatOrder || !onConsumePendingOrder) return
    const { tableNumber, guest, items } = pendingChatOrder
    setTables((prev) => {
      const idx = prev.findIndex((t) => t.number === tableNumber)
      if (idx >= 0) {
        return prev.map((t, i) =>
          i === idx
            ? { ...t, guestName: guest, itemsSummary: items, status: "occupied" as TableStatus, currentGuests: t.currentGuests || 1 }
            : t
        )
      }
      const newId = `chat-${tableNumber}-${Date.now()}`
      return [
        ...prev,
        {
          id: newId,
          number: tableNumber,
          x: 30,
          y: 35,
          status: "occupied" as TableStatus,
          capacity: 6,
          currentGuests: 1,
          guestName: guest,
          itemsSummary: items,
        } as Table,
      ]
    })
    setHighlightTableFromChat(tableNumber)
    // Defer clearing so the tables state is committed and the map re-renders with the order visible first
    const id = setTimeout(() => onConsumePendingOrder(), 0)
    return () => clearTimeout(id)
  }, [pendingChatOrder, onConsumePendingOrder])

  const [selectedTable, setSelectedTable] = React.useState<Table | null>(null)

  // After applying a chat order, select that table so the order state is visible
  React.useEffect(() => {
    if (highlightTableFromChat == null) return
    const table = tables.find((t) => t.number === highlightTableFromChat)
    if (table) {
      setSelectedTable(table)
      setHighlightTableFromChat(null)
    }
  }, [highlightTableFromChat, tables])
  const [isVoiceActive, setIsVoiceActive] = React.useState(false)
  const [showPath, setShowPath] = React.useState(false)
  const [pathTarget, setPathTarget] = React.useState<Table | null>(initialTables[1])
  const [tableFilter, setTableFilter] = React.useState<TableFilter>("all")

  const [showAssignStaffDialog, setShowAssignStaffDialog] = React.useState(false)
  const [showEditTableSheet, setShowEditTableSheet] = React.useState(false)
  const [showBarSpecialsSheet, setShowBarSpecialsSheet] = React.useState(false)
  const [mainBarSpecialsVisible, setMainBarSpecialsVisible] = React.useState(true)
  const mainBarTranslateY = useSharedValue(0)
  const [showGuestList, setShowGuestList] = React.useState(false)
  const [guestListTab, setGuestListTab] = React.useState<"pending" | "arrived">("pending")
  const [guestListTierFilter, setGuestListTierFilter] = React.useState<"all" | "recurring" | "one-time">("all")
  const [showGuestListTierDropdown, setShowGuestListTierDropdown] = React.useState(false)
  const [guestListSearch, setGuestListSearch] = React.useState("")
  const [guestListPage, setGuestListPage] = React.useState(0)
  const GUEST_LIST_PAGE_SIZE = 10
  const [guestLists, setGuestLists] = React.useState<GuestList[]>(() => [...initialGuestLists])
  const [selectedGuestListId, setSelectedGuestListId] = React.useState<string>(() => todayGuestListId())
  const [recurringGuests, setRecurringGuests] = React.useState<ExpectingGuest[]>(() => [...initialRecurringGuests])
  const [oneTimeGuests, setOneTimeGuests] = React.useState<ExpectingGuest[]>(() => [...initialOneTimeGuests])
  const [arrivedGuests, setArrivedGuests] = React.useState<ExpectingGuest[]>([])
  const [showAddGuestSheet, setShowAddGuestSheet] = React.useState(false)
  const [newGuestName, setNewGuestName] = React.useState("")
  const [newGuestTable, setNewGuestTable] = React.useState("")
  const [newGuestExtra, setNewGuestExtra] = React.useState("0")
  const [newGuestTier, setNewGuestTier] = React.useState<"recurring" | "one-time">("one-time")
  const [newGuestDate, setNewGuestDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [showAddGuestDatePicker, setShowAddGuestDatePicker] = React.useState(false)

  const pendingGuestsForList = [...recurringGuests, ...oneTimeGuests]

  React.useEffect(() => {
    setGuestListPage(0)
  }, [guestListTab, guestListSearch, guestListTierFilter])

  React.useEffect(() => {
    if (!showGuestList) setShowGuestListTierDropdown(false)
  }, [showGuestList])

  const closingBadgePulse = useSharedValue(0)
  React.useEffect(() => {
    closingBadgePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    )
  }, [closingBadgePulse])
  const closingBadgeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(closingBadgePulse.value, [0, 1], [0.45, 1]),
  }))

  function handleCheckIn(guest: ExpectingGuest) {
    if (guest.tier === "recurring") {
      setRecurringGuests((prev) => prev.filter((g) => g.id !== guest.id))
    } else {
      setOneTimeGuests((prev) => prev.filter((g) => g.id !== guest.id))
    }
    setArrivedGuests((prev) => [...prev, guest])
    setGuestListTab("arrived")
  }

  function handleAddGuest() {
    const name = newGuestName.trim()
    const table = parseInt(newGuestTable, 10)
    const extraGuests = Math.max(0, parseInt(newGuestExtra, 10) || 0)
    if (!name || Number.isNaN(table) || table < 1) return
    const initials = name
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    const id = `g-${Date.now()}`
    const guest: ExpectingGuest = {
      id,
      initials: initials || "?",
      name,
      table,
      extraGuests,
      tier: newGuestTier,
      dateAdded: newGuestDate,
      ...(newGuestTier === "one-time" ? { listId: newGuestDate } : {}),
    }
    if (newGuestTier === "recurring") {
      setRecurringGuests((prev) => [...prev, guest])
    } else {
      setOneTimeGuests((prev) => [...prev, guest])
    }
    setNewGuestName("")
    setNewGuestTable("")
    setNewGuestExtra("0")
    setNewGuestDate(new Date().toISOString().slice(0, 10))
    setShowAddGuestSheet(false)
  }

  function handleAssignStaff(staffName: string) {
    if (!selectedTable) return
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTable.id ? { ...t, assignedTo: staffName } : t))
    )
    setSelectedTable((prev) => (prev ? { ...prev, assignedTo: staffName } : prev))
    setShowAssignStaffDialog(false)
  }

  function handleUnassignStaff() {
    if (!selectedTable) return
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTable.id ? { ...t, assignedTo: undefined } : t))
    )
    setSelectedTable((prev) => (prev ? { ...prev, assignedTo: undefined } : prev))
  }

  function handleTableGuestsChange(tableId: string, delta: number) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, currentGuests: Math.max(0, t.currentGuests + delta) } : t
      )
    )
    if (selectedTable?.id === tableId) {
      setSelectedTable((prev) =>
        prev ? { ...prev, currentGuests: Math.max(0, prev.currentGuests + delta) } : null
      )
    }
  }

  function handleUpdateTable(tableId: string, updates: Partial<Table>) {
    const synced = { ...updates }
    if (updates.promoter !== undefined) synced.primaryStaff = updates.promoter || undefined
    if (updates.server !== undefined) synced.backupStaff = updates.server || undefined
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...synced } : t)))
    if (selectedTable?.id === tableId) {
      setSelectedTable((prev) => (prev ? { ...prev, ...synced } : null))
    }
  }

  const editable = canEditMapTables(userRole)
  const effectiveOnUpdateTable = editable ? handleUpdateTable : undefined
  const effectiveOnEditTable = editable ? () => setShowEditTableSheet(true) : undefined

  function setSegment(next: TopSegment) {
    setViewMode(next)
  }

  const occupiedCount = tables.filter((t) => t.status === "occupied").length
  const totalTables = tables.length
  const revenue = tables.reduce((sum, t) => sum + (t.spend || 0), 0)

  const filteredTables =
    tableFilter === "all" ? tables : tables.filter((t) => t.status === tableFilter)

  React.useEffect(() => {
    mainBarTranslateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 800 }),
        withTiming(4, { duration: 800 })
      ),
      -1,
      true
    )
  }, [])

  const mainBarAnimatedStyle = useAnimatedStyle(() => {
    "worklet"
    return { transform: [{ translateY: mainBarTranslateY.value }] }
  }, [])

  return (
    <View style={{ flex: 1 }}>
      {/* <Image 
        source={images.bgMap} 
        style={StyleSheet.absoluteFillObject} 
        contentFit="cover"
        cachePolicy="memory"
        priority="high"
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.8)" }]} /> */}

      <View style={[styles.controls, { borderBottomColor: theme.colors.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "stretch", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            {/* Map / List switch */}
            <View style={[styles.segmentWrap, { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.22)", flex: 1 }]}>
              <SegmentBtn
                isActive={viewMode === "map"}
                label="Map"
                iconVariant="map"
                onPress={() => setSegment("map")}
              />
              <SegmentBtn
                isActive={viewMode === "list"}
                label="List"
                iconVariant="list"
                onPress={() => setSegment("list")}
              />
            </View>
            {!guestMode ? (
              <>
                <HapticPressable
                  onPress={() => setIsVoiceActive((v) => !v)}
                  neonBorder
                  borderColor={isVoiceActive ? `${theme.colors.neonCyan}AA` : `${theme.colors.border}AA`}
                  accessibilityRole="button"
                  accessibilityLabel="Voice commands"
                  style={[
                    styles.micBtn,
                    {
                      backgroundColor: isVoiceActive
                        ? `${theme.colors.neonCyan}22`
                        : "rgba(0,0,0,0.18)",
                    },
                  ]}
                >
                  <Mic size={18} color={isVoiceActive ? theme.colors.neonCyan : theme.colors.mutedForeground} />
                </HapticPressable>
              </>
            ) : null}
          </View>
          {!guestMode ? (
            <HapticPressable
              onPress={() => setShowGuestList(true)}
              style={[styles.guestListBtn, { borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}18` }]}
              accessibilityLabel="Open guest list"
              accessibilityRole="button"
            >
              <Users size={14} color={theme.colors.neonCyan} />
              <Text style={[styles.guestListBtnText, { color: theme.colors.neonCyan }]}>Guest List</Text>
            </HapticPressable>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <MetricPill
            label={guestMode ? "Tables:" : "Occupied:"}
            value={guestMode ? `${totalTables}` : `${occupiedCount}/${totalTables}`}
            tone="pink"
            icon={<Users size={14} color={theme.colors.neonPink} />}
          />
          {!guestMode ? (
            <>
              <MetricPill
                label="Revenue:"
                value={formatNumber(revenue, { prefix: "$" })}
                tone="green"
                icon={<DollarSign size={14} color={theme.colors.neonGreen} />}
              />
              <Animated.View style={[styles.closingBadge, closingBadgeAnimatedStyle]}>
                <Text style={styles.closingBadgeText}>CLOSING 19m</Text>
              </Animated.View>
            </>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <ViewAllChip isActive={tableFilter === "all"} onPress={() => setTableFilter("all")} />
          {(["open", "occupied", "booked", "pending"] as const).map((status) => {
            const isActive = tableFilter === status
            return (
              <StatusChip
                key={status}
                status={status}
                isActive={isActive}
                onPress={() => setTableFilter((prev) => (prev === status ? "all" : status))}
              />
            )
          })}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {viewMode === "map" ? (
          <Animated.View
            key="map"
            entering={FadeIn.duration(200).springify().damping(20).stiffness(300)}
            exiting={FadeOut.duration(150)}
            style={{ flex: 1 }}
          >
            <MapView
              tables={filteredTables}
              selectedTable={selectedTable}
              onSelectTable={(t) => {
                setPathTarget(t)
                setSelectedTable(t)
              }}
              onTableGuestsChange={guestMode ? undefined : handleTableGuestsChange}
              showPath={showPath}
              pathTarget={pathTarget}
              showTableGirl={!guestMode}
            />
          </Animated.View>
        ) : (
          <Animated.View
            key="list"
            entering={FadeIn.duration(200).springify().damping(20).stiffness(300)}
            exiting={FadeOut.duration(150)}
            style={{ flex: 1 }}
          >
            <ListView
              tables={filteredTables}
              selectedTable={selectedTable}
              onSelectTable={(t) => setSelectedTable(t)}
              onUpdateTable={effectiveOnUpdateTable}
              guestMode={guestMode}
              userRole={userRole}
              canEditTableGirl={canEditTableGirl(userRole)}
            />
          </Animated.View>
        )}
      </View>

      <ModalCard open={isVoiceActive} onClose={() => setIsVoiceActive(false)}>
        <VoiceCommandOverlay onClose={() => setIsVoiceActive(false)} />
      </ModalCard>

      <ModalSheet open={showGuestList} onClose={() => setShowGuestList(false)} maxHeightPct={1} title="Guest List">
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, marginBottom: 12 }}>
            <HapticPressable
              onPress={() => setShowAddGuestSheet(true)}
              style={[styles.guestListBtn, { borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}18` }]}
              accessibilityLabel="Add guest"
            >
              <UserPlus size={16} color={theme.colors.neonCyan} />
              <Text style={[styles.guestListBtnText, { color: theme.colors.neonCyan }]}>Add guest</Text>
            </HapticPressable>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                minHeight: 44,
                paddingLeft: 14,
                paddingRight: 14,
                borderWidth: 1,
                borderRadius: 16,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.input,
              }}
            >
              <Search size={18} color={theme.colors.mutedForeground} />
              <Input
                placeholder="Search"
                value={guestListSearch}
                onChangeText={setGuestListSearch}
                containerStyle={{ flex: 1, minHeight: 40, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0 }}
                style={{ color: theme.colors.foreground, fontFamily: "Inter_500Medium", fontSize: 15 }}
                placeholderTextColor={theme.colors.mutedForeground}
              />
            </View>
          </View>
          <View style={[styles.guestListTabs, { borderColor: theme.colors.border, backgroundColor: theme.colors.muted }]}>
            <HapticPressable
              onPress={() => setGuestListTab("pending")}
              style={[
                styles.guestListTab,
                guestListTab === "pending" && {
                  backgroundColor: "#FFEB3B18",
                  borderBottomWidth: 2,
                  borderBottomColor: "#FFEB3B",
                },
              ]}
            >
              <Text
                style={[
                  styles.guestListTabText,
                  { color: guestListTab === "pending" ? "#FFEB3B" : theme.colors.mutedForeground },
                ]}
              >
                PENDING
              </Text>
            </HapticPressable>
            <HapticPressable
              onPress={() => setGuestListTab("arrived")}
              style={[
                styles.guestListTab,
                guestListTab === "arrived" && {
                  backgroundColor: `${theme.colors.neonGreen}18`,
                  borderBottomWidth: 2,
                  borderBottomColor: theme.colors.neonGreen,
                },
              ]}
            >
              <Text
                style={[
                  styles.guestListTabText,
                  { color: guestListTab === "arrived" ? theme.colors.neonGreen : theme.colors.mutedForeground },
                ]}
              >
                ARRIVED
              </Text>
            </HapticPressable>
          </View>
          {(() => {
            const q = guestListSearch.trim().toLowerCase()
            const match = (g: ExpectingGuest) =>
              !q ||
              g.name.toLowerCase().includes(q) ||
              g.initials.toLowerCase().includes(q) ||
              String(g.table).includes(q)
            const filteredRecurring = recurringGuests.filter(match)
            const filteredOneTime = oneTimeGuests.filter(match)
            const filteredPending = [...filteredRecurring, ...filteredOneTime]
            const filteredArrived = arrivedGuests.filter(match)
            const combinedByTier =
              guestListTab === "pending"
                ? guestListTierFilter === "recurring"
                  ? filteredRecurring
                  : guestListTierFilter === "one-time"
                    ? filteredOneTime
                    : filteredPending
                : guestListTierFilter === "recurring"
                  ? filteredArrived.filter((g) => g.tier === "recurring")
                  : guestListTierFilter === "one-time"
                    ? filteredArrived.filter((g) => g.tier === "one-time")
                    : filteredArrived
            const combined = combinedByTier
            const totalPages = Math.max(1, Math.ceil(combined.length / GUEST_LIST_PAGE_SIZE))
            const currentPage = Math.min(guestListPage, totalPages - 1)
            const paginatedList = combined.slice(
              currentPage * GUEST_LIST_PAGE_SIZE,
              (currentPage + 1) * GUEST_LIST_PAGE_SIZE
            )
            const sectionTitle = guestListTab === "pending" ? "PENDING GUESTS" : "ARRIVED GUESTS"
            const sectionColor = guestListTab === "pending" ? theme.colors.neonCyan : theme.colors.neonGreen
            const emptyMessage =
              guestListTab === "pending"
                ? (pendingGuestsForList.length === 0 ? "No pending guests." : "No guests match your search.")
                : (arrivedGuests.length === 0 ? "No guests arrived yet." : "No guests match your search.")
            return (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: sectionColor, fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.5 }}>
                      {sectionTitle}
                    </Text>
                    <HapticPressable
                      onPress={() => setShowGuestListTierDropdown((v) => !v)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.muted,
                      }}
                      accessibilityLabel={`Guest type: ${guestListTierFilter === "all" ? "All" : guestListTierFilter === "recurring" ? "Recurring" : "One-time"}`}
                      accessibilityRole="button"
                    >
                      <Text style={{ color: theme.colors.foreground, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
                        {guestListTierFilter === "all" ? "All" : guestListTierFilter === "recurring" ? "Recurring" : "One-time"}
                      </Text>
                      <ChevronDown size={14} color={theme.colors.foreground} />
                    </HapticPressable>
                  </View>
                  {showGuestListTierDropdown && (
                    <View
                      style={{
                        marginBottom: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.card,
                        overflow: "hidden",
                      }}
                    >
                      {(["all", "recurring", "one-time"] as const).map((tier) => (
                        <HapticPressable
                          key={tier}
                          onPress={() => {
                            setGuestListTierFilter(tier)
                            setShowGuestListTierDropdown(false)
                          }}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderBottomWidth: tier !== "one-time" ? 1 : 0,
                            borderBottomColor: theme.colors.border,
                          }}
                        >
                          <Text
                            style={{
                              color: guestListTierFilter === tier ? theme.colors.neonCyan : theme.colors.foreground,
                              fontSize: 13,
                              fontFamily: guestListTierFilter === tier ? "Inter_600SemiBold" : "Inter_500Medium",
                            }}
                          >
                            {tier === "all" ? "All" : tier === "recurring" ? "Recurring" : "One-time"}
                          </Text>
                        </HapticPressable>
                      ))}
                    </View>
                  )}
                  {combined.length === 0 ? (
                    <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, textAlign: "center", marginTop: 16 }}>
                      {emptyMessage}
                    </Text>
                  ) : (
                  <>
                  {paginatedList.map((guest) => (
                    <View
                      key={guest.id}
                      style={[styles.guestListItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                    >
                      <View style={[styles.guestListAvatar, { backgroundColor: theme.colors.muted }]}>
                        {guest.avatarKey && avatars[guest.avatarKey] ? (
                          <Image source={avatars[guest.avatarKey]} style={styles.guestListAvatarImage} resizeMode="cover" />
                        ) : (
                          <Text style={[styles.guestListInitials, { color: theme.colors.foreground }]}>{guest.initials}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12, justifyContent: "center" }}>
                        <Text style={[styles.guestListName, { color: theme.colors.foreground }]}>{guest.name}</Text>
                        <Text style={[styles.guestListDetails, { color: theme.colors.mutedForeground }]}>
                          Table {guest.table} • {guest.extraGuests > 0 ? `+${guest.extraGuests} Guests` : "Solo"}
                        </Text>
                        <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                          {guest.tier === "recurring" ? "Recurring" : "One-time"} • {guest.tier === "one-time" && (guest.listId ?? guest.dateAdded) ? `Date: ${formatGuestDateDisplay(guest.listId ?? guest.dateAdded ?? "")}` : guest.dateAdded ? `Added: ${formatGuestDateDisplay(guest.dateAdded)}` : "Always"}
                        </Text>
                      </View>
                      {guestListTab === "pending" ? (
                        <HapticPressable
                          onPress={() => handleCheckIn(guest)}
                          style={[styles.checkInBtn, { backgroundColor: "#047857", borderColor: "rgba(255,255,255,0.4)" }]}
                          accessibilityLabel={`Check in ${guest.name}`}
                        >
                          <Text style={styles.checkInBtnText}>CHECK IN</Text>
                          <CheckCircle size={14} color="#fff" />
                        </HapticPressable>
                      ) : (
                        <View style={[styles.checkInBtn, { backgroundColor: `${theme.colors.neonGreen}22`, borderColor: theme.colors.neonGreen }]}>
                          <CheckCircle size={14} color={theme.colors.neonGreen} />
                          <Text style={[styles.checkInBtnText, { color: theme.colors.neonGreen }]}>ARRIVED</Text>
                        </View>
                      )}
                    </View>
                  ))}
                {totalPages > 1 && (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16, paddingVertical: 8 }}>
                    <HapticPressable
                      onPress={() => setGuestListPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
                      accessibilityLabel="Previous page"
                      accessibilityRole="button"
                    >
                      <ChevronLeft size={24} color={theme.colors.foreground} />
                    </HapticPressable>
                    <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                      Page {currentPage + 1} of {totalPages}
                    </Text>
                    <HapticPressable
                      onPress={() => setGuestListPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      style={{ opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}
                      accessibilityLabel="Next page"
                      accessibilityRole="button"
                    >
                      <ChevronRight size={24} color={theme.colors.foreground} />
                    </HapticPressable>
                  </View>
                )}
              </>
                  )}
                </View>
          </ScrollView>
            )
          })()}
        </View>
      </ModalSheet>

      <ModalSheet open={showAddGuestSheet} onClose={() => setShowAddGuestSheet(false)} maxHeightPct={1} title="Add guest">
        <ScrollView
          style={{ maxHeight: "100%" }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginBottom: 12 }}>
            Add as recurring (always on list) or one-time (tonight&apos;s table for this list).
          </Text>
          <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Guest tier</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <HapticPressable
              onPress={() => setNewGuestTier("recurring")}
              style={[
                { flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
                newGuestTier === "recurring"
                  ? { borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}22` }
                  : { borderColor: theme.colors.border, backgroundColor: theme.colors.muted },
              ]}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: newGuestTier === "recurring" ? theme.colors.neonCyan : theme.colors.mutedForeground }}>
                Recurring (always on list)
              </Text>
            </HapticPressable>
            <HapticPressable
              onPress={() => setNewGuestTier("one-time")}
              style={[
                { flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
                newGuestTier === "one-time"
                  ? { borderColor: theme.colors.neonPink, backgroundColor: `${theme.colors.neonPink}22` }
                  : { borderColor: theme.colors.border, backgroundColor: theme.colors.muted },
              ]}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: newGuestTier === "one-time" ? theme.colors.neonPink : theme.colors.mutedForeground }}>
                One-time (tonight&apos;s table)
              </Text>
            </HapticPressable>
          </View>
          <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Date</Text>
          <Pressable
            onPress={() => {
              setShowAddGuestDatePicker(true)
            }}
            style={[styles.editInput, { borderColor: theme.colors.border, marginBottom: 12, justifyContent: "center" }]}
          >
            <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_500Medium", fontSize: 15 }}>
              {formatGuestDateDisplay(newGuestDate)}
            </Text>
          </Pressable>
          {showAddGuestDatePicker ? (
            Platform.OS === "android" ? (
              <Modal visible transparent animationType="fade">
                <Pressable style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowAddGuestDatePicker(false)}>
                  <View style={{ marginHorizontal: 24 }}>
                    <DateTimePicker
                      value={parseDateOnly(newGuestDate)}
                      mode="date"
                      display="default"
                      onChange={(ev, date) => {
                        if (ev.type === "set" && date) setNewGuestDate(formatDateOnly(date))
                        setShowAddGuestDatePicker(false)
                      }}
                    />
                  </View>
                </Pressable>
              </Modal>
            ) : (
              <DateTimePicker
                value={parseDateOnly(newGuestDate)}
                mode="date"
                display="spinner"
                onChange={(ev, date) => {
                  if (ev.type === "set" && date) setNewGuestDate(formatDateOnly(date))
                  setShowAddGuestDatePicker(false)
                }}
              />
            )
          ) : null}
          <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Name</Text>
          <Input
            value={newGuestName}
            onChangeText={setNewGuestName}
            placeholder="Guest name"
            containerStyle={[styles.editInput, { borderColor: theme.colors.border, marginBottom: 12 }]}
            style={{ color: theme.colors.foreground }}
            placeholderTextColor={theme.colors.mutedForeground}
          />
          <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Table number</Text>
          <Input
            value={newGuestTable}
            onChangeText={setNewGuestTable}
            placeholder="e.g. 5"
            keyboardType="number-pad"
            containerStyle={[styles.editInput, { borderColor: theme.colors.border, marginBottom: 12 }]}
            style={{ color: theme.colors.foreground }}
            placeholderTextColor={theme.colors.mutedForeground}
          />
          <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Extra guests</Text>
          <Input
            value={newGuestExtra}
            onChangeText={setNewGuestExtra}
            placeholder="0"
            keyboardType="number-pad"
            containerStyle={[styles.editInput, { borderColor: theme.colors.border, marginBottom: 20 }]}
            style={{ color: theme.colors.foreground }}
            placeholderTextColor={theme.colors.mutedForeground}
          />
          <Button variant="solid" tone="cyan" onPress={handleAddGuest} style={{ marginBottom: 8 }}>
            <View style={styles.rowCenter}>
              <UserPlus size={18} color={theme.colors.neonCyan} />
              <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold" }}>Add guest</Text>
            </View>
          </Button>
        </ScrollView>
      </ModalSheet>

      <ModalSheet open={showAssignStaffDialog} onClose={() => setShowAssignStaffDialog(false)} maxHeightPct={1}>
        <AssignStaffDialog
          currentAssigned={selectedTable?.assignedTo}
          onSelectStaff={handleAssignStaff}
        />
      </ModalSheet>

      {!guestMode && selectedTable ? (
        <ModalSheet
          open={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          maxHeightPct={1}
          showHeader={false}
        >
          <TableDetailSheet
            table={tables.find((t) => t.id === selectedTable.id) ?? selectedTable}
            onClose={() => setSelectedTable(null)}
            onUnassignStaff={handleUnassignStaff}
            onGuestsChange={handleTableGuestsChange}
            onEditTable={effectiveOnEditTable}
            onUpdateTable={effectiveOnUpdateTable}
            canEditTableGirl={canEditTableGirl(userRole)}
            onAddBottle={
              effectiveOnUpdateTable
                ? (itemsText, pendingAmount) => {
                    const t = tables.find((x) => x.id === selectedTable.id) ?? selectedTable
                    const prev = t.itemsSummary ?? ""
                    const next = prev ? `${prev}, ${itemsText}` : itemsText
                    const updates: Partial<Table> = { itemsSummary: next }
                    if (pendingAmount != null) updates.pendingSpend = (t.pendingSpend ?? 0) + pendingAmount
                    handleUpdateTable(selectedTable.id, updates)
                  }
                : undefined
            }
          />
        </ModalSheet>
      ) : null}

      {!guestMode && selectedTable && showEditTableSheet ? (
        <ModalSheet
          open={showEditTableSheet}
          onClose={() => setShowEditTableSheet(false)}
          maxHeightPct={1}
        >
          <EditTableSheet
            table={tables.find((t) => t.id === selectedTable.id) ?? selectedTable}
            onSave={(updates) => {
              handleUpdateTable(selectedTable.id, updates)
              setShowEditTableSheet(false)
            }}
            onClose={() => setShowEditTableSheet(false)}
            canEditTableGirl={canEditTableGirl(userRole)}
          />
        </ModalSheet>
      ) : null}

      {guestMode && selectedTable ? (
        <ModalSheet
          open={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          maxHeightPct={0.5}
          showHeader={false}
        >
          <TableInfoSheetGuest
            table={tables.find((t) => t.id === selectedTable.id) ?? selectedTable}
            onClose={() => setSelectedTable(null)}
          />
        </ModalSheet>
      ) : null}

      {!guestMode ? (
        <>
          {/* Main Bar & Specials – tap to open menu; tap ▼ or long-press to hide; when hidden tap bar to show */}
          <View style={styles.mainBarButtonWrap} pointerEvents="box-none">
            <Animated.View style={mainBarAnimatedStyle}>
              {mainBarSpecialsVisible ? (
                <View
                  style={[
                    styles.mainBarButton,
                    {
                      borderColor: theme.colors.neonOrange,
                      backgroundColor: theme.colors.card,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <HapticPressable
                    onPress={() => setShowBarSpecialsSheet(true)}
                    style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                    accessibilityRole="button"
                    accessibilityLabel="Open Main Bar and Specials"
                  >
                    <Wine size={22} color={theme.colors.foreground} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.mainBarTitle, { color: theme.colors.neonOrange }]}>
                        MAIN BAR & SPECIALS
                      </Text>
                      <Text style={[styles.mainBarSubtitle, { color: theme.colors.neonCyan }]}>
                        • 3 Deals Active
                      </Text>
                    </View>
                  </HapticPressable>
                  <HapticPressable
                    onPress={() => setMainBarSpecialsVisible(false)}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    style={{ padding: 12, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
                    accessibilityRole="button"
                    accessibilityLabel="Hide Main Bar and Specials"
                  >
                    <ChevronDown size={20} color={theme.colors.mutedForeground} />
                  </HapticPressable>
                </View>
              ) : (
                <View style={{ alignSelf: "flex-end" }}>
                  <HapticPressable
                    onPress={() => setMainBarSpecialsVisible(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    neonBorder
                    borderColor={`${theme.colors.neonOrange}AA`}
                    style={[
                      styles.mainBarButton,
                      {
                        borderColor: theme.colors.neonOrange,
                        backgroundColor: theme.colors.card,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 44,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Show Main Bar and Specials"
                  >
                    <Wine size={22} color={theme.colors.neonOrange} />
                  </HapticPressable>
                </View>
              )}
            </Animated.View>
          </View>

          <ModalSheet
            open={showBarSpecialsSheet}
            onClose={() => setShowBarSpecialsSheet(false)}
            maxHeightPct={1}
            showHeader={false}
          >
            <MainBarSpecialsSheet onClose={() => setShowBarSpecialsSheet(false)} />
          </ModalSheet>
        </>
      ) : null}
    </View>
  )
}

// Reanimated online indicator for 60fps pulse animation
function OnlineIndicator({ color }: { color: string }) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.8)

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.3, { damping: 6, stiffness: 80, mass: 0.8 }),
        withSpring(1, { damping: 6, stiffness: 80, mass: 0.8 })
      ),
      -1,
      false
    )
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 }), withTiming(0.8, { duration: 500 })),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    "worklet"
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  }, [])

  return (
    <Animated.View
      style={[
        { width: 10, height: 10, borderRadius: 5, backgroundColor: color },
        animatedStyle,
      ]}
    />
  )
}

// Reanimated audio bar for 60fps visualization
function AudioBar({ index, targetHeight, theme, color }: { index: number; targetHeight: number; theme: ReturnType<typeof useTheme>["theme"]; color: string }) {
  const height = useSharedValue(10)

  React.useEffect(() => {
    const delay = index * 50
    const timeoutId = setTimeout(() => {
      height.value = withRepeat(
        withSequence(
          withSpring(targetHeight, { damping: 8, stiffness: 100, mass: 0.5 }),
          withSpring(10, { damping: 8, stiffness: 100, mass: 0.5 })
        ),
        -1,
        false
      )
    }, delay)
    return () => clearTimeout(timeoutId)
  }, [index, targetHeight])

  const animatedStyle = useAnimatedStyle(() => {
    "worklet"
    return {
      height: height.value,
    }
  }, [])

  return (
    <Animated.View
      style={[
        {
          width: 6,
          borderRadius: 999,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  )
}

const SEGMENT_TEXT_ICON_COLOR = "#ffffff"
/** Inactive segment background */
const SEGMENT_INACTIVE_BG = "#050505"

function SegmentBtn({
  isActive,
  label,
  iconVariant,
  onPress,
}: {
  isActive: boolean
  label: string
  iconVariant: "map" | "list"
  onPress: () => void
}) {
  const { theme } = useTheme()
  const icon =
    iconVariant === "map" ? (
      <Grid3X3 size={14} color={SEGMENT_TEXT_ICON_COLOR} key="map" />
    ) : (
      <List size={14} color={SEGMENT_TEXT_ICON_COLOR} key="list" />
    )
  const segmentBg = isActive ? theme.colors.neonPink : SEGMENT_INACTIVE_BG
  const segmentBorder = isActive
    ? { borderColor: `${theme.colors.neonPink}AA`, borderWidth: 1.5 }
    : { borderColor: "transparent", borderWidth: 0 }
  return (
    <Pressable
      onPress={onPress}
      style={styles.segmentBtn}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.segmentActive, { backgroundColor: segmentBg }, segmentBorder]}>
        <View style={[styles.segmentInner, { opacity: 1 }]}>
          {icon}
          <Text style={[styles.segmentText, { color: SEGMENT_TEXT_ICON_COLOR }]}>{label}</Text>
        </View>
      </View>
    </Pressable>
  )
}

function MetricPill({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: string
  tone: "pink" | "green"
  icon: React.ReactNode
}) {
  const { theme } = useTheme()
  const toneColor = tone === "pink" ? theme.colors.neonPink : theme.colors.neonGreen
  return (
    <View style={[styles.metricPill, { backgroundColor: "rgba(0,0,0,0.24)" }]}>
      {icon}
      <Text style={[styles.metricLabel, { color: "rgba(255,255,255,0.55)" }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: toneColor }]}>{value}</Text>
    </View>
  )
}

function ViewAllChip({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
  const { theme } = useTheme()
  const color = theme.colors.neonCyan
  return (
    <HapticPressable
      onPress={onPress}
      neonBorder
      borderColor={`${color}CC`}
      accessibilityRole="button"
      accessibilityLabel="View all tables"
      style={[
        styles.statusChip,
        {
          borderWidth: 1,
          backgroundColor: isActive ? "rgba(0, 200, 220, 0.35)" : "transparent",
        },
      ]}
    >
      <Text style={{ color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
        All
      </Text>
    </HapticPressable>
  )
}

function StatusChip({
  status,
  isActive,
  onPress,
}: {
  status: TableStatus
  isActive: boolean
  onPress: () => void
}) {
  const { theme } = useTheme()
  const color = getStatusColor(theme, status)
  return (
    <HapticPressable
      onPress={onPress}
      neonBorder
      borderColor={`${color}CC`}
      accessibilityRole="button"
      accessibilityLabel={`Filter ${status}`}
      style={[
        styles.statusChip,
        {
          borderWidth: 1,
          backgroundColor: isActive ? `${color}44` : "transparent",
        },
      ]}
    >
      <Text style={{ color, fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "capitalize" }}>
        {status}
      </Text>
    </HapticPressable>
  )
}

function StatChip({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: string
  tone: "pink" | "cyan" | "green" | "orange"
  icon: React.ReactNode
}) {
  const { theme } = useTheme()
  const toneColor =
    tone === "pink"
      ? theme.colors.neonPink
      : tone === "cyan"
        ? theme.colors.neonCyan
        : tone === "green"
          ? theme.colors.neonGreen
          : theme.colors.neonOrange

  return (
    <View
      style={[
        styles.chip,
        { borderColor: `${toneColor}55`, backgroundColor: `${toneColor}1a` },
      ]}
    >
      {icon}
      <Text style={{ color: theme.colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
        {label}:
      </Text>
      <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
        {value}
      </Text>
    </View>
  )
}

// Occupied table: yellow border, dark card, name, amounts, +/- occupancy, items, P/BG (first image)
const OCCUPIED_YELLOW = "#FFD700"
const OCCUPIED_BG = "#1A1A2E"
const OPEN_BORDER = "#444455"
const OPEN_BG = "#1A1A1A"
const PRIMARY_TEAL = "#00FFFF"
const BACKUP_PURPLE = "#BC13FE"

// Optimized table marker component using Reanimated for 60fps
// Renders occupied (first image) or open (third image) style
function TableMarker({
  table,
  isSelected,
  onPress,
  onGuestsChange,
  theme,
  index,
  showTableGirl = true,
}: {
  table: Table
  isSelected: boolean
  onPress: (t: Table) => void
  onGuestsChange?: (tableId: string, delta: number) => void
  theme: ReturnType<typeof useTheme>["theme"]
  index: number
  /** All pro roles see bottle girl on map (visibility only; edit is role-gated). */
  showTableGirl?: boolean
}) {
  const tableScale = useSharedValue(1)
  const tableOpacity = useSharedValue(0)
  const hasAnimated = useSharedValue(false)

  React.useEffect(() => {
    const delay = index * 30
    const timeoutId = setTimeout(() => {
      if (!hasAnimated.value) {
        tableOpacity.value = withSpring(1, { damping: 15, stiffness: 200, mass: 0.9 })
        hasAnimated.value = true
      }
    }, delay)
    return () => clearTimeout(timeoutId)
  }, [index])

  React.useEffect(() => {
    tableScale.value = withSpring(isSelected ? 1.05 : 1, { damping: 12, stiffness: 300, mass: 0.6 })
  }, [isSelected])

  const tableAnimatedStyle = useAnimatedStyle(() => {
    "worklet"
    return { transform: [{ scale: tableScale.value }], opacity: tableOpacity.value }
  }, [])

  const statusColor = getStatusColor(theme, table.status)
  const isCardStyle = table.status === "occupied" || table.status === "booked" || table.status === "pending"

  const onTablePress = React.useCallback(() => {
    onPress(table)
  }, [onPress, table])

  const tapTable = React.useMemo(
    () =>
      Gesture.Tap()
        .onEnd(() => {
          "worklet"
          runOnJS(onTablePress)()
        }),
    [onTablePress]
  )

  const onDecrement = React.useCallback(() => {
    if (table.currentGuests > 0) onGuestsChange?.(table.id, -1)
  }, [table.id, table.currentGuests, onGuestsChange])
  const onIncrement = React.useCallback(() => {
    onGuestsChange?.(table.id, 1)
  }, [table.id, onGuestsChange])

  const tapDecrement = React.useMemo(
    () =>
      Gesture.Tap()
        .onEnd(() => {
          "worklet"
          runOnJS(onDecrement)()
        }),
    [onDecrement]
  )
  const tapIncrement = React.useMemo(
    () =>
      Gesture.Tap()
        .onEnd(() => {
          "worklet"
          runOnJS(onIncrement)()
        }),
    [onIncrement]
  )

  // DJ booth: minimal marker at far right of dance floor (Disc Jockey – music/booth)
  if (table.isDjBooth) {
    return (
      <GestureDetector gesture={tapTable}>
        <Animated.View
          style={[
            styles.tableWrapDj,
            { left: `${table.x}%` as any, top: `${table.y}%` as any },
            tableAnimatedStyle,
          ]}
        >
          <View
            style={[
              styles.tableBtnDj,
              {
                borderColor: statusColor,
                borderWidth: 1.5,
                backgroundColor: OCCUPIED_BG,
              },
            ]}
          >
            <Text style={[styles.tableBtnDjText, { color: statusColor }]}>DJ</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    )
  }

  if (isCardStyle) {
    return (
      <GestureDetector gesture={tapTable}>
        <Animated.View
          style={[
            styles.tableWrapOccupied,
            { left: `${table.x}%` as any, top: `${table.y}%` as any },
            tableAnimatedStyle,
          ]}
        >
          <View
            style={[
              styles.tableBtnOccupied,
            {
              borderWidth: isSelected ? 2.5 : 2,
              borderColor: isSelected ? `${statusColor}EE` : `${statusColor}AA`,
              backgroundColor: OCCUPIED_BG,
            },
          ]}
        >
          {/* Top: table number (left) + quantity selector (right) */}
          <View style={styles.occupiedHeader}>
            <Text style={[styles.occupiedTableNum, { color: statusColor }]}>
              {table.isDjBooth ? "DJ" : String(table.number).padStart(2, "0")}
            </Text>
            <View
              style={styles.occupancyRow}
              accessibilityRole="adjustable"
              accessibilityLabel={`Guests ${table.currentGuests} of ${table.capacity}`}
              accessibilityValue={{ min: 0, max: table.capacity, now: table.currentGuests }}
            >
              <GestureDetector gesture={tapDecrement}>
                <View
                  style={[
                    styles.occupancyBtn,
                    table.currentGuests <= 0 && styles.occupancyBtnDisabled,
                  ]}
                  pointerEvents={table.currentGuests <= 0 ? "none" : "auto"}
                >
                  <Text style={[styles.occupancyBtnText, table.currentGuests <= 0 && { opacity: 0.4 }]}>−</Text>
                </View>
              </GestureDetector>
              <Text
                style={[
                  styles.occupancyText,
                  table.currentGuests > table.capacity && { color: "#FF4444" },
                ]}
              >
                {table.currentGuests}/{table.capacity}
              </Text>
              <GestureDetector gesture={tapIncrement}>
                <View style={styles.occupancyBtn}>
                  <Text style={styles.occupancyBtnText}>+</Text>
                </View>
              </GestureDetector>
            </View>
          </View>
          {/* Middle: main guest avatar (with VIP badge) + name + spend */}
          <View style={styles.occupiedGuestRow}>
            <View style={styles.occupiedGuestAvatarWrap}>
              <NeonAvatar
                source={table.guestAvatarKey ? avatars[table.guestAvatarKey] : avatars.man3}
                fallback={(table.guestName ?? "T").slice(0, 2)}
                size="lg"
                glow="orange"
                showRing
              />
              {(table.isVip ?? (table.spend ?? 0) >= 1000) ? (
                <View style={styles.vipBadge}>
                  <Text style={styles.vipBadgeText}>VIP</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.occupiedGuestInfo}>
              <Text style={styles.occupiedName} numberOfLines={1}>
                {table.guestName ?? (table.isDjBooth ? "DJ Booth" : `Table ${table.number}`)}
              </Text>
              <View style={styles.occupiedAmountRow}>
                <Text style={[styles.occupiedAmount, { color: statusColor }]}>
                  {formatNumber(table.spend ?? 0, { prefix: "$" })}
                </Text>
                <Text style={styles.occupiedSpendLabel}>SPEND</Text>
              </View>
              {(table.pendingSpend ?? 0) > 0 && (
                <Text style={styles.occupiedPending}>
                  Pend: {formatNumber(table.pendingSpend!, { prefix: "$" })}
                </Text>
              )}
            </View>
          </View>
          {/* Bottom: promoter + bottle girl with avatars */}
          <View style={styles.occupiedDivider} />
          <View style={styles.occupiedFooter}>
            {table.primaryStaff ? (
              <View style={styles.occupiedStaffCell}>
                <Text style={[styles.occupiedStaffRoleLabel, { color: PRIMARY_TEAL }]}>PROMOTER</Text>
                <NeonAvatar
                  source={table.promoterAvatarKey ? avatars[table.promoterAvatarKey] : avatars.man2}
                  fallback={table.primaryStaff.slice(0, 2)}
                  size="sm"
                  glow="cyan"
                  showRing
                />
                <Text style={styles.occupiedStaffName} numberOfLines={1}>{table.primaryStaff}</Text>
              </View>
            ) : null}
            {showTableGirl && table.backupStaff ? (
              <View style={styles.occupiedStaffCell}>
                <Text style={[styles.occupiedStaffRoleLabel, { color: BACKUP_PURPLE }]}>BOTTLE GIRL</Text>
                <NeonAvatar
                  source={table.bottleGirlAvatarKey ? avatars[table.bottleGirlAvatarKey] : avatars.woman1}
                  fallback={table.backupStaff.slice(0, 2)}
                  size="sm"
                  glow="pink"
                  showRing
                />
                <Text style={styles.occupiedStaffName} numberOfLines={1}>{table.backupStaff}</Text>
              </View>
            ) : null}
          </View>
        </View>
        </Animated.View>
      </GestureDetector>
    )
  }

  // Open table: border and text follow status color (open = green/cyan) — display card, not a button
  return (
    <GestureDetector gesture={tapTable}>
      <Animated.View
        style={[
          styles.tableWrap,
          { left: `${table.x}%` as any, top: `${table.y}%` as any },
          tableAnimatedStyle,
        ]}
      >
        <View
          style={[
            styles.tableBtnOpen,
            {
              borderColor: statusColor,
              borderWidth: 1.5,
              backgroundColor: OPEN_BG,
            },
          ]}
        >
          <Text style={[styles.openTableNumber, { color: statusColor }]}>{table.isDjBooth ? "DJ" : table.number}</Text>
          <Text style={[styles.openLabel, { color: statusColor }]}>{table.isDjBooth ? "BOOTH" : "OPEN"}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

// Memoize TableMarker with custom comparison for optimal 60fps performance
const MemoizedTableMarker = React.memo(TableMarker, (prevProps, nextProps) => {
  const a = prevProps.table
  const b = nextProps.table
  return (
    a.id === b.id &&
    a.status === b.status &&
    a.x === b.x &&
    a.y === b.y &&
    a.number === b.number &&
    (a.isDjBooth ?? false) === (b.isDjBooth ?? false) &&
    a.currentGuests === b.currentGuests &&
    a.capacity === b.capacity &&
    a.spend === b.spend &&
    (a.pendingSpend ?? 0) === (b.pendingSpend ?? 0) &&
    (a.guestName ?? "") === (b.guestName ?? "") &&
    (a.itemsSummary ?? "") === (b.itemsSummary ?? "") &&
    (a.primaryStaff ?? "") === (b.primaryStaff ?? "") &&
    (a.backupStaff ?? "") === (b.backupStaff ?? "") &&
    (a.promoter ?? "") === (b.promoter ?? "") &&
    (a.server ?? "") === (b.server ?? "") &&
    (a.eta ?? "") === (b.eta ?? "") &&
    (a.djSetTime ?? "") === (b.djSetTime ?? "") &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.index === nextProps.index &&
    prevProps.showTableGirl === nextProps.showTableGirl
  )
})

/**
 * Skia-based Floor Map Canvas - Renders grid, labels, and paths at 60fps
 * All rendering happens on the UI thread via Skia for optimal performance
 * Memoized to prevent unnecessary re-renders during gestures
 */
const FloorMapCanvas = React.memo(function FloorMapCanvas({
  width,
  height,
  theme,
  showPath,
  pathTargetCoords,
}: {
  width: number
  height: number
  theme: ReturnType<typeof useTheme>["theme"]
  showPath: boolean
  pathTargetCoords: { x: number; y: number } | null
}) {
  // Convert percentage coordinates to pixel coordinates
  const mapWidth = 100 // percentage-based map width
  const mapHeight = 100 // percentage-based map height
  
  // Calculate pixel positions for labels
  const danceFloorX = (50 / mapWidth) * width
  const danceFloorY = (50 / mapHeight) * height
  const entranceX = (entrancePos.x / mapWidth) * width
  const entranceY = (entrancePos.y / mapHeight) * height

  // Create grid lines path
  const gridPath = React.useMemo(() => {
    const path = Skia.Path.Make()
    const gridColor = Skia.Color(`${theme.colors.neonCyan}22`)
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height
      path.moveTo(0, y)
      path.lineTo(width, y)
    }
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width
      path.moveTo(x, 0)
      path.lineTo(x, height)
    }
    
    return path
  }, [width, height, theme.colors.neonCyan])

  // Create path line if needed
  const pathLine = React.useMemo(() => {
    if (!showPath || !pathTargetCoords) return null
    
    const path = Skia.Path.Make()
    const startX = (entrancePos.x / mapWidth) * width
    const startY = (entrancePos.y / mapHeight) * height
    const endX = (pathTargetCoords.x / mapWidth) * width
    const endY = (pathTargetCoords.y / mapHeight) * height
    
    path.moveTo(startX, startY)
    path.lineTo(endX, endY)
    
    return path
  }, [showPath, pathTargetCoords, width, height])

  // Create dance floor label path
  const danceFloorPath = React.useMemo(() => {
    const path = Skia.Path.Make()
    const rectWidth = 180
    const rectHeight = 60
    const rx = 24
    const x = danceFloorX - rectWidth / 2
    const y = danceFloorY - rectHeight / 2
    
    path.addRRect(Skia.RRectXY({ x, y, width: rectWidth, height: rectHeight }, rx, rx))
    return path
  }, [danceFloorX, danceFloorY])

  return (
    <Canvas style={{ flex: 1 }} pointerEvents="none">
      <Group>
        {/* Grid lines - rendered once, transformed by Group */}
        <Path
          path={gridPath}
          style="stroke"
          strokeWidth={0.5}
          color={Skia.Color(`${theme.colors.neonCyan}22`)}
        />

        {/* Path line */}
        {pathLine && (
          <Path
            path={pathLine}
            style="stroke"
            strokeWidth={1}
            color={theme.colors.neonCyan}
            strokeCap="round"
          />
        )}

        {/* Dance Floor label background */}
        <Path
          path={danceFloorPath}
          style="fill"
          color={Skia.Color("rgba(0,0,0,0.45)")}
        />
        <Path
          path={danceFloorPath}
          style="stroke"
          strokeWidth={1.5}
          color={Skia.Color(`${theme.colors.neonPink}55`)}
        />
      </Group>
    </Canvas>
  )
})

function MapView({
  tables,
  selectedTable,
  onSelectTable,
  onTableGuestsChange,
  showPath,
  pathTarget,
  showTableGirl = true,
}: {
  tables: Table[]
  selectedTable: Table | null
  onSelectTable: (t: Table) => void
  onTableGuestsChange?: (tableId: string, delta: number) => void
  showPath: boolean
  pathTarget: Table | null
  /** All pro roles see table girl on map (visibility only; edit is role-gated). */
  showTableGirl?: boolean
}) {
  const { theme } = useTheme()
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions()
  
  // Canvas is 2x screen for more pan/zoom room; content is drawn at screen size so grid/labels/path stay fixed.
  const MAP_SIZE_MULTIPLIER = 2
  const MAP_WIDTH = SCREEN_WIDTH * MAP_SIZE_MULTIPLIER
  const MAP_HEIGHT = SCREEN_HEIGHT * MAP_SIZE_MULTIPLIER
  const CONTENT_WIDTH = SCREEN_WIDTH
  const CONTENT_HEIGHT = SCREEN_HEIGHT

  // Reanimated shared values for 60fps performance - all run on UI thread
  const scale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedScale = useSharedValue(1)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)
  const focalX = useSharedValue(0)
  const focalY = useSharedValue(0)

  // Constants for zoom bounds - defined as constants for worklet access
  // Min < 1 allows zooming out to see more of the 2x canvas
  const MIN_SCALE = 0.5
  const MAX_SCALE = 3

  // Store map dimensions as shared values for worklet access
  // Use the larger map size for proper bounds calculations
  const mapWidth = useSharedValue(MAP_WIDTH)
  const mapHeight = useSharedValue(MAP_HEIGHT)
  const screenWidth = useSharedValue(SCREEN_WIDTH)
  const screenHeight = useSharedValue(SCREEN_HEIGHT)

  // Update dimensions on layout changes
  React.useEffect(() => {
    mapWidth.value = MAP_WIDTH
    mapHeight.value = MAP_HEIGHT
    screenWidth.value = SCREEN_WIDTH
    screenHeight.value = SCREEN_HEIGHT
  }, [MAP_WIDTH, MAP_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT])

  // Optimized pinch gesture handler - all calculations in worklets for 60fps
  // Uses focal point for natural zoom behavior
  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      "worklet"
      // Store initial values when pinch starts
      savedScale.value = scale.value
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
      // Store focal point relative to center
      focalX.value = e.focalX - screenWidth.value / 2
      focalY.value = e.focalY - screenHeight.value / 2
    })
    .onUpdate((e) => {
      "worklet"
      // Calculate new scale with clamping - all on UI thread for 60fps
      const newScale = savedScale.value * e.scale
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
      scale.value = clampedScale

      // Update focal point
      focalX.value = e.focalX - screenWidth.value / 2
      focalY.value = e.focalY - screenHeight.value / 2

      // Calculate zoom offset based on focal point
      // This ensures zoom happens around the pinch center point
      const scaleDelta = clampedScale - savedScale.value
      const offsetX = -focalX.value * (scaleDelta / savedScale.value)
      const offsetY = -focalY.value * (scaleDelta / savedScale.value)

      // Calculate bounds for current scale using map dimensions
      const scaledWidth = mapWidth.value * clampedScale
      const scaledHeight = mapHeight.value * clampedScale
      const maxX = (scaledWidth - screenWidth.value) / 2
      const maxY = (scaledHeight - screenHeight.value) / 2

      // Apply translation with bounds checking - all in worklet
      const newX = savedTranslateX.value + offsetX
      const newY = savedTranslateY.value + offsetY
      translateX.value = Math.max(-maxX, Math.min(maxX, newX))
      translateY.value = Math.max(-maxY, Math.min(maxY, newY))
    })
    .onEnd(() => {
      "worklet"
      // Clamp final scale - worklet ensures 60fps
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value))
      scale.value = withSpring(clampedScale, {
        damping: 20,
        stiffness: 400,
        mass: 0.5,
      })
      savedScale.value = clampedScale

      // Ensure translation is within bounds after zoom
      const scaledWidth = mapWidth.value * clampedScale
      const scaledHeight = mapHeight.value * clampedScale
      const maxX = (scaledWidth - screenWidth.value) / 2
      const maxY = (scaledHeight - screenHeight.value) / 2

      // Clamp translation values with spring animation
      const clampedX = Math.max(-maxX, Math.min(maxX, translateX.value))
      const clampedY = Math.max(-maxY, Math.min(maxY, translateY.value))
      
      translateX.value = withSpring(clampedX, {
        damping: 20,
        stiffness: 400,
        mass: 0.5,
      })
      translateY.value = withSpring(clampedY, {
        damping: 20,
        stiffness: 400,
        mass: 0.5,
      })
      
      savedTranslateX.value = clampedX
      savedTranslateY.value = clampedY

      // Do not reset pan when at min scale so user can keep their position and pan the 2x canvas
    })

  // Optimized pan gesture handler - all in worklet for 60fps
  const panGesture = Gesture.Pan()
    .minDistance(12) // Allow table taps to register before pan (tap typically < 12px movement)
    .onStart(() => {
      "worklet"
      // Store initial translation when pan starts
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })
    .onUpdate((e) => {
      "worklet"
      // Allow panning at any scale so user can drag to view the full 2x canvas
      const newX = savedTranslateX.value + e.translationX
      const newY = savedTranslateY.value + e.translationY

      // Calculate max translation based on current scale - all in worklet
      const scaledWidth = mapWidth.value * scale.value
      const scaledHeight = mapHeight.value * scale.value
      const maxX = (scaledWidth - screenWidth.value) / 2
      const maxY = (scaledHeight - screenHeight.value) / 2

      // Clamp values - all calculations on UI thread for 60fps
      translateX.value = Math.max(-maxX, Math.min(maxX, newX))
      translateY.value = Math.max(-maxY, Math.min(maxY, newY))
    })
    .onEnd(() => {
      "worklet"
      // Save final translation values
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })

  // Combine gestures - simultaneous pinch and pan for natural interaction
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture)

  // Animated style - all calculations in worklet for 60fps
  // This runs entirely on UI thread, ensuring 60fps performance
  // Using transform origin for proper zoom centering
  const animatedStyle = useAnimatedStyle(() => {
    "worklet"
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }
  }, []) // Empty deps - all values are shared values that don't need re-creation

  // Memoize table press handler to prevent unnecessary re-renders
  const handleTablePress = React.useCallback((table: Table) => {
    onSelectTable(table)
  }, [onSelectTable])

  // Memoize tables array to prevent unnecessary re-renders of table markers
  // Create a stable reference that only changes when table data actually changes
  const tableDataKey = React.useMemo(
    () => tables.map((t) => `${t.id}:${t.currentGuests}`).join(","),
    [tables]
  )
  const memoizedTables = React.useMemo(() => tables, [tableDataKey])

  // Memoize path target coordinates to avoid recalculations
  const pathTargetCoords = React.useMemo(() => {
    if (!pathTarget) return null
    return { x: pathTarget.x, y: pathTarget.y }
  }, [pathTarget])

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        <View style={[StyleSheet.absoluteFillObject, { opacity: 0.18 }]} pointerEvents="none">
          <View style={{ flex: 1, backgroundColor: "transparent" }} />
        </View>
        
        {/* Pannable canvas is 2x screen; content (grid, labels, path) is screen-sized and centered */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: MAP_WIDTH,
              height: MAP_HEIGHT,
              left: -SCREEN_WIDTH / 2,
              top: -SCREEN_HEIGHT / 2,
            },
            animatedStyle,
          ]}
          pointerEvents="none"
        >
          <View style={{ width: MAP_WIDTH, height: MAP_HEIGHT, justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: CONTENT_WIDTH, height: CONTENT_HEIGHT }}>
              <FloorMapCanvas
                width={CONTENT_WIDTH}
                height={CONTENT_HEIGHT}
                theme={theme}
                showPath={showPath}
                pathTargetCoords={pathTargetCoords}
              />
            </View>
          </View>
        </Animated.View>

        {/* Table markers and labels: same 2x canvas, content screen-sized and centered */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: MAP_WIDTH,
              height: MAP_HEIGHT,
              left: -SCREEN_WIDTH / 2,
              top: -SCREEN_HEIGHT / 2,
            },
            animatedStyle,
          ]}
          pointerEvents="box-none"
        >
          <View style={{ width: MAP_WIDTH, height: MAP_HEIGHT, justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: CONTENT_WIDTH, height: CONTENT_HEIGHT }}>

      {/* Labels - using Reanimated for 60fps performance */}
      <View style={styles.centerLabelContainer}>
        <Animated.View
          entering={FadeIn.delay(100).springify().damping(18).stiffness(250).mass(0.7)}
          style={[
            styles.centerLabel,
            {
              borderColor: `${theme.colors.neonPink}55`,
              transform: [{ scale: 1 }], // Scale handled by entering animation
            },
          ]}
        >
          <View style={[styles.rowCenter, { gap: 14 }]}>
            <Spark size={24} color={theme.colors.neonPink} />
            <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: 1.5, textAlign: "center", lineHeight: 28 }}>DANCE{"\n"}FLOOR</Text>
            <Spark size={24} color={theme.colors.neonPink} />
          </View>
        </Animated.View>
      </View>

      {memoizedTables.map((t, idx) => (
        <MemoizedTableMarker
          key={t.id}
          table={t}
          isSelected={selectedTable?.id === t.id}
          onPress={handleTablePress}
          onGuestsChange={onTableGuestsChange}
          theme={theme}
          index={idx}
          showTableGirl={showTableGirl}
        />
      ))}
            </View>
          </View>
      </Animated.View>
      </View>
    </GestureDetector>
  )
}

/** Read-only table info for guest/user mode: table number, status, name, capacity. */
function TableInfoSheetGuest({ table, onClose }: { table: Table; onClose: () => void }) {
  const { theme } = useTheme()
  const statusColor = getStatusColor(theme, table.status)
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={[styles.sheetBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1a` }]}>
            <Text style={{ color: statusColor, fontFamily: "Inter_700Bold", fontSize: 20 }}>
              {table.isDjBooth ? "DJ" : table.number}
            </Text>
          </View>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }} numberOfLines={1}>
              {table.guestName || (table.isDjBooth ? "DJ Booth" : `Table ${table.number}`)}
            </Text>
            {!table.isDjBooth ? (
              <Badge tone={table.status === "open" ? "green" : table.status === "occupied" ? "pink" : table.status === "booked" ? "green" : table.status === "pending" ? "orange" : "cyan"}>
                {table.status.toUpperCase()}
              </Badge>
            ) : null}
          </View>
        </View>
        <HapticPressable onPress={onClose} neonBorder borderColor={`${theme.colors.neonPink}AA`} style={styles.closeBtn}>
          <X size={18} color={theme.colors.foreground} />
        </HapticPressable>
      </View>
      {!table.isDjBooth ? (
        <Card variant="glass" style={{ padding: 12, borderColor: `${statusColor}44` }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Users size={18} color={theme.colors.mutedForeground} />
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>
              Capacity: {table.currentGuests}/{table.capacity} guests
            </Text>
          </View>
        </Card>
      ) : (
        table.djSetTime ? (
          <Card variant="glass" style={{ padding: 12, borderColor: `${theme.colors.neonCyan}44` }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Clock size={18} color={theme.colors.neonCyan} />
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>
                Set: {table.djSetTime}
              </Text>
            </View>
          </Card>
        ) : null
      )}
    </View>
  )
}

function ListView({
  tables,
  selectedTable,
  onSelectTable,
  onUpdateTable,
  guestMode = false,
  userRole,
  canEditTableGirl = true,
}: {
  tables: Table[]
  selectedTable?: Table | null
  onSelectTable?: (t: Table) => void
  onUpdateTable?: (tableId: string, updates: Partial<Table>) => void
  guestMode?: boolean
  userRole?: MapTabUserRole
  canEditTableGirl?: boolean
}) {
  const { theme } = useTheme()
  const sortedTables = React.useMemo(
    () =>
      [...tables].sort((a, b) => {
        if (a.isDjBooth) return 1
        if (b.isDjBooth) return -1
        return a.number - b.number
      }),
    [tables]
  )
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
      {sortedTables.map((t, idx) => (
        <Animated.View
          key={t.id}
          entering={SlideInRight.delay(idx * 25).springify().damping(18).stiffness(250).mass(0.8)}
        >
          <HapticPressable
            onPress={() => onSelectTable?.(t)}
            neonBorder={false}
            style={[
              styles.listRow,
              {
                borderBottomColor: `${theme.colors.border}66`,
                borderLeftWidth: 3,
                borderLeftColor: `${getStatusColor(theme, t.status)}AA`,
                backgroundColor: selectedTable?.id === t.id ? `${theme.colors.neonCyan}14` : undefined,
              },
            ]}
          >
            <View style={[styles.listBadge, { borderColor: getStatusColor(theme, t.status), backgroundColor: `${getStatusColor(theme, t.status)}1a` }]}>
              <Text style={{ color: getStatusColor(theme, t.status), fontFamily: "Inter_700Bold", fontSize: 18 }}>
                {t.isDjBooth ? "DJ" : t.number}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", flex: 1 }} numberOfLines={1}>
                  {t.isDjBooth ? (t.guestName || "DJ Booth") : (t.guestName || `Table ${t.number}`)}
                </Text>
                {!guestMode && !t.isDjBooth && (t.isVip ?? (t.spend ?? 0) >= 1000) ? (
                  <View style={{ backgroundColor: theme.colors.neonOrange, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: "#000", fontFamily: "Inter_700Bold", fontSize: 10 }}>VIP</Text>
                  </View>
                ) : null}
              </View>
              {t.isDjBooth ? (
                <>
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                    Set: {t.djSetTime ?? "—"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Text style={{ color: getStatusColor(theme, t.status), fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "uppercase" }}>
                      {t.status}
                    </Text>
                  </View>
                </>
              ) : guestMode ? (
                <>
                  <Text
                    style={[
                      { fontSize: 12, fontFamily: "Inter_400Regular" },
                      t.currentGuests > t.capacity ? { color: "#FF4444" } : { color: theme.colors.mutedForeground },
                    ]}
                  >
                    {t.currentGuests}/{t.capacity} guests
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Text style={{ color: getStatusColor(theme, t.status), fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "uppercase" }}>
                      {t.status}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text
                    style={[
                      { fontSize: 12, fontFamily: "Inter_400Regular" },
                      t.currentGuests > t.capacity ? { color: "#FF4444" } : { color: theme.colors.mutedForeground },
                    ]}
                  >
                    {t.currentGuests}/{t.capacity} guests
                    {t.spend != null && t.spend > 0 ? ` • ${formatNumber(t.spend, { prefix: "$" })}` : ""}
                    {t.eta ? ` • ETA ${t.eta}` : ""}
                  </Text>
                  {(t.pendingSpend != null && t.pendingSpend > 0) || t.itemsSummary ? (
                    <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 }} numberOfLines={1}>
                      {[
                        t.pendingSpend != null && t.pendingSpend > 0 ? `Pending ${formatNumber(t.pendingSpend, { prefix: "$" })}` : null,
                        t.itemsSummary ? t.itemsSummary : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  ) : null}
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 }} numberOfLines={1}>
                    Promoter: {t.promoter?.trim() || "—"} • Bottle girl: {t.backupStaff?.trim() || "—"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Text style={{ color: getStatusColor(theme, t.status), fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "uppercase" }}>
                      {t.status}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </HapticPressable>
        </Animated.View>
      ))}
    </ScrollView>
  )
}

function EditStaffListSheet({
  title,
  options,
  currentValue,
  onSelect,
  onClose,
  placeholder,
}: {
  title: string
  options: StaffMember[]
  currentValue: string
  onSelect: (name: string) => void
  onClose: () => void
  placeholder: string
}) {
  const { theme } = useTheme()
  const [otherName, setOtherName] = React.useState("")
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24, flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 18 }}>{title}</Text>
        <HapticPressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.colors.muted }]}>
          <X size={18} color={theme.colors.foreground} />
        </HapticPressable>
      </View>
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 }}>
        Select from list
      </Text>
      <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
        {options.map((person) => {
          const isSelected = person.name === currentValue
          return (
            <HapticPressable
              key={person.id}
              onPress={() => {
                onSelect(person.name)
                onClose()
              }}
              style={[
                styles.staffListRow,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: isSelected ? `${theme.colors.neonCyan}22` : theme.colors.card,
                },
              ]}
            >
              <NeonAvatar
                source={resolveAvatar(person.avatar)}
                fallback={person.name.slice(0, 2)}
                size="sm"
                glow={isSelected ? "cyan" : undefined}
                status={person.isOnline ? "online" : undefined}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                  {person.name}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                  {person.role}
                  {person.isOnline ? " • Online" : ""}
                </Text>
              </View>
              {isSelected ? (
                <Check size={18} color={theme.colors.neonCyan} />
              ) : null}
            </HapticPressable>
          )
        })}
      </ScrollView>
      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 }}>
          Or enter name
        </Text>
        <Input
          value={otherName}
          onChangeText={setOtherName}
          placeholder={placeholder}
          containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
          style={{ color: theme.colors.foreground }}
          placeholderTextColor={theme.colors.mutedForeground}
        />
        <Button
          variant="solid"
          tone="cyan"
          style={{ marginTop: 10 }}
          onPress={() => {
            const name = otherName.trim()
            if (name) {
              onSelect(name)
              onClose()
            }
          }}
        >
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Save custom name</Text>
        </Button>
      </View>
    </View>
  )
}

function TableDetailSheet({
  table,
  onClose,
  onUnassignStaff,
  onGuestsChange,
  onEditTable,
  onAddBottle,
  onUpdateTable,
  canEditTableGirl = true,
}: {
  table: Table
  onClose: () => void
  onUnassignStaff: () => void
  onGuestsChange?: (tableId: string, delta: number) => void
  onEditTable?: () => void
  onAddBottle?: (itemsText: string, pendingAmount?: number) => void
  onUpdateTable?: (tableId: string, updates: Partial<Table>) => void
  /** Manager/owner see and edit table girl; promoter only sees/edits promoter */
  canEditTableGirl?: boolean
}) {
  const { theme } = useTheme()
  const statusColor = getStatusColor(theme, table.status)
  const assigned = table.assignedTo
  const staff = assigned ? availableStaff.find((s) => s.name === assigned) : undefined
  const [showAddBottleModal, setShowAddBottleModal] = React.useState(false)
  const [pendingBottleAdd, setPendingBottleAdd] = React.useState<{ itemsText: string; pendingAmount?: number } | null>(null)
  const [showEditPromoterSheet, setShowEditPromoterSheet] = React.useState(false)
  const [showEditBottleGirlSheet, setShowEditBottleGirlSheet] = React.useState(false)
  const [showDjSetTimeModal, setShowDjSetTimeModal] = React.useState(false)
  const [djSetStartTime, setDjSetStartTime] = React.useState(() => parseSetTimeRange(table.djSetTime ?? "").start)
  const [djSetEndTime, setDjSetEndTime] = React.useState(() => parseSetTimeRange(table.djSetTime ?? "").end)
  const [showDjSetTimePicker, setShowDjSetTimePicker] = React.useState<"start" | "end" | null>(null)

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 14, flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={[styles.sheetBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1a` }]}>
            <Text style={{ color: statusColor, fontFamily: "Inter_700Bold", fontSize: 20 }}>
              {table.isDjBooth ? "DJ" : table.number}
            </Text>
          </View>
          <View>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }} numberOfLines={1}>
              {table.guestName || (table.isDjBooth ? "DJ Booth" : `Table ${table.number}`)}
            </Text>
            {!table.isDjBooth ? (
              <Badge tone={table.status === "open" ? "green" : table.status === "occupied" ? "pink" : table.status === "booked" ? "green" : table.status === "pending" ? "orange" : "cyan"}>
                {table.status.toUpperCase()}
              </Badge>
            ) : null}
          </View>
        </View>
        <HapticPressable onPress={onClose} neonBorder borderColor={`${theme.colors.neonPink}AA`} style={styles.closeBtn}>
          <X size={18} color={theme.colors.foreground} />
        </HapticPressable>
      </View>

      {table.isDjBooth ? (
        <>
          <Card variant="glass" style={{ padding: 12, marginBottom: 12, borderColor: `${theme.colors.neonCyan}55` }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Mic size={18} color={theme.colors.neonCyan} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 6 }}>DJ name</Text>
                <Input
                  value={table.guestName ?? ""}
                  onChangeText={(text) => onUpdateTable?.(table.id, { guestName: text || undefined })}
                  placeholder="e.g. DJ Booth"
                  containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
                  style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}
                  placeholderTextColor={theme.colors.mutedForeground}
                />
              </View>
            </View>
          </Card>
          <Card variant="glass" style={{ padding: 12, marginBottom: 12, borderColor: `${theme.colors.neonCyan}55` }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Clock size={18} color={theme.colors.neonCyan} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 6 }}>Set time</Text>
                <HapticPressable
                  onPress={() => {
                    setDjSetStartTime(parseSetTimeRange(table.djSetTime ?? "").start)
                    setDjSetEndTime(parseSetTimeRange(table.djSetTime ?? "").end)
                    setShowDjSetTimeModal(true)
                  }}
                  style={[styles.editInput, { paddingVertical: 12, paddingHorizontal: 14, justifyContent: "center" }]}
                >
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                    {table.djSetTime || "Tap to set"}
                  </Text>
                </HapticPressable>
              </View>
            </View>
          </Card>
          {showDjSetTimeModal ? (
            <Modal visible transparent animationType="fade">
              <Pressable style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowDjSetTimeModal(false)}>
                <Pressable style={{ marginHorizontal: 24, backgroundColor: theme.colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border }} onPress={(e) => e.stopPropagation()}>
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 12 }}>Set time</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <Text style={[styles.editLabel, { color: theme.colors.mutedForeground, marginBottom: 0 }]}>Start</Text>
                    <HapticPressable
                      onPress={() => setShowDjSetTimePicker("start")}
                      style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.colors.muted, borderRadius: 8 }}
                    >
                      <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_400Regular" }}>{formatTimeForSet(djSetStartTime)}</Text>
                    </HapticPressable>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <Text style={[styles.editLabel, { color: theme.colors.mutedForeground, marginBottom: 0 }]}>End</Text>
                    <HapticPressable
                      onPress={() => setShowDjSetTimePicker("end")}
                      style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.colors.muted, borderRadius: 8 }}
                    >
                      <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_400Regular" }}>{formatTimeForSet(djSetEndTime)}</Text>
                    </HapticPressable>
                  </View>
                  {showDjSetTimePicker && Platform.OS === "android" ? (
                    <DateTimePicker
                      value={showDjSetTimePicker === "start" ? djSetStartTime : djSetEndTime}
                      mode="time"
                      display="default"
                      onChange={(ev, date) => {
                        if (ev.type === "set" && date) {
                          if (showDjSetTimePicker === "start") setDjSetStartTime(date)
                          else setDjSetEndTime(date)
                        }
                        setShowDjSetTimePicker(null)
                      }}
                    />
                  ) : null}
                  {showDjSetTimePicker && Platform.OS === "ios" ? (
                    <View style={{ marginBottom: 12 }}>
                      <DateTimePicker
                        value={showDjSetTimePicker === "start" ? djSetStartTime : djSetEndTime}
                        mode="time"
                        display="spinner"
                        onChange={(ev, date) => {
                          if (ev.type === "set" && date) {
                            if (showDjSetTimePicker === "start") setDjSetStartTime(date)
                            else setDjSetEndTime(date)
                          }
                          setShowDjSetTimePicker(null)
                        }}
                      />
                    </View>
                  ) : null}
                  <Button
                    variant="solid"
                    tone="cyan"
                    onPress={() => {
                      onUpdateTable?.(table.id, { djSetTime: formatSetTimeRange(djSetStartTime, djSetEndTime) || undefined })
                      setShowDjSetTimeModal(false)
                    }}
                  >
                    <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold" }}>Done</Text>
                  </Button>
                </Pressable>
              </Pressable>
            </Modal>
          ) : null}
          {table.itemsSummary ? (
            <Card variant="glass" style={{ padding: 12, marginBottom: 12 }}>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 }}>Notes</Text>
              <Text style={{ color: theme.colors.foreground, fontSize: 13, fontFamily: "Inter_400Regular" }}>{table.itemsSummary}</Text>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <Card variant="glass" style={{ flex: 1, padding: 12 }}>
              <Users size={16} color={theme.colors.mutedForeground} />
              <View
                style={[styles.occupancyRow, { marginTop: 6 }]}
                accessibilityRole="adjustable"
                accessibilityLabel={`Guests ${table.currentGuests} of ${table.capacity}`}
                accessibilityValue={{ min: 0, max: table.capacity, now: table.currentGuests }}
              >
                <Pressable
                  onPress={() => {
                    if (table.currentGuests > 0) onGuestsChange?.(table.id, -1)
                  }}
                  hitSlop={12}
                  disabled={table.currentGuests <= 0}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease guests"
                  accessibilityState={{ disabled: table.currentGuests <= 0 }}
                  style={({ pressed }) => [
                    styles.occupancyBtn,
                    pressed && table.currentGuests > 0 && styles.occupancyBtnActive,
                    table.currentGuests <= 0 && styles.occupancyBtnDisabled,
                  ]}
                >
                  <Text style={[styles.occupancyBtnText, { color: statusColor }, table.currentGuests <= 0 && { opacity: 0.4 }]}>−</Text>
                </Pressable>
                <Text
                  style={[
                    styles.occupancyText,
                    table.currentGuests > table.capacity && { color: "#FF4444" },
                  ]}
                >
                  {table.currentGuests}/{table.capacity}
                </Text>
                <Pressable
                  onPress={() => onGuestsChange?.(table.id, 1)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Increase guests"
                  style={({ pressed }) => [
                    styles.occupancyBtn,
                    pressed && styles.occupancyBtnActive,
                  ]}
                >
                  <Text style={[styles.occupancyBtnText, { color: statusColor }]}>+</Text>
                </Pressable>
              </View>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 }}>Guests</Text>
            </Card>
            <Card variant="glass" style={{ flex: 1, padding: 12, borderColor: `${theme.colors.neonGreen}55` }}>
              <DollarSign size={16} color={theme.colors.neonGreen} />
              <Text style={{ color: theme.colors.neonGreen, fontFamily: "Inter_700Bold", fontSize: 18, marginTop: 6 }}>
                {formatNumber(table.spend || 0, { prefix: "$" })}
              </Text>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>Spend</Text>
            </Card>
            <Card variant="glass" style={{ flex: 1, padding: 12 }}>
              <Clock size={16} color={theme.colors.neonCyan} />
              <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_700Bold", fontSize: 18, marginTop: 6 }}>
                {table.eta || "N/A"}
              </Text>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>ETA</Text>
            </Card>
          </View>

          {(table.primaryStaff || assigned) ? (
            <Card variant="glass" style={{ padding: 12, borderColor: `${theme.colors.neonPink}55`, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <NeonAvatar
                    source={table.promoterAvatarKey ? avatars[table.promoterAvatarKey] : avatars.man2}
                    fallback={(table.primaryStaff ?? assigned ?? "").slice(0, 2)}
                    size="lg"
                    glow="pink"
                    status={staff?.isOnline ? "online" : undefined}
                    showPulse
                    showRing
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold" }}>{table.primaryStaff ?? assigned}</Text>
                    <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>Assigned Promoter</Text>
                  </View>
                </View>
                <HapticPressable onPress={onUnassignStaff} neonBorder borderColor={`${theme.colors.neonPink}AA`} style={styles.smallIcon}>
                  <X size={16} color={theme.colors.mutedForeground} />
                </HapticPressable>
              </View>
            </Card>
          ) : null}

          {table.backupStaff ? (
            <Card variant="glass" style={{ padding: 12, borderColor: `${theme.colors.neonCyan}55`, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <NeonAvatar
                  source={table.bottleGirlAvatarKey ? avatars[table.bottleGirlAvatarKey] : avatars.woman1}
                  fallback={table.backupStaff.slice(0, 2)}
                  size="lg"
                  glow="cyan"
                  showRing
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold" }}>{table.backupStaff}</Text>
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>Bottle girl</Text>
                </View>
              </View>
            </Card>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button variant="solid" tone="pink" style={{ flex: 1 }} onPress={() => setShowAddBottleModal(true)}>
              <View style={styles.rowCenter}>
                <Wine size={18} color={theme.colors.neonPink} />
                <Text style={{ color: theme.colors.neonPink, fontFamily: "Inter_600SemiBold" }}>Add bottle</Text>
              </View>
            </Button>
          </View>
          {onEditTable || onUpdateTable ? (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <HapticPressable
                onPress={() => setShowEditPromoterSheet(true)}
                neonBorder
                borderColor={`${theme.colors.neonCyan}AA`}
                style={[styles.editRoleBtn, { borderColor: theme.colors.neonCyan, backgroundColor: theme.colors.card }]}
              >
                <User size={18} color={theme.colors.neonCyan} />
                <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Edit promoter</Text>
              </HapticPressable>
              {canEditTableGirl ? (
                <HapticPressable
                  onPress={() => setShowEditBottleGirlSheet(true)}
                  neonBorder
                  borderColor={`${theme.colors.neonCyan}AA`}
                  style={[styles.editRoleBtn, { borderColor: theme.colors.neonCyan, backgroundColor: theme.colors.card }]}
                >
                  <Users size={18} color={theme.colors.neonCyan} />
                  <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Edit bottle girl</Text>
                </HapticPressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      {onEditTable && !table.isDjBooth ? (
        <View style={{ marginTop: 10 }}>
          <Button variant="outline" tone="cyan" onPress={onEditTable}>
            <View style={styles.rowCenter}>
              <Pencil size={18} color={theme.colors.neonCyan} />
              <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold" }}>
                Edit table info
              </Text>
            </View>
          </Button>
        </View>
      ) : null}

      {!table.isDjBooth ? (
        <View style={{ marginTop: 10 }}>
          <Button
            variant="outline"
            tone="green"
            onPress={() => {
              Alert.alert(
                "Close table",
                "Are you sure you want to close the table?",
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes",
                    onPress: () => {
                      onUpdateTable?.(table.id, { status: "open" })
                      onClose()
                    },
                  },
                ]
              )
            }}
          >
            <View style={styles.rowCenter}>
              <CheckCircle size={18} color={theme.colors.neonGreen} />
              <Text style={{ color: theme.colors.neonGreen, fontFamily: "Inter_600SemiBold" }}>Mark as Complete</Text>
            </View>
          </Button>
        </View>
      ) : null}

      <ModalSheet open={showEditPromoterSheet} onClose={() => setShowEditPromoterSheet(false)} maxHeightPct={1}>
        <EditStaffListSheet
          title="Edit promoter"
          options={availableStaff}
          currentValue={table.promoter ?? ""}
          placeholder="Promoter name"
          onSelect={(name) => {
            onUpdateTable?.(table.id, { promoter: name || undefined })
            setShowEditPromoterSheet(false)
          }}
          onClose={() => setShowEditPromoterSheet(false)}
        />
      </ModalSheet>
      <ModalSheet open={showEditBottleGirlSheet} onClose={() => setShowEditBottleGirlSheet(false)} maxHeightPct={1}>
        <EditStaffListSheet
          title="Edit bottle girl"
          options={availableBottleGirls}
          currentValue={table.server ?? ""}
          placeholder="Bottle girl name"
          onSelect={(name) => {
            onUpdateTable?.(table.id, { server: name || undefined })
            setShowEditBottleGirlSheet(false)
          }}
          onClose={() => setShowEditBottleGirlSheet(false)}
        />
      </ModalSheet>
      <ModalSheet open={showAddBottleModal} onClose={() => setShowAddBottleModal(false)} maxHeightPct={1} showHeader={false}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 18 }}>Add bottle</Text>
            <HapticPressable onPress={() => setShowAddBottleModal(false)} style={[styles.closeBtn, { backgroundColor: theme.colors.muted }]}>
              <X size={18} color={theme.colors.foreground} />
            </HapticPressable>
          </View>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginBottom: 16 }}>
            Select a bottle to add to this table. Pending spend will be updated.
          </Text>
          <Text style={[styles.menuSectionLabel, { color: theme.colors.neonPink }]}>BOTTLES</Text>
          {tableServiceItems.map((item) => {
            const priceNum = item.price ? parseInt(item.price.replace(/[^0-9]/g, ""), 10) : undefined
            const priceMatch = item.price?.match(/\$[\d,]+/)
            const priceRight = priceMatch ? priceMatch[0] : item.price
            return (
              <HapticPressable
                key={item.id}
                onPress={() => {
                  setPendingBottleAdd({ itemsText: `1x ${item.title}`, pendingAmount: priceNum })
                }}
                style={[
                  styles.menuItemCard,
                  {
                    borderColor: item.limitedOffer ? `${theme.colors.neonPink}99` : `${theme.colors.neonPink}55`,
                    backgroundColor: theme.colors.card,
                  },
                ]}
              >
                {item.limitedOffer ? (
                  <View style={[styles.limitedBadge, { backgroundColor: theme.colors.neonPink }]}>
                    <Text style={styles.limitedBadgeText}>LTO</Text>
                  </View>
                ) : null}
                <View style={[styles.menuItemIcon, { backgroundColor: theme.colors.muted }]}>
                  {item.iconKey && bottleImages[item.iconKey] ? (
                    <Image
                      source={bottleImages[item.iconKey]}
                      style={styles.menuItemIconImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Wine size={20} color={theme.colors.neonPink} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.menuItemTitle, { color: theme.colors.foreground }]}>{item.title}</Text>
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                    {item.price}
                  </Text>
                  {item.desc ? (
                    <Text style={[styles.menuItemDesc, { color: theme.colors.mutedForeground, marginTop: 4 }]}>{item.desc}</Text>
                  ) : null}
                </View>
                <Text style={[styles.menuItemTitle, { color: theme.colors.foreground, fontSize: 16 }]}>{priceRight}</Text>
              </HapticPressable>
            )
          })}
        </View>
      </ModalSheet>
      <AlertDialog
        open={pendingBottleAdd !== null}
        onClose={() => setPendingBottleAdd(null)}
        title="ADD BOTTLE"
        message="Add a bottle to this table? Select from the menu to update spend."
        icon={<Wine size={32} color={theme.colors.foreground} strokeWidth={1.5} />}
        primaryLabel="YES, CONTINUE"
        onPrimary={() => {
          if (pendingBottleAdd) {
            onAddBottle?.(pendingBottleAdd.itemsText, pendingBottleAdd.pendingAmount)
            setShowAddBottleModal(false)
            setPendingBottleAdd(null)
          }
        }}
        secondaryLabel="CANCEL"
        onSecondary={() => setPendingBottleAdd(null)}
      />
    </View>
  )
}

function EditTableSheet({
  table,
  onSave,
  onClose,
  canEditTableGirl = true,
}: {
  table: Table
  onSave: (updates: Partial<Table>) => void
  onClose: () => void
  canEditTableGirl?: boolean
}) {
  const { theme } = useTheme()
  const [number, setNumber] = React.useState(String(table.number))
  const [capacity, setCapacity] = React.useState(String(table.capacity))
  const [currentGuests, setCurrentGuests] = React.useState(String(table.currentGuests))
  const [status, setStatus] = React.useState<TableStatus>(table.status)
  const [guestName, setGuestName] = React.useState(table.guestName ?? "")
  const [spend, setSpend] = React.useState(table.spend != null ? String(table.spend) : "")
  const [pendingSpend, setPendingSpend] = React.useState(table.pendingSpend != null ? String(table.pendingSpend) : "")
  const [itemsSummary, setItemsSummary] = React.useState(table.itemsSummary ?? "")
  const [promoter, setPromoter] = React.useState(table.promoter ?? "")
  const [server, setServer] = React.useState(table.server ?? "")
  const [eta, setEta] = React.useState(table.eta ?? "")
  const [isVip, setIsVip] = React.useState(table.isVip ?? false)
  const [djSetStartTime, setDjSetStartTime] = React.useState(() => parseSetTimeRange(table.djSetTime ?? "").start)
  const [djSetEndTime, setDjSetEndTime] = React.useState(() => parseSetTimeRange(table.djSetTime ?? "").end)
  const [showSetTimeModal, setShowSetTimeModal] = React.useState(false)
  const [showSetTimePicker, setShowSetTimePicker] = React.useState<"start" | "end" | null>(null)

  const handleSave = () => {
    if (table.isDjBooth) {
      onSave({
        guestName: guestName.trim() || undefined,
        djSetTime: formatSetTimeRange(djSetStartTime, djSetEndTime) || undefined,
        itemsSummary: itemsSummary.trim() || undefined,
      })
      return
    }
    const num = parseInt(number, 10)
    const cap = parseInt(capacity, 10)
    const cur = parseInt(currentGuests, 10)
    const spendNum = spend.trim() ? parseInt(spend.replace(/[^0-9]/g, ""), 10) : undefined
    const pendingNum = pendingSpend.trim()
      ? parseInt(pendingSpend.replace(/[^0-9]/g, ""), 10)
      : undefined
    onSave({
      number: Number.isNaN(num) ? table.number : num,
      capacity: Number.isNaN(cap) ? table.capacity : cap,
      currentGuests: Number.isNaN(cur) ? table.currentGuests : cur,
      status,
      guestName: guestName.trim() || undefined,
      spend: spendNum,
      pendingSpend: pendingNum,
      itemsSummary: itemsSummary.trim() || undefined,
      promoter: promoter.trim() || undefined,
      server: server.trim() || undefined,
      eta: eta.trim() || undefined,
      isVip,
    })
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 18 }}>
          {table.isDjBooth ? "Edit DJ info" : "Edit table info"}
        </Text>
        <HapticPressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: theme.colors.muted }]}
          accessibilityLabel="Close"
        >
          <X size={18} color={theme.colors.foreground} />
        </HapticPressable>
      </View>
      <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 12 }}>
          {table.isDjBooth ? (
            <>
              <View>
                <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>DJ name</Text>
                <Input
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholder="e.g. DJ Booth"
                  containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
                  style={{ color: theme.colors.foreground }}
                />
              </View>
              <View>
                <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Set time</Text>
                <HapticPressable
                  onPress={() => setShowSetTimeModal(true)}
                  style={[styles.editInput, { borderColor: theme.colors.border, paddingVertical: 12, paddingHorizontal: 14, justifyContent: "center" }]}
                >
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_400Regular", fontSize: 16 }}>
                    {formatSetTimeRange(djSetStartTime, djSetEndTime)}
                  </Text>
                </HapticPressable>
              </View>
              {showSetTimeModal ? (
                <Modal visible transparent animationType="fade">
                  <Pressable style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowSetTimeModal(false)}>
                    <Pressable style={{ marginHorizontal: 24, backgroundColor: theme.colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border }} onPress={(e) => e.stopPropagation()}>
                      <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 12 }}>Set time</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <Text style={[styles.editLabel, { color: theme.colors.mutedForeground, marginBottom: 0 }]}>Start</Text>
                        <HapticPressable
                          onPress={() => setShowSetTimePicker("start")}
                          style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.colors.muted, borderRadius: 8 }}
                        >
                          <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_400Regular" }}>{formatTimeForSet(djSetStartTime)}</Text>
                        </HapticPressable>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <Text style={[styles.editLabel, { color: theme.colors.mutedForeground, marginBottom: 0 }]}>End</Text>
                        <HapticPressable
                          onPress={() => setShowSetTimePicker("end")}
                          style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.colors.muted, borderRadius: 8 }}
                        >
                          <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_400Regular" }}>{formatTimeForSet(djSetEndTime)}</Text>
                        </HapticPressable>
                      </View>
                      {showSetTimePicker && Platform.OS === "android" ? (
                        <DateTimePicker
                          value={showSetTimePicker === "start" ? djSetStartTime : djSetEndTime}
                          mode="time"
                          display="default"
                          onChange={(ev, date) => {
                            if (ev.type === "set" && date) {
                              if (showSetTimePicker === "start") setDjSetStartTime(date)
                              else setDjSetEndTime(date)
                            }
                            setShowSetTimePicker(null)
                          }}
                        />
                      ) : null}
                      {showSetTimePicker && Platform.OS === "ios" ? (
                        <View style={{ marginBottom: 12 }}>
                          <DateTimePicker
                            value={showSetTimePicker === "start" ? djSetStartTime : djSetEndTime}
                            mode="time"
                            display="spinner"
                            onChange={(ev, date) => {
                              if (date) {
                                if (showSetTimePicker === "start") setDjSetStartTime(date)
                                else setDjSetEndTime(date)
                              }
                            }}
                          />
                        </View>
                      ) : null}
                      <Button onPress={() => setShowSetTimeModal(false)}>
                        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Done</Text>
                      </Button>
                    </Pressable>
                  </Pressable>
                </Modal>
              ) : null}
              <View>
                <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Notes</Text>
                <Input
                  value={itemsSummary}
                  onChangeText={setItemsSummary}
                  placeholder="Equipment, requests, etc."
                  containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
                  style={{ color: theme.colors.foreground }}
                />
              </View>
            </>
          ) : (
            <>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Table number</Text>
            <Input
              value={number}
              onChangeText={setNumber}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Capacity</Text>
            <Input
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
              placeholder="e.g. 12"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Current guests</Text>
            <Input
              value={currentGuests}
              onChangeText={setCurrentGuests}
              keyboardType="number-pad"
              placeholder="e.g. 10"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Status</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(["open", "occupied", "booked", "pending"] as const).map((s) => (
                <HapticPressable
                  key={s}
                  onPress={() => setStatus(s)}
                  neonBorder={false}
                  style={[
                    styles.statusChipEdit,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.muted },
                    status === s && { borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}22` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipEditText,
                      { color: theme.colors.foreground },
                      status === s && { color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    {s}
                  </Text>
                </HapticPressable>
              ))}
            </View>
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Guest name</Text>
            <Input
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Guest or group name"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Spend ($)</Text>
            <Input
              value={spend}
              onChangeText={setSpend}
              keyboardType="number-pad"
              placeholder="e.g. 1200"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Pending spend ($)</Text>
            <Input
              value={pendingSpend}
              onChangeText={setPendingSpend}
              keyboardType="number-pad"
              placeholder="e.g. 600"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Items summary</Text>
            <Input
              value={itemsSummary}
              onChangeText={setItemsSummary}
              placeholder="e.g. 1x Ace, 2x Goose"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Promoter</Text>
            <Input
              value={promoter}
              onChangeText={setPromoter}
              placeholder="Promoter name"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>Table girl</Text>
            <Input
              value={server}
              onChangeText={setServer}
              placeholder="Table girl name"
              editable={canEditTableGirl}
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <View>
            <Text style={[styles.editLabel, { color: theme.colors.mutedForeground }]}>ETA</Text>
            <Input
              value={eta}
              onChangeText={setEta}
              placeholder="e.g. 15m"
              containerStyle={[styles.editInput, { borderColor: theme.colors.border }]}
              style={{ color: theme.colors.foreground }}
            />
          </View>
          <HapticPressable
            onPress={() => setIsVip((v) => !v)}
            style={[
              styles.vipToggle,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.muted },
              isVip && { borderColor: theme.colors.neonOrange, backgroundColor: `${theme.colors.neonOrange}22` },
            ]}
          >
            <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold" }}>VIP</Text>
            <View style={[styles.vipToggleBox, isVip && { backgroundColor: theme.colors.neonOrange }]}>
              {isVip ? <Check size={14} color="#000" /> : null}
            </View>
          </HapticPressable>
            </>
          )}
        </View>
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Button variant="outline" tone="neutral" style={{ flex: 1 }} onPress={onClose}>
          <Text style={{ color: theme.colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancel</Text>
        </Button>
        <Button variant="solid" tone="cyan" style={{ flex: 1 }} onPress={handleSave}>
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Save</Text>
        </Button>
      </View>
    </View>
  )
}

function VoiceCommandOverlay({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme()
  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <HapticPressable onPress={onClose} neonBorder borderColor={`${theme.colors.neonCyan}AA`} style={[styles.smallIcon, { alignSelf: "flex-end" }]}>
        <X size={16} color={theme.colors.mutedForeground} />
      </HapticPressable>

      <View style={{ alignItems: "center" }}>
        <View style={[styles.voiceCircle, { borderColor: `${theme.colors.neonCyan}55`, backgroundColor: `${theme.colors.neonCyan}22` }]}>
          <Mic size={26} color={theme.colors.neonCyan} />
        </View>
        <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 12 }}>
          Listening...
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, textAlign: "center", marginTop: 6, fontFamily: "Inter_400Regular" }}>
          Try saying "Add 2 bottles to Table 3"
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 4, height: 42, alignItems: "flex-end", marginTop: 10 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <AudioBar
            key={i}
            index={i}
            targetHeight={18 + (i % 5) * 5}
            theme={theme}
            color={i % 2 === 0 ? theme.colors.neonCyan : theme.colors.neonPink}
          />
        ))}
      </View>
    </View>
  )
}

type BarSpecialsTab = "table" | "bar"

function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const mo = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${y}-${mo}-${day}`
}

function parseDateOnly(str: string): Date {
  if (!str?.trim()) return new Date()
  const d = new Date(str)
  if (!Number.isNaN(d.getTime())) return d
  return new Date()
}

/** Parse "10pm" / "2am" style string to hour (0-23). */
function parseTimePart(str: string): number {
  const m = str.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
  if (!m) return 0
  let h = parseInt(m[1], 10)
  const min = m[2] ? parseInt(m[2], 10) : 0
  const ampm = m[3]
  if (ampm === "pm" && h < 12) h += 12
  if (ampm === "am" && h === 12) h = 0
  if (!ampm && h >= 12) h -= 12 // assume pm if 12-23
  return Math.min(23, Math.max(0, h)) * 60 + Math.min(59, min)
}

function parseSetTimeRange(str: string): { start: Date; end: Date } {
  const base = new Date()
  base.setSeconds(0, 0)
  const defaultStart = new Date(base)
  defaultStart.setHours(22, 0, 0, 0)
  const defaultEnd = new Date(base)
  defaultEnd.setHours(2, 0, 0, 0)
  if (!str?.trim()) return { start: defaultStart, end: defaultEnd }
  const parts = str.split(/[-–—]\s*/).map((s) => s.trim()).filter(Boolean)
  if (parts.length < 2) return { start: defaultStart, end: defaultEnd }
  const startMins = parseTimePart(parts[0])
  const endMins = parseTimePart(parts[1])
  const start = new Date(base)
  start.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0)
  const end = new Date(base)
  end.setHours(Math.floor(endMins / 60), endMins % 60, 0, 0)
  if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1)
  return { start, end }
}

function formatTimeForSet(time: Date): string {
  const h = time.getHours()
  const m = time.getMinutes()
  const isPm = h >= 12
  const h12 = h % 12 || 12
  if (m === 0) return `${h12}${isPm ? "pm" : "am"}`
  return `${h12}:${m.toString().padStart(2, "0")}${isPm ? "pm" : "am"}`
}

function formatSetTimeRange(start: Date, end: Date): string {
  return `${formatTimeForSet(start)}–${formatTimeForSet(end)}`
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear()
  const mo = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const h = date.getHours().toString().padStart(2, "0")
  const min = date.getMinutes().toString().padStart(2, "0")
  return `${y}-${mo}-${day} ${h}:${min}`
}

function parseDateTime(str: string): Date {
  if (!str?.trim()) {
    const d = new Date()
    d.setHours(d.getHours() + 2, 0, 0, 0)
    return d
  }
  const iso = str.replace(" ", "T")
  const d = new Date(iso)
  if (!Number.isNaN(d.getTime())) return d
  const [h, m] = str.split(/[:\s-]/).map(Number)
  if (!Number.isNaN(h)) {
    const d2 = new Date()
    d2.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0)
    return d2
  }
  const d2 = new Date()
  d2.setHours(d2.getHours() + 2, 0, 0, 0)
  return d2
}

type LtoDatePickerTarget = { itemId: string; source: "table" | "bar"; end: "start" | "end" }
type DatePickerTarget = { itemId: string; source: "table" | "bar"; end: "start" | "end" }

function MainBarSpecialsSheet({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState<BarSpecialsTab>("table")
  const [menuEditMode, setMenuEditMode] = React.useState(false)
  const [showUpdateDetectedDialog, setShowUpdateDetectedDialog] = React.useState(false)
  const [tableItems, setTableItems] = React.useState<TableServiceItem[]>(() => [...tableServiceItems])
  const [barItems, setBarItems] = React.useState<BarDrinkItem[]>(() => [...barDrinkItems])
  const [ltoDatePicker, setLtoDatePicker] = React.useState<LtoDatePickerTarget | null>(null)
  const [datePicker, setDatePicker] = React.useState<DatePickerTarget | null>(null)
  const [pickerValue, setPickerValue] = React.useState<Date>(() => new Date())

  function updateTableItem(id: string, updates: Partial<TableServiceItem>) {
    setTableItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }
  function updateBarItem(id: string, updates: Partial<BarDrinkItem>) {
    setBarItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  /** Add a new table service (bottle package) item. */
  function addTableItem(item?: Partial<TableServiceItem>) {
    const id = `table_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const newItem: TableServiceItem = {
      id,
      title: item?.title ?? "",
      price: item?.price ?? "",
      capacity: item?.capacity,
      desc: item?.desc,
      limitedOffer: item?.limitedOffer,
      limitedDateStart: item?.limitedDateStart,
      limitedDate: item?.limitedDate,
      iconKey: item?.iconKey,
      discountOffer: item?.discountOffer,
      discountPrice: item?.discountPrice,
      discountTimeLimitStart: item?.discountTimeLimitStart,
      discountTimeLimit: item?.discountTimeLimit,
    }
    setTableItems((prev) => [...prev, newItem])
  }

  /** Add a new bar drink item. */
  function addBarItem(item?: Partial<BarDrinkItem>) {
    const id = `bar_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const newItem: BarDrinkItem = {
      id,
      title: item?.title ?? "",
      desc: item?.desc,
      price: item?.price ?? "",
      iconKey: item?.iconKey,
      iconColor: item?.iconColor ?? BAR_ITEM_COLORS[barItems.length % BAR_ITEM_COLORS.length],
      limitedOffer: item?.limitedOffer,
      limitedDateStart: item?.limitedDateStart,
      limitedDate: item?.limitedDate,
      discountOffer: item?.discountOffer,
      discountPrice: item?.discountPrice,
      discountTimeLimitStart: item?.discountTimeLimitStart,
      discountTimeLimit: item?.discountTimeLimit,
    }
    setBarItems((prev) => [...prev, newItem])
  }

  /** Remove a table service item. */
  function removeTableItem(id: string) {
    setTableItems((prev) => prev.filter((i) => i.id !== id))
  }

  /** Remove a bar drink item. */
  function removeBarItem(id: string) {
    setBarItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <>
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={[styles.barMenuHeader, { marginBottom: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <Wine size={20} color={theme.colors.foreground} />
          <Text numberOfLines={1} style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 0.5 }}>
            Table & Bar Menu
          </Text>
        </View>
        <HapticPressable
          onPress={() => setMenuEditMode((prev) => !prev)}
          style={[
            styles.editMenuBtn,
            {
              borderColor: menuEditMode ? theme.colors.neonCyan : theme.colors.border,
              backgroundColor: menuEditMode ? `${theme.colors.neonCyan}18` : theme.colors.muted,
            },
          ]}
          accessibilityLabel="Edit menu"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Pencil size={12} color={menuEditMode ? theme.colors.neonCyan : theme.colors.foreground} />
          <Text
            style={[
              styles.editMenuBtnText,
              { color: menuEditMode ? theme.colors.neonCyan : theme.colors.foreground },
            ]}
          >
            EDIT MENU
          </Text>
          <ChevronDown size={12} color={theme.colors.mutedForeground} />
        </HapticPressable>
        <HapticPressable onPress={onClose} neonBorder borderColor={`${theme.colors.border}AA`} style={styles.closeBtn}>
          <X size={18} color={theme.colors.foreground} />
        </HapticPressable>
      </View>

      <View style={[styles.barSpecialsTabs, { borderColor: theme.colors.border, backgroundColor: theme.colors.muted }]}>
        <HapticPressable
          onPress={() => setActiveTab("table")}
          style={[
            styles.barSpecialsTab,
            activeTab === "table" && {
              backgroundColor: `${theme.colors.neonOrange}18`,
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.neonOrange,
            },
          ]}
        >
          <Text
            style={[
              styles.barSpecialsTabText,
              { color: activeTab === "table" ? theme.colors.neonOrange : theme.colors.mutedForeground },
            ]}
          >
            TABLE SERVICE (MINS)
          </Text>
        </HapticPressable>
        <HapticPressable
          onPress={() => setActiveTab("bar")}
          style={[
            styles.barSpecialsTab,
            activeTab === "bar" && {
              backgroundColor: `${theme.colors.neonCyan}18`,
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.neonCyan,
            },
          ]}
        >
          <Text
            style={[
              styles.barSpecialsTabText,
              { color: activeTab === "bar" ? theme.colors.neonCyan : theme.colors.mutedForeground },
            ]}
          >
            BAR DRINKS
          </Text>
        </HapticPressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "table" ? (
          <>
            <Text style={[styles.menuSectionLabel, { color: theme.colors.neonCyan }]}>
              VIP BOTTLE PACKAGES
            </Text>
            {tableItems.map((item, idx) => {
              const tableIconColor = [theme.colors.neonCyan, theme.colors.neonPink, theme.colors.neonOrange][idx % 3]
              const tableImageSource = tableImages[TABLE_IMAGE_KEYS[Math.min(idx, TABLE_IMAGE_KEYS.length - 1)]]
              const discountChecked = item.discountOffer === true
              return (
              <View
                key={item.id}
                style={[
                  styles.menuItemCard,
                  {
                    borderColor: discountChecked
                      ? `${theme.colors.neonCyan}55`
                      : item.limitedOffer
                        ? `${theme.colors.neonPink}55`
                        : theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
              >
                {item.limitedOffer ? (
                  <View style={[styles.limitedBadge, { backgroundColor: theme.colors.neonPink }]}>
                    <Text style={styles.limitedBadgeText}>LTO</Text>
                  </View>
                ) : null}
                {discountChecked ? (
                  <View style={[styles.limitedBadge, { backgroundColor: theme.colors.neonCyan, top: item.limitedOffer ? 24 : 0 }]}>
                    <Text style={styles.limitedBadgeText}>DISC</Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  {!menuEditMode ? (
                    <View style={[styles.menuItemIcon, { backgroundColor: theme.colors.muted }]}>
                      {tableImageSource ? (
                        <Image
                          source={tableImageSource}
                          style={styles.menuItemIconImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Wine size={22} color={tableIconColor} />
                      )}
                    </View>
                  ) : null}
                  <View style={{ flex: 1, marginLeft: menuEditMode ? 0 : 12 }}>
                    {menuEditMode ? (
                      <View style={{ gap: 6 }}>
                        <Input
                          value={item.title}
                          onChangeText={(text) => updateTableItem(item.id, { title: text })}
                          placeholder="Item name"
                          containerStyle={styles.menuInputContainer}
                          style={[styles.menuEditInput, { color: theme.colors.foreground }]}
                          placeholderTextColor={theme.colors.mutedForeground}
                        />
                        <Input
                          value={item.price}
                          containerStyle={styles.menuInputContainer}
                          onChangeText={(text) => updateTableItem(item.id, { price: text })}
                          placeholder="Price"
                          style={[styles.menuEditInput, { color: theme.colors.neonOrange }]}
                          placeholderTextColor={theme.colors.mutedForeground}
                        />
                        <Input
                          value={item.capacity ?? ""}
                          onChangeText={(text) => updateTableItem(item.id, { capacity: text || undefined })}
                          placeholder="Capacity (COVERS 6 GUESTS)"
                          containerStyle={styles.menuInputContainer}
                          style={[styles.menuEditInput, { color: theme.colors.neonGreen }]}
                          placeholderTextColor={theme.colors.mutedForeground}
                        />
                        <Input
                          value={item.desc ?? ""}
                          onChangeText={(text) => updateTableItem(item.id, { desc: text || undefined })}
                          placeholder="Description"
                          containerStyle={styles.menuInputContainer}
                          style={[styles.menuEditInput, { color: theme.colors.mutedForeground }]}
                          placeholderTextColor={theme.colors.mutedForeground}
                        />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <HapticPressable
                            onPress={() => updateTableItem(item.id, { limitedOffer: !item.limitedOffer })}
                            style={[
                              styles.ltoCheckbox,
                              {
                                borderColor: item.limitedOffer ? theme.colors.neonPink : theme.colors.border,
                                backgroundColor: item.limitedOffer ? `${theme.colors.neonPink}22` : "transparent",
                              },
                            ]}
                            accessibilityLabel={item.limitedOffer ? "LTO on" : "LTO off"}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: !!item.limitedOffer }}
                          >
                            {item.limitedOffer ? (
                              <Check size={14} color={theme.colors.neonPink} strokeWidth={2.5} />
                            ) : null}
                            <Text style={[styles.ltoCheckboxLabel, { color: theme.colors.mutedForeground }]}>LTO</Text>
                          </HapticPressable>
                        </View>
                        {item.limitedOffer ? (
                          <View style={{ gap: 6, marginTop: 6 }}>
                            <Pressable
                              onPress={() => {
                                setPickerValue(parseDateOnly(item.limitedDateStart ?? item.limitedDate ?? ""))
                                setLtoDatePicker({ itemId: item.id, source: "table", end: "start" })
                              }}
                              style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                            >
                              <Text style={[styles.menuEditInput, { color: theme.colors.neonPink, paddingVertical: 0 }]} numberOfLines={1}>
                                {item.limitedDateStart ? formatDateOnly(parseDateOnly(item.limitedDateStart)) : "LTO start date"}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setPickerValue(parseDateOnly(item.limitedDate ?? ""))
                                setLtoDatePicker({ itemId: item.id, source: "table", end: "end" })
                              }}
                              style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                            >
                              <Text style={[styles.menuEditInput, { color: theme.colors.neonPink, paddingVertical: 0 }]} numberOfLines={1}>
                                {item.limitedDate ? formatDateOnly(parseDateOnly(item.limitedDate)) : "LTO end date"}
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                        <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                          {(() => {
                            const discountOn = item.discountOffer ?? !!(item.discountPrice ?? item.discountTimeLimit ?? item.discountTimeLimitStart)
                            return (
                              <>
                                <HapticPressable
                                  onPress={() => updateTableItem(item.id, { discountOffer: !discountOn })}
                                  style={[
                                    styles.ltoCheckbox,
                                    {
                                      borderColor: discountOn ? theme.colors.neonCyan : theme.colors.border,
                                      backgroundColor: discountOn ? `${theme.colors.neonCyan}22` : "transparent",
                                      alignSelf: "flex-start",
                                      marginBottom: 6,
                                    },
                                  ]}
                                  accessibilityLabel={discountOn ? "Discount on" : "Discount off"}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: discountOn }}
                                >
                                  {discountOn ? (
                                    <Check size={14} color={theme.colors.neonCyan} strokeWidth={2.5} />
                                  ) : null}
                                  <Text style={[styles.ltoCheckboxLabel, { color: discountOn ? "#fff" : theme.colors.mutedForeground }]}>DISCOUNT</Text>
                                </HapticPressable>
                                {discountOn ? (
                                  <>
                                    <Input
                                      value={item.discountPrice ?? ""}
                                      onChangeText={(text) => updateTableItem(item.id, { discountPrice: text || undefined })}
                                      placeholder="Discount price"
                                      containerStyle={styles.menuInputContainer}
                                      style={[styles.menuEditInput, { color: theme.colors.neonGreen }]}
                                      placeholderTextColor={theme.colors.mutedForeground}
                                    />
                                    <View style={{ gap: 6, marginTop: 6 }}>
                                      <Pressable
                                        onPress={() => {
                                          setPickerValue(parseDateOnly(item.discountTimeLimitStart ?? item.discountTimeLimit ?? ""))
                                          setDatePicker({ itemId: item.id, source: "table", end: "start" })
                                        }}
                                        style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                                      >
                                        <Text style={[styles.menuEditInput, { color: theme.colors.mutedForeground, paddingVertical: 0 }]} numberOfLines={1}>
                                          {item.discountTimeLimitStart ? formatDateOnly(parseDateOnly(item.discountTimeLimitStart)) : "Discount start"}
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() => {
                                          setPickerValue(parseDateOnly(item.discountTimeLimit ?? ""))
                                          setDatePicker({ itemId: item.id, source: "table", end: "end" })
                                        }}
                                        style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                                      >
                                        <Text style={[styles.menuEditInput, { color: theme.colors.mutedForeground, paddingVertical: 0 }]} numberOfLines={1}>
                                          {item.discountTimeLimit ? formatDateOnly(parseDateOnly(item.discountTimeLimit)) : "Discount end"}
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </>
                                ) : null}
                              </>
                            )
                          })()}
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.menuItemTitle, { color: theme.colors.foreground }]}>{item.title}</Text>
                        {item.capacity ? (
                          <Text style={[styles.menuItemCapacity, { color: theme.colors.neonGreen }]}>{item.capacity}</Text>
                        ) : null}
                        {(item.limitedDateStart ?? item.limitedDate) ? (
                          <Text style={[styles.menuItemLimited, { color: theme.colors.neonPink }]}>
                            LTO: {item.limitedDateStart ? formatDateOnly(parseDateOnly(item.limitedDateStart)) : "—"} – {item.limitedDate ? formatDateOnly(parseDateOnly(item.limitedDate)) : "—"}
                          </Text>
                        ) : null}
                        {item.discountPrice ? (
                          <View style={{ marginTop: 2 }}>
                            <Text style={[styles.menuItemPriceOriginal, { color: theme.colors.mutedForeground }]}>{item.price}</Text>
                            <Text style={[styles.menuItemPrice, { color: theme.colors.neonGreen }]}>{item.discountPrice}</Text>
                            {(item.discountTimeLimitStart ?? item.discountTimeLimit) ? (
                              <Text style={[styles.menuItemLimited, { color: theme.colors.neonGreen, marginTop: 2 }]}>
                                DISC: {item.discountTimeLimitStart ? formatDateOnly(parseDateOnly(item.discountTimeLimitStart)) : "—"} – {item.discountTimeLimit ? formatDateOnly(parseDateOnly(item.discountTimeLimit)) : "—"}
                              </Text>
                            ) : null}
                          </View>
                        ) : (
                          <Text style={[styles.menuItemPrice, { color: theme.colors.neonOrange }]}>{item.price}</Text>
                        )}
                        {item.desc ? (
                          <Text style={[styles.menuItemDesc, { color: theme.colors.mutedForeground }]}>{item.desc}</Text>
                        ) : null}
                      </>
                    )}
                  </View>
                </View>
                {menuEditMode ? (
                  <View style={{ flexDirection: "column", alignItems: "stretch", gap: 6, width: 96 }}>
                    <Button
                      variant="solid"
                      tone="green"
                      style={[styles.selectBtn, { borderColor: "rgba(255,255,255,0.4)", marginLeft: 0, width: "100%", minHeight: 32, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, justifyContent: "center" }]}
                      onPress={() => setShowUpdateDetectedDialog(true)}
                    >
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.5 }}>
                        SAVE
                      </Text>
                    </Button>
                    <HapticPressable
                      onPress={() => removeTableItem(item.id)}
                      style={[styles.selectBtn, { backgroundColor: "rgba(255,59,48,0.15)", borderColor: "rgba(255,59,48,0.5)", marginLeft: 0, width: "100%", minHeight: 32, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, justifyContent: "center", alignItems: "center" }]}
                      accessibilityLabel="Remove item"
                      accessibilityRole="button"
                    >
                      <Trash2 size={12} color="#ff3b30" />
                    </HapticPressable>
                  </View>
                ) : !item.limitedOffer ? (
                  <Button
                    variant="outline"
                    tone="orange"
                    style={styles.selectBtn}
                    onPress={() => {}}
                  >
                    <Text style={{ color: theme.colors.neonOrange, fontFamily: "Inter_700Bold", fontSize: 10 }}>
                      SELECT
                    </Text>
                  </Button>
                ) : null}
              </View>
            );
            })}
            {menuEditMode ? (
              <HapticPressable
                onPress={() => addTableItem()}
                style={[
                  styles.menuItemCard,
                  {
                    borderStyle: "dashed",
                    borderColor: theme.colors.neonCyan,
                    backgroundColor: "transparent",
                    minHeight: 56,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
                accessibilityLabel="Add bottle package"
                accessibilityRole="button"
              >
                <Plus size={20} color={theme.colors.neonCyan} />
                <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 6 }}>
                  ADD BOTTLE PACKAGE
                </Text>
              </HapticPressable>
            ) : null}
          </>
        ) : (
          <>
            <Text style={[styles.menuSectionLabel, { color: theme.colors.neonPurple }]}>
              CRAFT COCKTAILS
            </Text>
            {barItems.map((item) => {
              const discountChecked = item.discountOffer === true
              return (
              <View
                key={item.id}
                style={[
                  styles.menuItemCard,
                  {
                    borderColor: discountChecked
                      ? `${theme.colors.neonCyan}55`
                      : item.limitedOffer
                        ? `${theme.colors.neonPink}55`
                        : theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
              >
                {item.limitedOffer ? (
                  <View style={[styles.limitedBadge, { backgroundColor: theme.colors.neonPink }]}>
                    <Text style={styles.limitedBadgeText}>LTO</Text>
                  </View>
                ) : null}
                {discountChecked ? (
                  <View style={[styles.limitedBadge, { backgroundColor: theme.colors.neonCyan, top: item.limitedOffer ? 24 : 0 }]}>
                    <Text style={styles.limitedBadgeText}>DISC</Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  {!menuEditMode ? (
                    <View style={[styles.menuItemIcon, { backgroundColor: theme.colors.muted }]}>
                      {item.iconKey && bottleImages[item.iconKey] ? (
                        <Image
                          source={bottleImages[item.iconKey]}
                          style={styles.menuItemIconImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Wine size={20} color={item.iconColor ?? theme.colors.neonCyan} />
                      )}
                    </View>
                  ) : null}
                  <View style={{ flex: 1, marginLeft: menuEditMode ? 0 : 12 }}>
                    {menuEditMode ? (
                      <View style={{ gap: 6 }}>
                        <Input
                          value={item.title}
                          onChangeText={(text) => updateBarItem(item.id, { title: text })}
                          placeholder="Item name"
                          containerStyle={styles.menuInputContainer}
                          style={[styles.menuEditInput, { color: theme.colors.foreground }]}
                          placeholderTextColor={theme.colors.mutedForeground}
                        />
                        <Input
                          value={item.desc ?? ""}
                          onChangeText={(text) => updateBarItem(item.id, { desc: text || undefined })}
                          placeholder="Description"
                          containerStyle={styles.menuInputContainer}
                          style={[styles.menuEditInput, { color: theme.colors.mutedForeground }]}
                          placeholderTextColor={theme.colors.mutedForeground}
                        />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <HapticPressable
                            onPress={() => updateBarItem(item.id, { limitedOffer: !item.limitedOffer })}
                            style={[
                              styles.ltoCheckbox,
                              {
                                borderColor: item.limitedOffer ? theme.colors.neonPink : theme.colors.border,
                                backgroundColor: item.limitedOffer ? `${theme.colors.neonPink}22` : "transparent",
                              },
                            ]}
                            accessibilityLabel={item.limitedOffer ? "LTO on" : "LTO off"}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: !!item.limitedOffer }}
                          >
                            {item.limitedOffer ? (
                              <Check size={14} color={theme.colors.neonPink} strokeWidth={2.5} />
                            ) : null}
                            <Text style={[styles.ltoCheckboxLabel, { color: theme.colors.mutedForeground }]}>LTO</Text>
                          </HapticPressable>
                          <Input
                            value={item.price}
                            onChangeText={(text) => updateBarItem(item.id, { price: text })}
                            placeholder="Price"
                            containerStyle={[styles.menuInputContainer, { flex: 1, minWidth: 80 }]}
                            style={[styles.menuEditInput, { color: theme.colors.neonOrange }]}
                            placeholderTextColor={theme.colors.mutedForeground}
                          />
                        </View>
                        {item.limitedOffer ? (
                          <View style={{ gap: 6, marginTop: 6 }}>
                            <Pressable
                              onPress={() => {
                                setPickerValue(parseDateOnly(item.limitedDateStart ?? item.limitedDate ?? ""))
                                setLtoDatePicker({ itemId: item.id, source: "bar", end: "start" })
                              }}
                              style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                            >
                              <Text style={[styles.menuEditInput, { color: theme.colors.neonPink, paddingVertical: 0 }]} numberOfLines={1}>
                                {item.limitedDateStart ? formatDateOnly(parseDateOnly(item.limitedDateStart)) : "LTO start date"}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setPickerValue(parseDateOnly(item.limitedDate ?? ""))
                                setLtoDatePicker({ itemId: item.id, source: "bar", end: "end" })
                              }}
                              style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                            >
                              <Text style={[styles.menuEditInput, { color: theme.colors.neonPink, paddingVertical: 0 }]} numberOfLines={1}>
                                {item.limitedDate ? formatDateOnly(parseDateOnly(item.limitedDate)) : "LTO end date"}
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                        <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                          {(() => {
                            const discountOn = item.discountOffer ?? !!(item.discountPrice ?? item.discountTimeLimit ?? item.discountTimeLimitStart)
                            return (
                              <>
                                <HapticPressable
                                  onPress={() => updateBarItem(item.id, { discountOffer: !discountOn })}
                                  style={[
                                    styles.ltoCheckbox,
                                    {
                                      borderColor: discountOn ? theme.colors.neonCyan : theme.colors.border,
                                      backgroundColor: discountOn ? `${theme.colors.neonCyan}22` : "transparent",
                                      alignSelf: "flex-start",
                                      marginBottom: 6,
                                    },
                                  ]}
                                  accessibilityLabel={discountOn ? "Discount on" : "Discount off"}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: discountOn }}
                                >
                                  {discountOn ? (
                                    <Check size={14} color={theme.colors.neonCyan} strokeWidth={2.5} />
                                  ) : null}
                                  <Text style={[styles.ltoCheckboxLabel, { color: discountOn ? "#fff" : theme.colors.mutedForeground }]}>DISCOUNT</Text>
                                </HapticPressable>
                                {discountOn ? (
                                  <>
                                    <Input
                                      value={item.discountPrice ?? ""}
                                      onChangeText={(text) => updateBarItem(item.id, { discountPrice: text || undefined })}
                                      placeholder="Discount price"
                                      containerStyle={styles.menuInputContainer}
                                      style={[styles.menuEditInput, { color: theme.colors.neonGreen }]}
                                      placeholderTextColor={theme.colors.mutedForeground}
                                    />
                                    <View style={{ gap: 6, marginTop: 6 }}>
                                      <Pressable
                                        onPress={() => {
                                          setPickerValue(parseDateOnly(item.discountTimeLimitStart ?? item.discountTimeLimit ?? ""))
                                          setDatePicker({ itemId: item.id, source: "bar", end: "start" })
                                        }}
                                        style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                                      >
                                        <Text style={[styles.menuEditInput, { color: theme.colors.mutedForeground, paddingVertical: 0 }]} numberOfLines={1}>
                                          {item.discountTimeLimitStart ? formatDateOnly(parseDateOnly(item.discountTimeLimitStart)) : "Discount start"}
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() => {
                                          setPickerValue(parseDateOnly(item.discountTimeLimit ?? ""))
                                          setDatePicker({ itemId: item.id, source: "bar", end: "end" })
                                        }}
                                        style={[styles.menuInputContainer, { height: 42, justifyContent: "center" }]}
                                      >
                                        <Text style={[styles.menuEditInput, { color: theme.colors.mutedForeground, paddingVertical: 0 }]} numberOfLines={1}>
                                          {item.discountTimeLimit ? formatDateOnly(parseDateOnly(item.discountTimeLimit)) : "Discount end"}
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </>
                                ) : null}
                              </>
                            )
                          })()}
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.menuItemTitle, { color: theme.colors.foreground }]}>{item.title}</Text>
                        {item.desc ? (
                          <Text style={[styles.menuItemDesc, { color: theme.colors.mutedForeground }]}>{item.desc}</Text>
                        ) : null}
                        {(item.limitedDateStart ?? item.limitedDate) ? (
                          <Text style={[styles.menuItemLimited, { color: theme.colors.neonPink, marginTop: 4 }]}>
                            LTO: {item.limitedDateStart ? formatDateOnly(parseDateOnly(item.limitedDateStart)) : "—"} – {item.limitedDate ? formatDateOnly(parseDateOnly(item.limitedDate)) : "—"}
                          </Text>
                        ) : null}
                        {item.discountPrice ? (
                          <View style={{ marginTop: 4 }}>
                            <Text style={[styles.menuItemPriceOriginal, { color: theme.colors.mutedForeground }]}>{item.price}</Text>
                            <Text style={[styles.menuItemPrice, { color: theme.colors.neonGreen }]}>{item.discountPrice}</Text>
                            {(item.discountTimeLimitStart ?? item.discountTimeLimit) ? (
                              <Text style={[styles.menuItemLimited, { color: theme.colors.neonGreen, marginTop: 2 }]}>
                                DISC: {item.discountTimeLimitStart ? formatDateOnly(parseDateOnly(item.discountTimeLimitStart)) : "—"} – {item.discountTimeLimit ? formatDateOnly(parseDateOnly(item.discountTimeLimit)) : "—"}
                              </Text>
                            ) : null}
                          </View>
                        ) : (
                          <Text style={[styles.menuItemPrice, { color: theme.colors.foreground, fontSize: 14 }]}>{item.price}</Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
                {menuEditMode ? (
                  <View style={{ flexDirection: "column", alignItems: "stretch", gap: 6, width: 96 }}>
                    <Button
                      variant="solid"
                      tone="green"
                      style={[styles.selectBtn, { borderColor: "rgba(255,255,255,0.4)", marginLeft: 0, width: "100%", minHeight: 32, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, justifyContent: "center" }]}
                      onPress={() => setShowUpdateDetectedDialog(true)}
                    >
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.5 }}>
                        SAVE
                      </Text>
                    </Button>
                    <HapticPressable
                      onPress={() => removeBarItem(item.id)}
                      style={[styles.selectBtn, { backgroundColor: "rgba(255,59,48,0.15)", borderColor: "rgba(255,59,48,0.5)", marginLeft: 0, width: "100%", minHeight: 32, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, justifyContent: "center", alignItems: "center" }]}
                      accessibilityLabel="Remove item"
                      accessibilityRole="button"
                    >
                      <Trash2 size={12} color="#ff3b30" />
                    </HapticPressable>
                  </View>
                ) : (
                  <Text style={[styles.menuItemPrice, { color: theme.colors.foreground, fontSize: 14 }]}>
                    {item.discountPrice ?? item.price}
                  </Text>
                )}
              </View>
            );
            })}
            {menuEditMode ? (
              <HapticPressable
                onPress={() => addBarItem()}
                style={[
                  styles.menuItemCard,
                  {
                    borderStyle: "dashed",
                    borderColor: theme.colors.neonPurple,
                    backgroundColor: "transparent",
                    minHeight: 56,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
                accessibilityLabel="Add drink"
                accessibilityRole="button"
              >
                <Plus size={20} color={theme.colors.neonPurple} />
                <Text style={{ color: theme.colors.neonPurple, fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 6 }}>
                  ADD DRINK
                </Text>
              </HapticPressable>
            ) : null}
          </>
        ) }
      </ScrollView>
    </View>
    <ModalCard
      open={showUpdateDetectedDialog}
      onClose={() => setShowUpdateDetectedDialog(false)}
      style={{ borderWidth: 2, borderColor: theme.colors.neonCyan }}
    >
      <View style={{ alignItems: "center", paddingVertical: 8, gap: 16 }}>
        <View style={{ position: "relative" }}>
          <Satellite size={40} color={theme.colors.foreground} />
          <View style={{ position: "absolute", right: -2, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.neonGreen }} />
        </View>
        <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: 0.5 }}>
          UPDATE DETECTED
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 14, textAlign: "center" }}>
          You've made changes to the menu.
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 14, textAlign: "center" }}>
          Would you like to send a push notification to all active users?
        </Text>
        <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 8 }}>
          <Button
            variant="outline"
            tone="neutral"
            style={{ flex: 1 }}
            onPress={() => {
              setShowUpdateDetectedDialog(false)
              toast({ title: "Saved", description: "Changes saved silently." })
            }}
          >
            <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>NO, SILENT</Text>
          </Button>
          <HapticPressable
            onPress={() => {
              setShowUpdateDetectedDialog(false)
              toast({ title: "Notification sent", description: "Active users have been notified." })
            }}
            style={{ flex: 1, borderWidth: 2, borderColor: theme.colors.neonCyan, borderRadius: 10, paddingVertical: 12, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>YES, NOTIFY</Text>
          </HapticPressable>
        </View>
      </View>
    </ModalCard>
    {ltoDatePicker ? (
      Platform.OS === "android" ? (
        <Modal visible transparent animationType="fade">
          <Pressable style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setLtoDatePicker(null)}>
            <View style={{ marginHorizontal: 24 }}>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="default"
                onChange={(ev, date) => {
                  if (ev.type === "set" && date) {
                    const formatted = formatDateOnly(date)
                    if (ltoDatePicker.source === "table") {
                      updateTableItem(ltoDatePicker.itemId, ltoDatePicker.end === "start" ? { limitedDateStart: formatted } : { limitedDate: formatted })
                    } else {
                      updateBarItem(ltoDatePicker.itemId, ltoDatePicker.end === "start" ? { limitedDateStart: formatted } : { limitedDate: formatted })
                    }
                  }
                  setLtoDatePicker(null)
                }}
              />
            </View>
          </Pressable>
        </Modal>
      ) : (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="spinner"
          onChange={(ev, date) => {
            if (ev.type === "set" && date) {
              const formatted = formatDateOnly(date)
              if (ltoDatePicker.source === "table") {
                updateTableItem(ltoDatePicker.itemId, ltoDatePicker.end === "start" ? { limitedDateStart: formatted } : { limitedDate: formatted })
              } else {
                updateBarItem(ltoDatePicker.itemId, ltoDatePicker.end === "start" ? { limitedDateStart: formatted } : { limitedDate: formatted })
              }
            }
            setLtoDatePicker(null)
          }}
        />
      )
    ) : null}
    {datePicker ? (
      Platform.OS === "android" ? (
        <Modal visible transparent animationType="fade">
          <Pressable style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setDatePicker(null)}>
            <View style={{ marginHorizontal: 24 }}>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="default"
                onChange={(ev, date) => {
                  if (ev.type === "set" && date) {
                    const formatted = formatDateOnly(date)
                    if (datePicker.source === "table") {
                      updateTableItem(datePicker.itemId, datePicker.end === "start" ? { discountTimeLimitStart: formatted } : { discountTimeLimit: formatted })
                    } else {
                      updateBarItem(datePicker.itemId, datePicker.end === "start" ? { discountTimeLimitStart: formatted } : { discountTimeLimit: formatted })
                    }
                  }
                  setDatePicker(null)
                }}
              />
            </View>
          </Pressable>
        </Modal>
      ) : (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="spinner"
          onChange={(ev, date) => {
            if (ev.type === "set" && date) {
              const formatted = formatDateOnly(date)
              if (datePicker.source === "table") {
                updateTableItem(datePicker.itemId, datePicker.end === "start" ? { discountTimeLimitStart: formatted } : { discountTimeLimit: formatted })
              } else {
                updateBarItem(datePicker.itemId, datePicker.end === "start" ? { discountTimeLimitStart: formatted } : { discountTimeLimit: formatted })
              }
            }
            setDatePicker(null)
          }}
        />
      )
    ) : null}
    </>
  )
}

function AssignStaffDialog({
  currentAssigned,
  onSelectStaff,
}: {
  currentAssigned?: string
  onSelectStaff: (name: string) => void
}) {
  const { theme } = useTheme()
  const [query, setQuery] = React.useState("")

  const filtered = availableStaff.filter((s) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)
  })

  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>
        Assign Staff to Table
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Search size={16} color={theme.colors.mutedForeground} />
        <Input placeholder="Search staff..." value={query} onChangeText={setQuery} containerStyle={{ flex: 1 }} />
      </View>

      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 16, gap: 10 }}>
        {filtered.map((s) => {
          const isCurrent = currentAssigned === s.name
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelectStaff(s.name)}
              style={[
                styles.staffRow,
                {
                  borderColor: isCurrent ? `${theme.colors.neonPink}66` : theme.colors.border,
                  backgroundColor: isCurrent ? `${theme.colors.neonPink}18` : "transparent",
                },
              ]}
            >
              <NeonAvatar
                source={resolveAvatar(s.avatar)}
                fallback={s.name.split(" ").map((n) => n[0]).join("")}
                size="md"
                glow={s.isOnline ? "green" : "cyan"}
                status={s.isOnline ? "online" : undefined}
                showRing
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_700Bold" }} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {isCurrent ? <Badge tone="pink">Current</Badge> : null}
                </View>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                  {s.role} • {s.tablesAssigned} table{s.tablesAssigned === 1 ? "" : "s"}
                </Text>
              </View>
              {s.isOnline ? (
                <OnlineIndicator color={theme.colors.neonGreen} />
              ) : null}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const BOOKED_GREEN = "#00D26A"

function getStatusColor(
  theme: ReturnType<typeof useTheme>["theme"],
  status: TableStatus
) {
  if (status === "open") return theme.colors.neonCyan
  if (status === "occupied") return theme.colors.neonPink
  if (status === "booked") return BOOKED_GREEN
  if (status === "pending") return theme.colors.neonOrange
  return theme.colors.neonPink
}

function Spark({ size, color }: { size: number; color: string }) {
  return <Zap size={size} color={color} />
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  segmentWrap: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minWidth: 0,
    height: 34,
    borderRadius: 12,
  },
  segmentActive: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  segmentText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  closingBadge: {
    backgroundColor: "#8B1538",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  closingBadgeText: {
    color: "#fce4ec",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    textAlign: "center",
  },
  guestListBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  guestListBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  guestListTabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  guestListTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  guestListTabText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  guestListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  guestListAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  guestListAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  guestListInitials: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  guestListName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  guestListDetails: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkInBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  metricPill: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  metricValue: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  statusChip: {
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editRoleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  staffListRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tableWrap: {
    position: "absolute",
    transform: [{ translateX: -32 }, { translateY: -32 }],
  },
  tableWrapDj: {
    position: "absolute",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  tableBtnDj: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tableBtnDjText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  tableWrapOccupied: {
    position: "absolute",
    transform: [{ translateX: -100 }, { translateY: -100 }],
  },
  tableBtnOccupied: {
    width: 184,
    minHeight: 200,
    borderRadius: 20,
    padding: 12,
    overflow: "hidden",
  },
  occupiedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  occupiedTableNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
  },
  occupancyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30,30,35,0.98)",
    borderWidth: 0,
    borderRadius: 12,
    overflow: "hidden",
  },
  occupancyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: "center",
    backgroundColor: "rgba(40,40,48,0.98)",
  },
  occupancyBtnActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
  },
  occupancyBtnDisabled: {
    opacity: 0.6,
  },
  occupancyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  occupancyText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    minWidth: 32,
    textAlign: "center",
  },
  occupiedGuestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  occupiedGuestAvatarWrap: {
    position: "relative",
  },
  vipBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    backgroundColor: OCCUPIED_YELLOW,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipBadgeText: {
    color: "#000",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  occupiedGuestInfo: {
    flex: 1,
    minWidth: 0,
  },
  occupiedName: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginBottom: 4,
  },
  occupiedAmountRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    marginBottom: 2,
  },
  occupiedAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  occupiedSpendLabel: {
    color: "#888899",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  occupiedPending: {
    color: "#888899",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  occupiedItemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  occupiedItemsBullet: {
    width: 2,
    height: 12,
    backgroundColor: "rgba(136,136,153,0.8)",
    borderRadius: 1,
  },
  occupiedItems: {
    flex: 1,
    color: "#888899",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    fontStyle: "italic",
  },
  occupiedDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 10,
  },
  occupiedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  occupiedStaffCell: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  occupiedStaffRoleLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  occupiedStaffName: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    marginTop: 4,
  },
  occupiedRoleLabel: {
    color: "#888899",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    flex: 1,
  },
  occupiedRoleName: {
    fontFamily: "Inter_600SemiBold",
  },
  tableBtnOpen: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  openTableNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    marginBottom: 4,
  },
  openLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableBtn: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  warn: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  dollarBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  eta: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  centerLabelContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  listRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderBottomWidth: 1,
  },
  listBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  listRowInput: {
    minHeight: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  listRowInputText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
  },
  sheetBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  barMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  editMenuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  editMenuBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  editLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  statusChipEdit: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusChipEditText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  vipToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  vipToggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  smallIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  staffRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  voiceCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBarButtonWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
  },
  mainBarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  mainBarTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  mainBarSubtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    marginTop: 2,
  },
  barSpecialsTabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  barSpecialsTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  barSpecialsTabText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.3,
  },
  menuSectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 10,
  },
  menuItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    position: "relative",
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemIconImage: {
    width: 32,
    height: 32,
  },
  menuItemTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  menuItemPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    marginTop: 2,
  },
  menuItemPriceOriginal: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  menuItemCapacity: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    marginTop: 4,
  },
  menuItemDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    marginTop: 2,
    fontStyle: "italic",
  },
  menuEditInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    paddingVertical: 0,
  },
  menuInputContainer: {
    borderRadius: 12,
    borderWidth: 1.2,
    height: 42,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  menuItemLimited: {
    fontFamily: "Inter_700Bold",
    fontSize: 8,
    marginTop: 4,
  },
  limitedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 12,
  },
  limitedBadgeText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 8,
  },
  ltoCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  ltoCheckboxLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  selectBtn: {
    marginLeft: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  textAreaWrap: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickRow: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
})

