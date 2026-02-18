import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const VENUE_ID = "default"

router.get("/featured-tables", async (_req, res) => {
  const { data, error } = await supabase
    .from("featured_tables")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .order("sort_order", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({
    tables: (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      seats: r.seats,
      minSpend: Number(r.min_spend),
      tag: r.tag ?? undefined,
    })),
  })
})

router.get("/vip-tables", async (_req, res) => {
  const { data, error } = await supabase
    .from("vip_tables")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .order("sort_order", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  const bidding = (data ?? [])
    .filter((r) => r.type === "bidding")
    .map((r) => ({
      id: r.id,
      type: "bidding",
      name: r.name,
      capacity: r.capacity,
      currentBid: r.current_bid != null ? Number(r.current_bid) : 0,
      leader: r.leader ?? undefined,
      nextBidAmount: r.next_bid_amount != null ? Number(r.next_bid_amount) : 0,
    }))
  const booking = (data ?? [])
    .filter((r) => r.type === "booking")
    .map((r) => ({
      id: r.id,
      type: "booking",
      name: r.name,
      capacity: r.capacity,
      description: r.description ?? undefined,
      minSpend: r.min_spend != null ? Number(r.min_spend) : 0,
    }))
  res.json({ bidding, booking })
})

const PlaceBidSchema = z.object({ amount: z.number().positive() })
router.post("/vip-tables/:id/bid", async (req, res) => {
  const parsed = PlaceBidSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid amount" })
    return
  }
  const { data: row } = await supabase
    .from("vip_tables")
    .select("current_bid, next_bid_amount, leader")
    .eq("id", req.params.id)
    .eq("type", "bidding")
    .single()
  if (!row) {
    res.status(404).json({ error: "VIP table not found" })
    return
  }
  const amount = parsed.data.amount
  const currentBid = Number(row.current_bid ?? 0)
  if (amount <= currentBid) {
    res.status(400).json({ error: "Bid must be higher than current bid" })
    return
  }
  const leaderName = req.user?.name ?? req.user?.sub ?? "Guest"
  const nextBid = amount + 50
  const { error } = await supabase
    .from("vip_tables")
    .update({
      current_bid: amount,
      leader: leaderName,
      next_bid_amount: nextBid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.params.id)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ ok: true, newBid: amount, leader: leaderName, nextBidAmount: nextBid })
})

/** Book a booking-type VIP table: sets linked map_table to status=booked so Table sold reflects in pro mode. */
router.post("/vip-tables/:id/book", async (req, res) => {
  const { data: vipRow, error: fetchErr } = await supabase
    .from("vip_tables")
    .select("id, type, map_table_id")
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .single()
  if (fetchErr || !vipRow) {
    res.status(404).json({ error: "VIP table not found" })
    return
  }
  if (vipRow.type !== "booking") {
    res.status(400).json({ error: "Table is not available for booking" })
    return
  }
  const mapTableId = vipRow.map_table_id
  if (!mapTableId) {
    res.status(400).json({ error: "Table not linked to floor plan" })
    return
  }
  const guestName = (req.body && req.body.guestName) || req.user?.name || req.user?.sub || "Guest"
  const { error: updateErr } = await supabase
    .from("map_tables")
    .update({
      status: "booked",
      guest_name: guestName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mapTableId)
    .eq("venue_id", VENUE_ID)
  if (updateErr) {
    res.status(500).json({ error: updateErr.message })
    return
  }
  res.json({ ok: true, message: "Table booked" })
})

router.get("/events", async (_req, res) => {
  const { data, error } = await supabase
    .from("vibe_events")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .order("date", { ascending: true })
    .order("time", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({
    events: (data ?? []).map((r) => ({
      id: r.id,
      title: r.dj_name,
      date: r.date,
      time: r.time,
      venue: "Main Floor",
      tag: r.status === "live" ? "LIVE" : "UPCOMING",
    })),
  })
})

const FollowSchema = z.object({ entityType: z.string(), entityId: z.string() })
router.get("/follows", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { data, error } = await supabase
    .from("guest_follows")
    .select("entity_type, entity_id")
    .eq("profile_id", userId)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  const follows = (data ?? []).reduce((acc, r) => {
    const key = `${r.entity_type}:${r.entity_id}`
    acc[key] = true
    return acc
  }, {})
  res.json({ follows })
})

router.post("/follows", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const parsed = FollowSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "entityType and entityId required" })
    return
  }
  const { error } = await supabase.from("guest_follows").insert({
    profile_id: userId,
    entity_type: parsed.data.entityType,
    entity_id: parsed.data.entityId,
  })
  if (error) {
    if (error.code === "23505") return res.status(201).json({ ok: true, followed: true })
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json({ ok: true, followed: true })
})

router.delete("/follows/:entityType/:entityId", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { error } = await supabase
    .from("guest_follows")
    .delete()
    .eq("profile_id", userId)
    .eq("entity_type", req.params.entityType)
    .eq("entity_id", req.params.entityId)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
