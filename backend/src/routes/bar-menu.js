import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const VENUE_ID = "default"

function rowToBarItem(r) {
  return {
    id: r.id,
    title: r.item_name,
    desc: r.description ?? undefined,
    price: r.price,
    limitedOffer: r.limited_offer ?? false,
    limitedDateStart: r.limited_date_start ?? undefined,
    limitedDate: r.limited_date ?? undefined,
    discountOffer: r.discount_offer ?? false,
    discountPrice: r.discount_price ?? undefined,
    discountTimeLimitStart: r.discount_time_limit_start ?? undefined,
    discountTimeLimit: r.discount_time_limit ?? undefined,
  }
}

const BarItemSchema = z.object({
  title: z.string(),
  desc: z.string().optional(),
  price: z.string(),
  limitedOffer: z.boolean().optional(),
  limitedDateStart: z.string().optional(),
  limitedDate: z.string().optional(),
  discountOffer: z.boolean().optional(),
  discountPrice: z.string().optional(),
  discountTimeLimitStart: z.string().optional(),
  discountTimeLimit: z.string().optional(),
})

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("bar_drink_items")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ items: (data ?? []).map(rowToBarItem) })
})

router.post("/", async (req, res) => {
  const parsed = BarItemSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const { data, error } = await supabase
    .from("bar_drink_items")
    .insert({
      venue_id: VENUE_ID,
      item_name: p.title,
      description: p.desc ?? null,
      price: p.price,
      limited_offer: p.limitedOffer ?? false,
      limited_date_start: p.limitedDateStart || null,
      limited_date: p.limitedDate || null,
      discount_offer: p.discountOffer ?? false,
      discount_price: p.discountPrice ?? null,
      discount_time_limit_start: p.discountTimeLimitStart || null,
      discount_time_limit: p.discountTimeLimit || null,
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json(rowToBarItem(data))
})

router.patch("/:id", async (req, res) => {
  const parsed = BarItemSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const updates = { updated_at: new Date().toISOString() }
  if (p.title != null) updates.item_name = p.title
  if (p.desc !== undefined) updates.description = p.desc ?? null
  if (p.price != null) updates.price = p.price
  if (p.limitedOffer !== undefined) updates.limited_offer = p.limitedOffer
  if (p.limitedDateStart !== undefined) updates.limited_date_start = p.limitedDateStart || null
  if (p.limitedDate !== undefined) updates.limited_date = p.limitedDate || null
  if (p.discountOffer !== undefined) updates.discount_offer = p.discountOffer
  if (p.discountPrice !== undefined) updates.discount_price = p.discountPrice ?? null
  if (p.discountTimeLimitStart !== undefined) updates.discount_time_limit_start = p.discountTimeLimitStart || null
  if (p.discountTimeLimit !== undefined) updates.discount_time_limit = p.discountTimeLimit || null

  const { data, error } = await supabase
    .from("bar_drink_items")
    .update(updates)
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.json(rowToBarItem(data))
})

router.delete("/:id", async (req, res) => {
  const { error } = await supabase
    .from("bar_drink_items")
    .delete()
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
