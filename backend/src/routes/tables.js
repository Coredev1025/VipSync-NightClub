import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canEditMapTables, canEditTableGirl } from "../services/permissions.js"
import { getProRoleFromPayload } from "../services/permissions.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireEditMap = requirePermission(canEditMapTables)

const TableStatus = z.enum(["open", "occupied", "booked", "pending"])
const TableSchema = z.object({
  number: z.number(),
  x: z.number(),
  y: z.number(),
  status: TableStatus,
  capacity: z.number(),
  currentGuests: z.number().optional(),
  guestName: z.string().optional(),
  spend: z.number().optional(),
  pendingSpend: z.number().optional(),
  itemsSummary: z.string().optional(),
  primaryStaff: z.string().optional(),
  backupStaff: z.string().optional(),
  assignedTo: z.string().optional(),
  promoter: z.string().optional(),
  server: z.string().optional(),
  eta: z.string().optional(),
  guestAvatarKey: z.string().optional(),
  promoterAvatarKey: z.string().optional(),
  bottleGirlAvatarKey: z.string().optional(),
  isVip: z.boolean().optional(),
  isDjBooth: z.boolean().optional(),
  djSetTime: z.string().optional(),
})

const VENUE_ID = "default"

function rowToTable(r) {
  return {
    id: r.id,
    number: r.number,
    x: r.x,
    y: r.y,
    status: r.status,
    capacity: r.capacity,
    currentGuests: r.current_guests ?? 0,
    guestName: r.guest_name ?? undefined,
    spend: r.spend ?? undefined,
    pendingSpend: r.pending_spend ?? undefined,
    itemsSummary: r.items_summary ?? undefined,
    primaryStaff: r.primary_staff ?? undefined,
    backupStaff: r.backup_staff ?? undefined,
    assignedTo: r.assigned_to ?? undefined,
    promoter: r.promoter ?? undefined,
    server: r.server ?? undefined,
    eta: r.eta ?? undefined,
    guestAvatarKey: r.guest_avatar_key ?? undefined,
    promoterAvatarKey: r.promoter_avatar_key ?? undefined,
    bottleGirlAvatarKey: r.bottle_girl_avatar_key ?? undefined,
    isVip: r.is_vip ?? undefined,
    isDjBooth: r.is_dj_booth ?? undefined,
    djSetTime: r.dj_set_time ?? undefined,
  }
}

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("map_tables").select("*").eq("venue_id", VENUE_ID)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ tables: (data ?? []).map(rowToTable) })
})

router.post("/", requireEditMap, async (req, res) => {
  const parsed = TableSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const { data, error } = await supabase
    .from("map_tables")
    .insert({
      venue_id: VENUE_ID,
      number: p.number,
      x: p.x,
      y: p.y,
      status: p.status,
      capacity: p.capacity,
      current_guests: p.currentGuests ?? 0,
      guest_name: p.guestName ?? null,
      spend: p.spend ?? null,
      pending_spend: p.pendingSpend ?? null,
      items_summary: p.itemsSummary ?? null,
      primary_staff: p.primaryStaff ?? null,
      backup_staff: p.backupStaff ?? null,
      assigned_to: p.assignedTo ?? null,
      promoter: p.promoter ?? null,
      server: p.server ?? null,
      eta: p.eta ?? null,
      guest_avatar_key: p.guestAvatarKey ?? null,
      promoter_avatar_key: p.promoterAvatarKey ?? null,
      bottle_girl_avatar_key: p.bottleGirlAvatarKey ?? null,
      is_vip: p.isVip ?? null,
      is_dj_booth: p.isDjBooth ?? null,
      dj_set_time: p.djSetTime ?? null,
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json(rowToTable(data))
})

router.patch("/:id", requireEditMap, async (req, res) => {
  const parsed = TableSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const role = getProRoleFromPayload(req.user?.proRole)
  const p = parsed.data
  if (!canEditTableGirl(role) && (p.bottleGirlAvatarKey !== undefined || p.assignedTo !== undefined)) {
    res.status(403).json({ error: "Forbidden: cannot edit table girl / assigned_to" })
    return
  }
  const updates = {}
  const map = {
    number: "number",
    x: "x",
    y: "y",
    status: "status",
    capacity: "capacity",
    currentGuests: "current_guests",
    guestName: "guest_name",
    spend: "spend",
    pendingSpend: "pending_spend",
    itemsSummary: "items_summary",
    primaryStaff: "primary_staff",
    backupStaff: "backup_staff",
    assignedTo: "assigned_to",
    promoter: "promoter",
    server: "server",
    eta: "eta",
    guestAvatarKey: "guest_avatar_key",
    promoterAvatarKey: "promoter_avatar_key",
    bottleGirlAvatarKey: "bottle_girl_avatar_key",
    isVip: "is_vip",
    isDjBooth: "is_dj_booth",
    djSetTime: "dj_set_time",
  }
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && map[k]) updates[map[k]] = v
  }
  const { data, error } = await supabase
    .from("map_tables")
    .update(updates)
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.json(rowToTable(data))
})

router.delete("/:id", requireEditMap, async (req, res) => {
  const { error } = await supabase.from("map_tables").delete().eq("id", req.params.id).eq("venue_id", VENUE_ID)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
