"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  List, 
  Grid3X3, 
  Users, 
  DollarSign, 
  Clock, 
  X, 
  UserPlus, 
  Wine,
  AlertTriangle,
  CheckCircle,
  Mic,
  Navigation,
  Sparkles,
  Zap,
  Table,
  Phone,
  MessageSquare,
  Calendar,
  Plus,
  Trash2,
  Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { formatNumber } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, formatDistanceToNowStrict } from "date-fns"

type ViewMode = "map" | "list"
type TableStatus = "open" | "occupied" | "pending" | "reserved"

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
  assignedTo?: string
  eta?: string
  reservationId?: string
  waitlistId?: string
}

interface WaitlistEntry {
  id: string
  name: string
  phone: string
  partySize: number
  addedAt: Date
  estimatedWaitTime: number // in minutes
  notified: boolean
  status: "waiting" | "notified" | "seated" | "cancelled"
  notes?: string
}

interface Reservation {
  id: string
  name: string
  phone: string
  email?: string
  partySize: number
  date: Date
  time: string
  tableId?: string
  status: "confirmed" | "pending" | "seated" | "cancelled" | "no-show"
  specialRequests?: string
  reminderSent: boolean
  createdAt: Date
}

interface PathPoint {
  x: number
  y: number
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
  { id: "1", name: "Sarah M.", role: "Promoter", avatar: "/images/avatars/woman1.png", isOnline: true, tablesAssigned: 2 },
  { id: "2", name: "Mike J.", role: "Promoter", avatar: "/images/avatars/man2.png", isOnline: true, tablesAssigned: 1 },
  { id: "3", name: "John Doe", role: "Promoter", avatar: "/images/avatars/man1.png", isOnline: true, tablesAssigned: 0 },
  { id: "4", name: "Marcus Chen", role: "Promoter", avatar: "/images/avatars/man3.png", isOnline: false, tablesAssigned: 0 },
  { id: "5", name: "Alex Kim", role: "Promoter", avatar: "/images/avatars/man4.png", isOnline: true, tablesAssigned: 1 },
  { id: "6", name: "Lisa Wang", role: "Promoter", avatar: "/images/avatars/man5.png", isOnline: true, tablesAssigned: 0 },
]

const initialTables: Table[] = [
  { id: "1", number: 1, x: 12, y: 18, status: "occupied", capacity: 8, currentGuests: 6, guestName: "Marcus Chen", spend: 2500, assignedTo: "Sarah M." },
  { id: "2", number: 2, x: 35, y: 18, status: "occupied", capacity: 10, currentGuests: 12, guestName: "Elite Group", spend: 4200, assignedTo: "Mike J." },
  { id: "3", number: 3, x: 58, y: 18, status: "reserved", capacity: 6, currentGuests: 0, guestName: "VIP Incoming", eta: "15 min" },
  { id: "4", number: 4, x: 82, y: 18, status: "open", capacity: 8, currentGuests: 0 },
  { id: "5", number: 5, x: 12, y: 75, status: "pending", capacity: 6, currentGuests: 4, guestName: "Johnson Party", spend: 800 },
  { id: "6", number: 6, x: 35, y: 75, status: "occupied", capacity: 10, currentGuests: 8, guestName: "Birthday Group", spend: 3100, assignedTo: "Sarah M." },
  { id: "7", number: 7, x: 58, y: 75, status: "open", capacity: 6, currentGuests: 0 },
  { id: "8", number: 8, x: 82, y: 75, status: "reserved", capacity: 8, currentGuests: 0, guestName: "Williams", eta: "30 min" },
]

// Entrance position
const entrancePos = { x: 50, y: 95 }

// Bar position
const barPos = { x: 88, y: 50 }

const statusColors: Record<TableStatus, { bg: string; border: string; text: string; glow: string }> = {
  open: { bg: "bg-neon-green/20", border: "border-neon-green", text: "text-neon-green", glow: "glow-green" },
  occupied: { bg: "bg-neon-pink/20", border: "border-neon-pink", text: "text-neon-pink", glow: "glow-pink" },
  pending: { bg: "bg-neon-orange/20", border: "border-neon-orange", text: "text-neon-orange", glow: "glow-orange" },
  reserved: { bg: "bg-neon-cyan/20", border: "border-neon-cyan", text: "text-neon-cyan", glow: "glow-cyan" },
}

const statusLabels: Record<TableStatus, string> = {
  open: "Open",
  occupied: "Occupied",
  pending: "Pending",
  reserved: "Reserved",
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundToStep(value: number, step: number) {
  if (!Number.isFinite(value) || step <= 0) return value
  return Math.round(value / step) * step
}

function getWaitEstimateMinutes({
  queuePosition,
  openTables,
  partySize,
}: {
  queuePosition: number
  openTables: number
  partySize: number
}) {
  const base = 8 + Math.max(0, queuePosition - 1) * 6
  const tablePressure = openTables === 0 ? 12 : openTables >= 3 ? -5 : 0
  const partyPressure =
    partySize >= 10
      ? 12
      : partySize >= 8
        ? 8
        : partySize >= 6
          ? 4
          : partySize <= 2
            ? -2
            : 0

  const raw = base + tablePressure + partyPressure
  const clamped = clampNumber(raw, 5, 60)
  return roundToStep(clamped, 5)
}

function getWaitRangeMinutes(estimateMinutes: number) {
  const spread = estimateMinutes >= 40 ? 15 : estimateMinutes >= 25 ? 10 : 5
  const min = Math.max(0, estimateMinutes - spread)
  const max = estimateMinutes + spread
  return { min, max }
}

function formatWaitRange(estimateMinutes: number) {
  const { min, max } = getWaitRangeMinutes(estimateMinutes)
  if (min === max) return `${min} min`
  return `${min}–${max} min`
}

function formatReadyAround(estimateMinutes: number) {
  const readyAt = new Date(Date.now() + estimateMinutes * 60_000)
  return format(readyAt, "p")
}

// Mock waitlist and reservations data
const initialWaitlist: WaitlistEntry[] = [
  {
    id: "w1",
    name: "David Martinez",
    phone: "+1 (555) 123-4567",
    partySize: 4,
    addedAt: new Date(Date.now() - 20 * 60000), // 20 minutes ago
    estimatedWaitTime: 25,
    notified: false,
    status: "waiting",
    notes: "Birthday celebration"
  },
  {
    id: "w2",
    name: "Emma Thompson",
    phone: "+1 (555) 234-5678",
    partySize: 2,
    addedAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
    estimatedWaitTime: 15,
    notified: false,
    status: "waiting"
  },
  {
    id: "w3",
    name: "James Wilson",
    phone: "+1 (555) 345-6789",
    partySize: 6,
    addedAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    estimatedWaitTime: 30,
    notified: false,
    status: "waiting",
    notes: "VIP client"
  }
]

const initialReservations: Reservation[] = [
  {
    id: "r1",
    name: "VIP Incoming",
    phone: "+1 (555) 456-7890",
    email: "vip@example.com",
    partySize: 6,
    date: new Date(),
    time: "21:00",
    status: "confirmed",
    reminderSent: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: "r2",
    name: "Williams",
    phone: "+1 (555) 567-8901",
    partySize: 8,
    date: new Date(),
    time: "22:00",
    status: "confirmed",
    reminderSent: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: "r3",
    name: "Corporate Event",
    phone: "+1 (555) 678-9012",
    email: "corp@example.com",
    partySize: 12,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    time: "20:00",
    status: "confirmed",
    reminderSent: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
]

export function MapTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist)
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showGuestList, setShowGuestList] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [showPath, setShowPath] = useState(true)
  const [pathTarget, setPathTarget] = useState<Table | null>(initialTables[2]) // Default path to reserved table
  const [showAssignStaffDialog, setShowAssignStaffDialog] = useState(false)
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false)
  const [showReservationDialog, setShowReservationDialog] = useState(false)

  const handleAssignStaff = (staffName: string) => {
    if (!selectedTable) return
    
    setTables(prevTables =>
      prevTables.map(table =>
        table.id === selectedTable.id
          ? { ...table, assignedTo: staffName }
          : table
      )
    )
    
    // Update selected table to reflect the change
    setSelectedTable(prev => prev ? { ...prev, assignedTo: staffName } : null)
    setShowAssignStaffDialog(false)
  }

  const handleUnassignStaff = () => {
    if (!selectedTable) return
    
    setTables(prevTables =>
      prevTables.map(table =>
        table.id === selectedTable.id
          ? { ...table, assignedTo: undefined }
          : table
      )
    )
    
    // Update selected table to reflect the change
    setSelectedTable(prev => prev ? { ...prev, assignedTo: undefined } : null)
  }

  const handleAddToWaitlist = (entry: Omit<WaitlistEntry, "id" | "addedAt" | "estimatedWaitTime" | "notified" | "status">) => {
    const activeQueueSize = waitlist.filter(w => w.status === "waiting" || w.status === "notified").length
    const openTables = tables.filter(t => t.status === "open").length
    const estimateMinutes = getWaitEstimateMinutes({
      queuePosition: activeQueueSize + 1,
      openTables,
      partySize: entry.partySize,
    })
    
    const newEntry: WaitlistEntry = {
      id: `w${Date.now()}`,
      ...entry,
      addedAt: new Date(),
      estimatedWaitTime: estimateMinutes,
      notified: false,
      status: "waiting"
    }
    
    setWaitlist(prev => [...prev, newEntry])
    setShowWaitlistDialog(false)
  }

  const handleRemoveFromWaitlist = (id: string) => {
    setWaitlist(prev => prev.filter(entry => entry.id !== id))
  }

  const handleNotifyWaitlist = (id: string) => {
    setWaitlist(prev =>
      prev.map(entry =>
        entry.id === id
          ? { ...entry, notified: true, status: "notified" }
          : entry
      )
    )
    // In a real app, this would send an SMS
  }

  const handleSeatWaitlist = (id: string, tableId: string) => {
    const entry = waitlist.find(w => w.id === id)
    if (!entry) return

    setWaitlist(prev => prev.filter(w => w.id !== id))
    setTables(prevTables =>
      prevTables.map(table =>
        table.id === tableId
          ? {
              ...table,
              status: "occupied",
              guestName: entry.name,
              currentGuests: entry.partySize,
              waitlistId: id
            }
          : table
      )
    )
  }

  const handleCreateReservation = (reservation: Omit<Reservation, "id" | "createdAt" | "reminderSent">) => {
    const newReservation: Reservation = {
      ...reservation,
      id: `r${Date.now()}`,
      createdAt: new Date(),
      reminderSent: false
    }
    
    setReservations(prev => [...prev, newReservation])
    
    // If reserving for today and a table is available, assign it
    const today = new Date()
    const isToday = reservation.date.toDateString() === today.toDateString()
    
    if (isToday && reservation.tableId) {
      setTables(prevTables =>
        prevTables.map(table =>
          table.id === reservation.tableId
            ? {
                ...table,
                status: "reserved",
                guestName: reservation.name,
                reservationId: newReservation.id,
                eta: reservation.time
              }
            : table
        )
      )
    }
    
    setShowReservationDialog(false)
  }

  const handleCancelReservation = (id: string) => {
    setReservations(prev =>
      prev.map(res =>
        res.id === id ? { ...res, status: "cancelled" as const } : res
      )
    )
    
    // Free up the table if it was assigned
    setTables(prevTables =>
      prevTables.map(table =>
        table.reservationId === id
          ? {
              ...table,
              status: "open",
              guestName: undefined,
              reservationId: undefined,
              eta: undefined
            }
          : table
      )
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: "url('/images/bg-map.jpg')" }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/30 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      
      {/* Controls */}
      <div className="px-4 py-3 border-b border-border glass-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
              className={viewMode === "map" ? "bg-neon-pink text-primary-foreground glow-pink" : "border-border bg-transparent"}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Map
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-neon-pink text-primary-foreground glow-pink" : "border-border bg-transparent"}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGuestList(!showGuestList)}
              className="border-border bg-transparent"
            >
              <Users className="h-4 w-4 mr-1" />
              Guests
            </Button>
            <Button
              size="icon"
              variant={isVoiceActive ? "default" : "outline"}
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={isVoiceActive ? "bg-neon-cyan glow-cyan animate-pulse" : "border-border bg-transparent"}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-2 flex gap-4 text-xs border-b border-border/50 overflow-x-auto glass-card"
      >
        <StatChip label="Occupied" value="5/8" color="pink" icon={<Users className="h-3 w-3" />} />
        <StatChip label="Revenue" value={formatNumber(10600, { prefix: "$" })} color="green" icon={<DollarSign className="h-3 w-3" />} />
        <StatChip label="Capacity" value="38/56" color="cyan" icon={<Zap className="h-3 w-3" />} />
        <StatChip label="Pending" value="1" color="orange" icon={<Clock className="h-3 w-3" />} />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <MapView
              key="map"
              tables={tables}
              onSelectTable={(t) => {
                setSelectedTable(t)
                setPathTarget(t)
              }}
              selectedTable={selectedTable}
              showPath={showPath}
              pathTarget={pathTarget}
            />
          ) : (
            <ListView
              key="list"
              tables={tables}
              onSelectTable={setSelectedTable}
            />
          )}
        </AnimatePresence>

      {/* Guest List Overlay */}
      <AnimatePresence>
        {showGuestList && (
          <GuestListOverlay 
            onClose={() => setShowGuestList(false)}
            waitlist={waitlist}
            reservations={reservations.filter(r => r.status === "confirmed" && r.date.toDateString() === new Date().toDateString())}
            onAddWaitlist={() => {
              setShowGuestList(false)
              setShowWaitlistDialog(true)
            }}
            onAddReservation={() => {
              setShowGuestList(false)
              setShowReservationDialog(true)
            }}
          />
        )}
      </AnimatePresence>

        {/* Voice Command Overlay */}
        <AnimatePresence>
          {isVoiceActive && (
            <VoiceCommandOverlay onClose={() => setIsVoiceActive(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Table Detail Sheet */}
      <AnimatePresence>
        {selectedTable && (
          <TableDetailSheet
            table={selectedTable}
            onClose={() => setSelectedTable(null)}
            onAssignStaff={() => setShowAssignStaffDialog(true)}
            onUnassignStaff={handleUnassignStaff}
          />
        )}
      </AnimatePresence>

      {/* Assign Staff Dialog */}
      <AssignStaffDialog
        open={showAssignStaffDialog}
        onOpenChange={setShowAssignStaffDialog}
        onSelectStaff={handleAssignStaff}
        currentAssigned={selectedTable?.assignedTo}
      />

      {/* Waitlist Dialog */}
      <WaitlistDialog
        open={showWaitlistDialog}
        onOpenChange={setShowWaitlistDialog}
        onAdd={handleAddToWaitlist}
        waitlist={waitlist}
        onRemove={handleRemoveFromWaitlist}
        onNotify={handleNotifyWaitlist}
        onSeat={handleSeatWaitlist}
        availableTables={tables.filter(t => t.status === "open" || t.status === "reserved")}
      />

      {/* Reservation Dialog */}
      <ReservationDialog
        open={showReservationDialog}
        onOpenChange={setShowReservationDialog}
        onCreate={handleCreateReservation}
        reservations={reservations}
        onCancel={handleCancelReservation}
        availableTables={tables}
      />
    </div>
  )
}

function StatChip({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  const colors: Record<string, string> = {
    pink: "text-neon-pink bg-neon-pink/10 border-neon-pink/30",
    green: "text-neon-green bg-neon-green/10 border-neon-green/30",
    cyan: "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30",
    orange: "text-neon-orange bg-neon-orange/10 border-neon-orange/30",
  }
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full border ${colors[color]}`}
    >
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-bold">{value}</span>
    </motion.div>
  )
}

function MapView({ 
  tables, 
  onSelectTable,
  selectedTable,
  showPath,
  pathTarget
}: { 
  tables: Table[]
  onSelectTable: (t: Table) => void
  selectedTable: Table | null
  showPath: boolean
  pathTarget: Table | null
}) {

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full relative overflow-hidden"
    >
      {/* Background with subtle animation */}
      <motion.div
        className="absolute inset-0"
      />
      
      {/* Animated cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Pulsing ambient lights */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-neon-pink/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-neon-cyan/10 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      />

      {/* SVG Overlay for paths and decorations */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Dance Floor outline */}
        <motion.rect
          x="25"
          y="35"
          width="50"
          height="30"
          fill="none"
          stroke="url(#danceFloorGradient)"
          strokeWidth="0.3"
          rx="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2 }}
        />
        
        
        {/* Gradients and filters */}
        <defs>
          <linearGradient id="danceFloorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--neon-pink)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {/* Dance Floor Label */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div className="px-6 py-3 rounded-xl glass-card-strong neon-border">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-neon-pink" />
            </motion.div>
            <span className="text-sm text-foreground font-semibold tracking-wider">DANCE FLOOR</span>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-neon-cyan" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bar Label */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        style={{ left: `${barPos.x}%`, top: `${barPos.y}%` }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <div className="px-2 py-3 rounded-lg glass-card neon-border-cyan">
          <div className="flex flex-col items-center gap-2">
            <Wine className="h-4 w-4 text-neon-cyan animate-bounce-subtle" />
            <span className="text-xs text-neon-cyan uppercase tracking-wider font-semibold" style={{ writingMode: 'vertical-rl' }}>Bar</span>
          </div>
        </div>
      </motion.div>

      {/* Entrance Label */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2"
      >
        <div className="px-4 py-2 rounded-lg glass-card border border-neon-green/50">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Navigation className="h-4 w-4 text-neon-green" />
            </motion.div>
            <span className="text-xs text-neon-green uppercase tracking-wider font-semibold">Entrance</span>
          </div>
        </div>
      </motion.div>

      {/* Tables */}
      {tables.map((table, index) => (
        <motion.button
          key={table.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          whileHover={{ scale: 1.15, zIndex: 50 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectTable(table)}
          style={{ left: `${table.x}%`, top: `${table.y}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${statusColors[table.status].bg} ${statusColors[table.status].border} ${
            selectedTable?.id === table.id ? `scale-110 ${statusColors[table.status].glow}` : ""
          }`}
        >
          {/* Animated ring for selected */}
          {selectedTable?.id === table.id && (
            <motion.div
              className={`absolute -inset-2 rounded-xl border ${statusColors[table.status].border}`}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          
          <span className={`text-lg font-bold ${statusColors[table.status].text}`}>{table.number}</span>
          <span className="text-[10px] text-muted-foreground">
            {table.currentGuests}/{table.capacity}
          </span>
          
          {/* Over capacity warning */}
          {table.currentGuests > table.capacity && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <AlertTriangle className="h-5 w-5 text-destructive drop-shadow-lg" />
            </motion.div>
          )}
          
          {/* ETA badge for reserved */}
          {table.status === "reserved" && table.eta && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-2"
            >
              <Badge className="text-[8px] bg-neon-cyan text-background border-0 glow-cyan">
                {table.eta}
              </Badge>
            </motion.div>
          )}
          
          {/* Spend indicator */}
          {table.spend && table.spend > 3000 && (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -left-2"
            >
              <div className="w-5 h-5 rounded-full bg-neon-green flex items-center justify-center glow-green">
                <DollarSign className="h-3 w-3 text-background" />
              </div>
            </motion.div>
          )}
        </motion.button>
      ))}

      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute top-2 left-4 right-4 flex justify-center gap-3 flex-nowrap overflow-x-auto"
      >
        {Object.entries(statusLabels).map(([status, label]) => (
          <motion.div 
            key={status}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${statusColors[status as TableStatus].bg} border ${statusColors[status as TableStatus].border} ${
              status === 'open' ? 'hover:bg-neon-green/40 hover:border-neon-green' :
              status === 'occupied' ? 'hover:bg-neon-pink/40 hover:border-neon-pink' :
              status === 'pending' ? 'hover:bg-neon-orange/40 hover:border-neon-orange' :
              'hover:bg-neon-cyan/40 hover:border-neon-cyan'
            }`}
          >
            <span className={`text-[10px] ${statusColors[status as TableStatus].text} font-medium`}>{label}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

function ListView({ tables, onSelectTable }: { tables: Table[]; onSelectTable: (t: Table) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <div className="divide-y divide-border">
        {tables.map((table, index) => (
          <motion.button
            key={table.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ backgroundColor: "var(--muted)", x: 5 }}
            onClick={() => onSelectTable(table)}
            className="w-full flex items-center gap-4 px-4 py-4 transition-all text-left"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${statusColors[table.status].bg} ${statusColors[table.status].border}`}
            >
              <span className={`text-xl font-bold ${statusColors[table.status].text}`}>{table.number}</span>
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{table.guestName || "Available"}</span>
                {table.currentGuests > table.capacity && (
                  <Badge variant="destructive" className="text-[10px] animate-pulse">OVER</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {table.currentGuests}/{table.capacity}
                </span>
                {table.spend && (
                  <span className="flex items-center gap-1 text-neon-green">
                    <DollarSign className="h-3 w-3" />
                    {formatNumber(table.spend, { prefix: "$" })}
                  </span>
                )}
                {table.eta && (
                  <span className="flex items-center gap-1 text-neon-cyan">
                    <Clock className="h-3 w-3" />
                    {table.eta}
                  </span>
                )}
              </div>
            </div>
            <Badge className={`${statusColors[table.status].bg} ${statusColors[table.status].border} ${statusColors[table.status].text} border text-[10px]`}>
              {statusLabels[table.status]}
            </Badge>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

function TableDetailSheet({ 
  table, 
  onClose,
  onAssignStaff,
  onUnassignStaff
}: { 
  table: Table
  onClose: () => void
  onAssignStaff: () => void
  onUnassignStaff: () => void
}) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 glass-card-strong rounded-t-3xl border-t border-border p-5 max-h-[65%] overflow-y-auto"
    >
      {/* Drag handle */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-muted-foreground/30" />
      
      <div className="flex items-center justify-between mb-5 mt-2">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${statusColors[table.status].bg} ${statusColors[table.status].border} ${statusColors[table.status].glow}`}
          >
            <span className={`text-2xl font-bold ${statusColors[table.status].text}`}>{table.number}</span>
          </motion.div>
          <div>
            <h3 className="font-bold text-lg">{table.guestName || "Table " + table.number}</h3>
            <Badge className={`${statusColors[table.status].bg} ${statusColors[table.status].border} ${statusColors[table.status].text} border text-xs mt-1`}>
              {statusLabels[table.status]}
            </Badge>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="p-2 hover:bg-muted rounded-full"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-xl glass-card border border-border"
        >
          <Users className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">
            {table.currentGuests}/{table.capacity}
            {table.currentGuests > table.capacity && (
              <AlertTriangle className="inline h-4 w-4 text-destructive ml-1 animate-pulse" />
            )}
          </p>
          <p className="text-xs text-muted-foreground">Guests</p>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-xl glass-card border border-neon-green/30"
        >
          <DollarSign className="h-5 w-5 text-neon-green mb-2" />
          <p className="text-2xl font-bold text-neon-green">
            {formatNumber(table.spend || 0, { prefix: "$" })}
          </p>
          <p className="text-xs text-muted-foreground">Spend</p>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-xl glass-card border border-border"
        >
          <Clock className="h-5 w-5 text-neon-cyan mb-2" />
          <p className="text-2xl font-bold text-neon-cyan">{table.eta || "N/A"}</p>
          <p className="text-xs text-muted-foreground">ETA</p>
        </motion.div>
      </div>

      {/* Assigned Staff */}
      {table.assignedTo && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-4 rounded-xl glass-card border border-neon-pink/30 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <NeonAvatar
              src={availableStaff.find(s => s.name === table.assignedTo)?.avatar || "/images/avatars/man3.png"}
              fallback={table.assignedTo.split(" ").join("")}
              size="lg"
              glow="pink"
              status={availableStaff.find(s => s.name === table.assignedTo)?.isOnline ? "online" : undefined}
              showPulse
            />
            <div>
              <p className="font-semibold">{table.assignedTo}</p>
              <p className="text-xs text-muted-foreground">Assigned Promoter</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onUnassignStaff}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Unassign staff"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </motion.div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button className="bg-neon-pink hover:bg-neon-pink/90 text-primary-foreground glow-pink h-12">
          <Wine className="h-5 w-5 mr-2" />
          Add Order
        </Button>
        <Button 
          variant="outline" 
          className="border-neon-cyan/50 bg-transparent text-neon-cyan hover:bg-neon-cyan/10 h-12"
          onClick={onAssignStaff}
        >
          <UserPlus className="h-5 w-5 mr-2" />
          {table.assignedTo ? "Change Staff" : "Assign Staff"}
        </Button>
        <Button variant="outline" className="border-neon-green/50 bg-transparent text-neon-green hover:bg-neon-green/10 col-span-2 h-12">
          <CheckCircle className="h-5 w-5 mr-2" />
          Mark as Complete
        </Button>
      </div>
    </motion.div>
  )
}

function GuestListOverlay({ 
  onClose,
  waitlist,
  reservations,
  onAddWaitlist,
  onAddReservation
}: { 
  onClose: () => void
  waitlist: WaitlistEntry[]
  reservations: Reservation[]
  onAddWaitlist: () => void
  onAddReservation: () => void
}) {
  const activeWaitlist = waitlist.filter(w => w.status === "waiting" || w.status === "notified")
  const activeReservations = reservations.filter(r => r.status === "confirmed")
  const [focus, setFocus] = useState<"all" | "waitlist" | "reservations">("all")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 glass-card-strong z-20 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-neon-cyan" />
          Guest List
        </h3>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          onClick={onClose} 
          className="p-2 hover:bg-muted rounded-full"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 px-4 py-3 border-b border-border">
        <Button
          size="sm"
          onClick={onAddWaitlist}
          className="flex-1 bg-neon-orange/20 text-neon-orange border border-neon-orange/50 hover:bg-neon-orange/30"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add to Waitlist
        </Button>
        <Button
          size="sm"
          onClick={onAddReservation}
          className="flex-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30"
        >
          <Calendar className="h-4 w-4 mr-1" />
          New Reservation
        </Button>
      </div>

      {/* Focus Tabs */}
      <div className="flex gap-2 px-4 py-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFocus("waitlist")}
          className={
            focus === "waitlist"
              ? "bg-neon-orange/20 text-neon-orange border-neon-orange/50 glow-orange"
              : "bg-transparent text-muted-foreground border-border hover:text-foreground"
          }
        >
          <Clock className="h-4 w-4 mr-1" />
          Waitlist
          <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-neon-orange text-primary-foreground border-0">
            {activeWaitlist.length}
          </Badge>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFocus("reservations")}
          className={
            focus === "reservations"
              ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 glow-cyan"
              : "bg-transparent text-muted-foreground border-border hover:text-foreground"
          }
        >
          <Calendar className="h-4 w-4 mr-1" />
          Reservations
          <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-neon-cyan text-primary-foreground border-0">
            {activeReservations.length}
          </Badge>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFocus("all")}
          className={
            focus === "all"
              ? "bg-muted/60 text-foreground border-border"
              : "bg-transparent text-muted-foreground border-border hover:text-foreground"
          }
        >
          <Users className="h-4 w-4 mr-1" />
          All
        </Button>
      </div>

      {/* Waitlist Section */}
      {(focus === "waitlist" || focus === "all") && activeWaitlist.length > 0 && (
        <div className="px-4 py-2">
          <h4 className="text-sm font-semibold text-neon-orange mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Waitlist
          </h4>
          <div className="space-y-2">
            {activeWaitlist.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl glass-card border border-neon-orange/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <NeonAvatar
                      fallback={entry.name.split(" ").map(n => n[0]).join("")}
                      size="sm"
                      glow="orange"
                    />
                    <div>
                      <p className="font-semibold text-sm">{entry.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{entry.partySize} guests</span>
                        <span className="opacity-60">•</span>
                        <span className="tabular-nums">Est. {formatWaitRange(entry.estimatedWaitTime)}</span>
                        <span className="opacity-60">•</span>
                        <span className="tabular-nums">Ready ~{formatReadyAround(entry.estimatedWaitTime)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={entry.status === "notified" 
                    ? "bg-neon-green/20 text-neon-green border-neon-green/50" 
                    : "bg-neon-orange/20 text-neon-orange border-neon-orange/50"
                  }>
                    {entry.status === "notified" ? "Notified" : "Waiting"}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Reservations Section */}
      {(focus === "reservations" || focus === "all") && activeReservations.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <h4 className="text-sm font-semibold text-neon-cyan mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reservations
          </h4>
          <div className="space-y-2">
            {activeReservations.map((reservation, i) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl glass-card border border-neon-cyan/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <NeonAvatar
                      fallback={reservation.name.split(" ").map(n => n[0]).join("")}
                      size="sm"
                      glow="cyan"
                    />
                    <div>
                      <p className="font-semibold text-sm">{reservation.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{reservation.partySize} guests</span>
                        <span>•</span>
                        <span>{format(reservation.date, "MMM d")} at {reservation.time}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50">
                    Confirmed
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {((focus === "waitlist" && activeWaitlist.length === 0) ||
        (focus === "reservations" && activeReservations.length === 0) ||
        (focus === "all" && activeWaitlist.length === 0 && activeReservations.length === 0)) && (
        <div className="flex-1 flex items-center justify-center text-center py-12">
          <div>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {focus === "waitlist"
                ? "No one on the waitlist"
                : focus === "reservations"
                  ? "No reservations right now"
                  : "No active waitlist or reservations"}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function VoiceCommandOverlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 glass-card-strong z-20 flex flex-col items-center justify-center"
    >
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full"
      >
        <X className="h-5 w-5" />
      </motion.button>

      {/* Pulsing rings */}
      <div className="relative">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border-2 border-neon-cyan/30"
            style={{
              width: `${100 + ring * 40}px`,
              height: `${100 + ring * 40}px`,
              top: `${-ring * 20}px`,
              left: `${-ring * 20}px`,
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: ring * 0.3 }}
          />
        ))}
        
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center glow-cyan"
        >
          <Mic className="h-10 w-10 text-neon-cyan" />
        </motion.div>
      </div>

      <motion.h3 
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-2xl font-bold mt-8 mb-2 text-glow-cyan"
      >
        Listening...
      </motion.h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {"Try saying \"Add 2 bottles to Table 3\" or \"Show guest list\""}
      </p>

      {/* Audio visualizer */}
      <div className="mt-10 flex gap-1.5 items-end h-12">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-gradient-to-t from-neon-cyan to-neon-pink rounded-full"
            animate={{ 
              height: [10, 30 + Math.random() * 20, 10],
            }}
            transition={{ 
              duration: 0.4 + Math.random() * 0.3, 
              repeat: Infinity, 
              delay: i * 0.05 
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function AssignStaffDialog({
  open,
  onOpenChange,
  onSelectStaff,
  currentAssigned,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectStaff: (staffName: string) => void
  currentAssigned?: string
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStaff = availableStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card-strong border-border max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <UserPlus className="h-5 w-5 text-neon-cyan" />
            Assign Staff to Table
          </DialogTitle>
          <DialogDescription className="text-left">
            Select a staff member to assign to this table
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border rounded-xl"
          />
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No staff members found</p>
            </div>
          ) : (
            filteredStaff.map((staff, index) => (
              <motion.button
                key={staff.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectStaff(staff.name)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  currentAssigned === staff.name
                    ? "bg-neon-pink/20 border-neon-pink/50 glow-pink"
                    : "glass-card border-border hover:bg-muted"
                }`}
              >
                <NeonAvatar
                  src={staff.avatar}
                  fallback={staff.name.split(" ").map(n => n[0]).join("")}
                  size="md"
                  glow={staff.isOnline ? "green" : "cyan"}
                  status={staff.isOnline ? "online" : undefined}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{staff.name}</p>
                    {currentAssigned === staff.name && (
                      <Badge className="bg-neon-pink text-primary-foreground border-0 text-[10px] glow-pink">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{staff.role}</span>
                    <span className="flex items-center gap-1">
                      <Table className="h-3 w-3" />
                      {staff.tablesAssigned} table{staff.tablesAssigned !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {staff.isOnline && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-neon-green glow-green"
                  />
                )}
              </motion.button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function WaitlistDialog({
  open,
  onOpenChange,
  onAdd,
  waitlist,
  onRemove,
  onNotify,
  onSeat,
  availableTables
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (entry: Omit<WaitlistEntry, "id" | "addedAt" | "estimatedWaitTime" | "notified" | "status">) => void
  waitlist: WaitlistEntry[]
  onRemove: (id: string) => void
  onNotify: (id: string) => void
  onSeat: (waitlistId: string, tableId: string) => void
  availableTables: Table[]
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [partySize, setPartySize] = useState(2)
  const [notes, setNotes] = useState("")
  const activeWaitlist = waitlist.filter(w => w.status === "waiting" || w.status === "notified")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return
    
    onAdd({ name, phone, partySize, notes: notes || undefined })
    setName("")
    setPhone("")
    setPartySize(2)
    setNotes("")
    setShowAddForm(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card-strong border-border max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <Clock className="h-5 w-5 text-neon-orange" />
            Waitlist Management
          </DialogTitle>
          <DialogDescription className="text-left">
            Manage walk-in guests and notify them when tables are ready
          </DialogDescription>
        </DialogHeader>

        {!showAddForm ? (
          <>
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-neon-orange/20 text-neon-orange border border-neon-orange/50 hover:bg-neon-orange/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Waitlist
            </Button>

            <div className="flex-1 overflow-y-auto space-y-2 mt-4">
              {activeWaitlist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No one on waitlist</p>
                </div>
              ) : (
                activeWaitlist.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl glass-card border border-neon-orange/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <NeonAvatar
                          fallback={entry.name.split(" ").map(n => n[0]).join("")}
                          size="md"
                          glow="orange"
                        />
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{entry.phone}</span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onRemove(entry.id)}
                        className="p-1.5 hover:bg-destructive/20 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </motion.button>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm mb-2">
                      <span className="text-muted-foreground">{entry.partySize} guests</span>
                      <span className="text-neon-orange font-semibold tabular-nums">
                        Est. {formatWaitRange(entry.estimatedWaitTime)}
                      </span>
                      <Badge className={entry.status === "notified" 
                        ? "bg-neon-green/20 text-neon-green border-neon-green/50" 
                        : "bg-neon-orange/20 text-neon-orange border-neon-orange/50"
                      }>
                        {entry.status === "notified" ? "Notified" : "Waiting"}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="tabular-nums">
                        Ready ~<span className="text-foreground font-medium">{formatReadyAround(entry.estimatedWaitTime)}</span>
                      </span>
                      <span className="opacity-60">•</span>
                      <span>
                        Added {formatDistanceToNowStrict(entry.addedAt, { addSuffix: true })}
                      </span>
                    </p>

                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mb-3 italic">"{entry.notes}"</p>
                    )}

                    <div className="flex gap-2">
                      {!entry.notified && (
                        <Button
                          size="sm"
                          onClick={() => onNotify(entry.id)}
                          className="flex-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Send SMS
                        </Button>
                      )}
                      <Select onValueChange={(value) => onSeat(entry.id, value)}>
                        <SelectTrigger className="flex-1 border-border">
                          <SelectValue placeholder="Seat at table..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTables.map(table => (
                            <SelectItem key={table.id} value={table.id}>
                              Table {table.number} ({table.capacity} seats)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Guest Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter guest name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="partySize">Party Size</Label>
              <Input
                id="partySize"
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requests, VIP status, etc."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setName("")
                  setPhone("")
                  setPartySize(2)
                  setNotes("")
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-neon-orange hover:bg-neon-orange/90">
                Add to Waitlist
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReservationDialog({
  open,
  onOpenChange,
  onCreate,
  reservations,
  onCancel,
  availableTables
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (reservation: Omit<Reservation, "id" | "createdAt" | "reminderSent">) => void
  reservations: Reservation[]
  onCancel: (id: string) => void
  availableTables: Table[]
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [partySize, setPartySize] = useState(2)
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState("20:00")
  const [tableId, setTableId] = useState<string>("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const todayReservations = reservations.filter(
    r => r.status === "confirmed" && r.date.toDateString() === new Date().toDateString()
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return
    
    onCreate({
      name,
      phone,
      email: email || undefined,
      partySize,
      date,
      time,
      tableId: tableId || undefined,
      status: "confirmed",
      specialRequests: specialRequests || undefined
    })
    
    setName("")
    setPhone("")
    setEmail("")
    setPartySize(2)
    setDate(new Date())
    setTime("20:00")
    setTableId("")
    setSpecialRequests("")
    setShowAddForm(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card-strong border-border max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <Calendar className="h-5 w-5 text-neon-cyan" />
            Reservations
          </DialogTitle>
          <DialogDescription className="text-left">
            Manage table reservations and bookings
          </DialogDescription>
        </DialogHeader>

        {!showAddForm ? (
          <>
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>

            <div className="flex-1 overflow-y-auto space-y-2 mt-4">
              {todayReservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No reservations for today</p>
                </div>
              ) : (
                todayReservations.map((reservation, index) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl glass-card border border-neon-cyan/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <NeonAvatar
                          fallback={reservation.name.split(" ").map(n => n[0]).join("")}
                          size="md"
                          glow="cyan"
                        />
                        <div>
                          <p className="font-semibold">{reservation.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{reservation.phone}</span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onCancel(reservation.id)}
                        className="p-1.5 hover:bg-destructive/20 rounded-lg"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </motion.button>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.partySize} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(reservation.date, "MMM d, yyyy")} at {reservation.time}</span>
                      </div>
                      {reservation.tableId && (
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4 text-muted-foreground" />
                          <span>Table {availableTables.find(t => t.id === reservation.tableId)?.number || "TBD"}</span>
                        </div>
                      )}
                      {reservation.specialRequests && (
                        <p className="text-xs text-muted-foreground italic mt-2">"{reservation.specialRequests}"</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="res-name">Guest Name</Label>
              <Input
                id="res-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter guest name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="res-phone">Phone Number</Label>
              <Input
                id="res-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="res-email">Email (Optional)</Label>
              <Input
                id="res-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@example.com"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="res-partySize">Party Size</Label>
                <Input
                  id="res-partySize"
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="res-time">Time</Label>
                <Input
                  id="res-time"
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
                    variant="outline"
                    className="w-full mt-1 justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate)
                        setDatePickerOpen(false)
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="res-table">Table (Optional)</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select table..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific table</SelectItem>
                  {availableTables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.number} ({table.capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="res-requests">Special Requests (Optional)</Label>
              <Textarea
                id="res-requests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Dietary restrictions, celebration, etc."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setName("")
                  setPhone("")
                  setEmail("")
                  setPartySize(2)
                  setDate(new Date())
                  setTime("20:00")
                  setTableId("")
                  setSpecialRequests("")
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-neon-cyan hover:bg-neon-cyan/90">
                Create Reservation
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
