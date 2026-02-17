import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canViewLiveFeed, canManageLiveFeed } from "../services/permissions.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireViewFeed = requirePermission(canViewLiveFeed)
const requireManageFeed = requirePermission(canManageLiveFeed)

const FeedItemSchema = z.object({
  type: z.enum(["order", "arrival", "alert", "geo"]),
  title: z.string(),
  description: z.string(),
  time: z.string(),
  table: z.number().optional(),
  avatar: z.string().optional(),
})

const UpdateFeedItemSchema = FeedItemSchema.partial()

function toFeedItem(r) {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    time: r.time,
    table: r.table ?? undefined,
    avatar: r.avatar ?? undefined,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : undefined,
  }
}

router.get("/", requireViewFeed, async (req, res) => {
  const { data, error } = await supabase
    .from("live_feed_items")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ feedItems: (data ?? []).map(toFeedItem) })
})

router.post("/", requireManageFeed, async (req, res) => {
  const parsed = FeedItemSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const { data, error } = await supabase
    .from("live_feed_items")
    .insert({
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      time: parsed.data.time,
      table: parsed.data.table ?? null,
      avatar: parsed.data.avatar ?? null,
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json(toFeedItem(data))
})

router.patch("/:id", requireManageFeed, async (req, res) => {
  const parsed = UpdateFeedItemSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const updates = {}
  if (p.type != null) { updates.type = p.type }
  if (p.title != null) { updates.title = p.title }
  if (p.description != null) { updates.description = p.description }
  if (p.time != null) { updates.time = p.time }
  if (p.table != null) { updates.table = p.table }
  if (p.avatar != null) { updates.avatar = p.avatar }
  const { data, error } = await supabase
    .from("live_feed_items")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.json(toFeedItem(data))
})

router.delete("/clear", requireManageFeed, async (_req, res) => {
  const { error } = await supabase.from("live_feed_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

router.delete("/:id", requireManageFeed, async (req, res) => {
  const { error } = await supabase.from("live_feed_items").delete().eq("id", req.params.id)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
