import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canEditMapTables } from "../services/permissions.js"
import { getProRoleFromPayload } from "../services/permissions.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireEditMap = requirePermission(canEditMapTables)
const VENUE_ID = "default"

const VipBiddingSchema = z.object({
  type: z.literal("bidding"),
  name: z.string().min(1),
  capacity: z.number().int().min(1).default(6),
  currentBid: z.number().min(0).optional(),
  leader: z.string().optional(),
  nextBidAmount: z.number().min(0).optional(),
})
const VipBookingSchema = z.object({
  type: z.literal("booking"),
  name: z.string().min(1),
  capacity: z.number().int().min(1).default(6),
  minSpend: z.number().min(0).optional(),
  description: z.string().optional(),
})
const CreateVipSchema = z.union([
  VipBiddingSchema.extend({ mapTableId: z.string().uuid().optional() }),
  VipBookingSchema.extend({ mapTableId: z.string().uuid().optional() }),
])

const UpdateVipBiddingSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  currentBid: z.number().min(0).optional(),
  leader: z.string().optional(),
  nextBidAmount: z.number().min(0).optional(),
})
const UpdateVipBookingSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  minSpend: z.number().min(0).optional(),
  description: z.string().optional(),
})

function vipRowToJson(r) {
  const base = {
    id: r.id,
    type: r.type,
    name: r.name,
    capacity: r.capacity ?? 6,
    mapTableId: r.map_table_id ?? undefined,
  }
  if (r.type === "bidding") {
    return {
      ...base,
      currentBid: r.current_bid != null ? Number(r.current_bid) : 0,
      leader: r.leader ?? undefined,
      nextBidAmount: r.next_bid_amount != null ? Number(r.next_bid_amount) : 0,
    }
  }
  return {
    ...base,
    minSpend: r.min_spend != null ? Number(r.min_spend) : 0,
    description: r.description ?? undefined,
  }
}

/** List VIP tables (manager) – optionally filter by mapTableId. */
router.get("/", requireEditMap, async (req, res) => {
  let q = supabase.from("vip_tables").select("*").eq("venue_id", VENUE_ID).order("sort_order", { ascending: true })
  const mapTableId = req.query.mapTableId
  if (mapTableId) q = q.eq("map_table_id", mapTableId)
  const { data, error } = await q
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ vipTables: (data ?? []).map(vipRowToJson) })
})

/** Create VIP table (bidding or booking). If mapTableId omitted, create a new map_tables row and link it. */
router.post("/", requireEditMap, async (req, res) => {
  const parsed = CreateVipSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() })
    return
  }
  const { mapTableId: providedMapId, ...rest } = parsed.data
  let mapTableId = providedMapId

  if (!mapTableId) {
    const { data: maxRow } = await supabase
      .from("map_tables")
      .select("number")
      .eq("venue_id", VENUE_ID)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextNumber = (maxRow?.number ?? 0) + 1
    const now = new Date().toISOString()
    const { data: newMap, error: insertMapErr } = await supabase
      .from("map_tables")
      .insert({
        venue_id: VENUE_ID,
        number: nextNumber,
        x: 0,
        y: 0,
        status: "open",
        capacity: rest.capacity ?? 6,
        current_guests: 0,
        is_vip: true,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single()
    if (insertMapErr || !newMap?.id) {
      res.status(500).json({ error: insertMapErr?.message ?? "Failed to create map table" })
      return
    }
    mapTableId = newMap.id
  } else {
    const { data: existing } = await supabase.from("map_tables").select("id").eq("id", mapTableId).eq("venue_id", VENUE_ID).single()
    if (!existing) {
      res.status(400).json({ error: "Map table not found" })
      return
    }
  }

  const now = new Date().toISOString()
  const { data: maxSort } = await supabase
    .from("vip_tables")
    .select("sort_order")
    .eq("venue_id", VENUE_ID)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = (maxSort?.sort_order ?? 0) + 1

  const insertRow = {
    venue_id: VENUE_ID,
    map_table_id: mapTableId,
    type: rest.type,
    name: rest.name,
    capacity: rest.capacity ?? 6,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  }
  if (rest.type === "bidding") {
    insertRow.current_bid = rest.currentBid ?? 0
    insertRow.leader = rest.leader ?? null
    insertRow.next_bid_amount = rest.nextBidAmount ?? (Number(rest.currentBid ?? 0) + 50)
  } else {
    insertRow.min_spend = rest.minSpend ?? 0
    insertRow.description = rest.description ?? null
  }

  const { data: created, error } = await supabase.from("vip_tables").insert(insertRow).select("*").single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  if (mapTableId && !providedMapId) {
    await supabase.from("map_tables").update({ is_vip: true, updated_at: now }).eq("id", mapTableId).eq("venue_id", VENUE_ID)
  }
  res.status(201).json(vipRowToJson(created))
})

/** Update VIP table (manager). */
router.patch("/:id", requireEditMap, async (req, res) => {
  const { data: existing, error: fetchErr } = await supabase
    .from("vip_tables")
    .select("type")
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .single()
  if (fetchErr || !existing) {
    res.status(404).json({ error: "VIP table not found" })
    return
  }
  const Schema = existing.type === "bidding" ? UpdateVipBiddingSchema : UpdateVipBookingSchema
  const parsed = Schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() })
    return
  }
  const updates = { updated_at: new Date().toISOString() }
  const fieldMap = {
    name: "name",
    capacity: "capacity",
    currentBid: "current_bid",
    leader: "leader",
    nextBidAmount: "next_bid_amount",
    minSpend: "min_spend",
    description: "description",
  }
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined && fieldMap[k]) updates[fieldMap[k]] = v
  }
  const { data: updated, error } = await supabase
    .from("vip_tables")
    .update(updates)
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .select("*")
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json(vipRowToJson(updated))
})

/** Delete VIP table (manager). Unlinks from map_tables; does not delete the map_tables row. */
router.delete("/:id", requireEditMap, async (req, res) => {
  const { data: row, error: fetchErr } = await supabase
    .from("vip_tables")
    .select("map_table_id")
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .single()
  if (fetchErr || !row) {
    res.status(404).json({ error: "VIP table not found" })
    return
  }
  const { error } = await supabase.from("vip_tables").delete().eq("id", req.params.id).eq("venue_id", VENUE_ID)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  if (row.map_table_id) {
    await supabase
      .from("map_tables")
      .update({ is_vip: false, updated_at: new Date().toISOString() })
      .eq("id", row.map_table_id)
      .eq("venue_id", VENUE_ID)
  }
  res.status(204).send()
})

export default router
