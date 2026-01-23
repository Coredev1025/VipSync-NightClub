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
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NeonAvatar } from "@/components/ui/neon-avatar"

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
}

interface PathPoint {
  x: number
  y: number
}

const mockTables: Table[] = [
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
const barPos = { x: 88, y: 45 }

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

export function MapTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showGuestList, setShowGuestList] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [showPath, setShowPath] = useState(true)
  const [pathTarget, setPathTarget] = useState<Table | null>(mockTables[2]) // Default path to reserved table

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
      <div className="px-4 py-3 flex items-center justify-between border-b border-border glass-card">
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
            onClick={() => setShowPath(!showPath)}
            className={`border-border bg-transparent ${showPath ? "text-neon-cyan" : ""}`}
          >
            {showPath ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            Path
          </Button>
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

      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-2 flex gap-4 text-xs border-b border-border/50 overflow-x-auto glass-card"
      >
        <StatChip label="Occupied" value="5/8" color="pink" icon={<Users className="h-3 w-3" />} />
        <StatChip label="Revenue" value="$10,600" color="green" icon={<DollarSign className="h-3 w-3" />} />
        <StatChip label="Capacity" value="38/56" color="cyan" icon={<Zap className="h-3 w-3" />} />
        <StatChip label="Pending" value="1" color="orange" icon={<Clock className="h-3 w-3" />} />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <MapView
              key="map"
              tables={mockTables}
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
              tables={mockTables}
              onSelectTable={setSelectedTable}
            />
          )}
        </AnimatePresence>

        {/* Guest List Overlay */}
        <AnimatePresence>
          {showGuestList && (
            <GuestListOverlay onClose={() => setShowGuestList(false)} />
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
          />
        )}
      </AnimatePresence>
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
        className="absolute right-3 top-[45%] -translate-y-1/2"
      >
        <div className="px-3 py-2 rounded-lg glass-card neon-border-cyan">
          <div className="flex items-center gap-2">
            <Wine className="h-4 w-4 text-neon-cyan animate-bounce-subtle" />
            <span className="text-xs text-neon-cyan uppercase tracking-wider font-semibold">Bar</span>
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
        className="absolute bottom-16 left-4 right-4 flex justify-center gap-3 flex-wrap"
      >
        {Object.entries(statusLabels).map(([status, label]) => (
          <motion.div 
            key={status} 
            whileHover={{ scale: 1.1 }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusColors[status as TableStatus].bg} border ${statusColors[status as TableStatus].border}`}
          >
            <div className={`w-2 h-2 rounded-full ${statusColors[status as TableStatus].border} border-2`} />
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
                    {table.spend.toLocaleString()}
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

function TableDetailSheet({ table, onClose }: { table: Table; onClose: () => void }) {
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
            ${table.spend?.toLocaleString() || 0}
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
          className="mb-5 p-4 rounded-xl glass-card border border-neon-pink/30 flex items-center gap-4"
        >
          <NeonAvatar
            src="/images/avatars/man3.png"
            fallback={table.assignedTo.split(" ").map(n => n[0]).join("")}
            size="lg"
            glow="pink"
            status="online"
            showPulse
          />
          <div>
            <p className="font-semibold">{table.assignedTo}</p>
            <p className="text-xs text-muted-foreground">Assigned Promoter</p>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button className="bg-neon-pink hover:bg-neon-pink/90 text-primary-foreground glow-pink h-12">
          <Wine className="h-5 w-5 mr-2" />
          Add Order
        </Button>
        <Button variant="outline" className="border-neon-cyan/50 bg-transparent text-neon-cyan hover:bg-neon-cyan/10 h-12">
          <UserPlus className="h-5 w-5 mr-2" />
          Assign Staff
        </Button>
        <Button variant="outline" className="border-neon-green/50 bg-transparent text-neon-green hover:bg-neon-green/10 col-span-2 h-12">
          <CheckCircle className="h-5 w-5 mr-2" />
          Mark as Complete
        </Button>
      </div>
    </motion.div>
  )
}

function GuestListOverlay({ onClose }: { onClose: () => void }) {
  const guests = [
    { name: "Marcus Chen", status: "inside" as const, tableNum: 1 },
    { name: "Elite Group", status: "inside" as const, tableNum: 2 },
    { name: "Williams Party", status: "expected" as const, eta: "30 min" },
    { name: "VIP Incoming", status: "expected" as const, eta: "15 min" },
    { name: "Johnson Party", status: "inside" as const, tableNum: 5 },
  ]

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

      <div className="flex gap-2 px-4 py-3">
        <Badge className="bg-neon-green/20 text-neon-green border-neon-green/50 glow-green">Inside: 3</Badge>
        <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 glow-cyan">Expected: 2</Badge>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {guests.map((guest, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ backgroundColor: "var(--muted)", x: 5 }}
            className="flex items-center justify-between px-4 py-4 transition-all"
          >
            <div className="flex items-center gap-3">
              <NeonAvatar
                src={i === 0 ? "/images/avatars/man4.png" : i === 1 ? "/images/avatars/man5.png" : i === 2 ? "/images/avatars/man6.png" : i === 3 ? "/images/avatars/man7.png" : "/images/avatars/man8.png"}
                fallback={guest.name.split(" ").map(n => n[0]).join("")}
                size="md"
                glow={guest.status === "inside" ? "green" : "cyan"}
                status={guest.status === "inside" ? "online" : "away"}
              />
              <div>
                <p className="font-semibold">{guest.name}</p>
                {guest.tableNum && (
                  <p className="text-xs text-muted-foreground">Table {guest.tableNum}</p>
                )}
                {guest.eta && (
                  <p className="text-xs text-neon-cyan">ETA: {guest.eta}</p>
                )}
              </div>
            </div>
            <Badge className={guest.status === "inside" 
              ? "bg-neon-green/20 text-neon-green border-neon-green/50" 
              : "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50"
            }>
              {guest.status === "inside" ? "Inside" : "Expected"}
            </Badge>
          </motion.div>
        ))}
      </div>
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
