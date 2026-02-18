import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const VENUE_ID = "default"

async function syncTableServiceLtoFromRow(row) {
  try {
    const limitedOffer = row.limited_offer
    const start = row.limited_date_start
    const end = row.limited_date

    // If no LTO configured, ensure any corresponding LTO row is removed.
    if (!limitedOffer || (!start && !end)) {
      await supabase
        .from("table_service_lto")
        .delete()
        .eq("id", row.id)
        .eq("venue_id", VENUE_ID)
      return
    }

    const startDate = start || end
    const endDate = end || start

    const menuItems = [
      {
        tableItemId: row.id,
        title: row.item_name,
        price: row.price,
        capacity: row.capacity,
        desc: row.description,
      },
    ]

    const { error } = await supabase
      .from("table_service_lto")
      .upsert(
        {
          id: row.id,
          venue_id: VENUE_ID,
          name: row.item_name,
          description: row.description,
          start_date: startDate,
          end_date: endDate,
          menu_items: menuItems,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    if (error) {
      console.error("Failed to sync table_service_lto from table_service_items", error.message)
    }
  } catch (err) {
    console.error("Failed to sync table_service_lto from table_service_items", err)
  }
}

function rowToTableItem(r) {
  return {
    id: r.id,
    title: r.item_name,
    price: r.price,
    capacity: r.capacity ?? undefined,
    desc: r.description ?? undefined,
    limitedOffer: r.limited_offer ?? false,
    limitedDateStart: r.limited_date_start ?? undefined,
    limitedDate: r.limited_date ?? undefined,
    discountOffer: r.discount_offer ?? false,
    discountPrice: r.discount_price ?? undefined,
    discountTimeLimitStart: r.discount_time_limit_start ?? undefined,
    discountTimeLimit: r.discount_time_limit ?? undefined,
  }
}

const TableItemSchema = z.object({
  title: z.string(),
  price: z.string(),
  capacity: z.string().optional(),
  desc: z.string().optional(),
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
    .from("table_service_items")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ items: (data ?? []).map(rowToTableItem) })
})

router.post("/", async (req, res) => {
  const parsed = TableItemSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const { data, error } = await supabase
    .from("table_service_items")
    .insert({
      venue_id: VENUE_ID,
      item_name: p.title,
      price: p.price,
      capacity: p.capacity ?? null,
      description: p.desc ?? null,
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
  // Keep table_service_lto in sync when this item is an LTO.
  await syncTableServiceLtoFromRow(data)
  res.status(201).json(rowToTableItem(data))
})

router.patch("/:id", async (req, res) => {
  const parsed = TableItemSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const updates = { updated_at: new Date().toISOString() }
  if (p.title != null) updates.item_name = p.title
  if (p.price != null) updates.price = p.price
  if (p.capacity !== undefined) updates.capacity = p.capacity ?? null
  if (p.desc !== undefined) updates.description = p.desc ?? null
  if (p.limitedOffer !== undefined) updates.limited_offer = p.limitedOffer
  if (p.limitedDateStart !== undefined) updates.limited_date_start = p.limitedDateStart || null
  if (p.limitedDate !== undefined) updates.limited_date = p.limitedDate || null
  if (p.discountOffer !== undefined) updates.discount_offer = p.discountOffer
  if (p.discountPrice !== undefined) updates.discount_price = p.discountPrice ?? null
  if (p.discountTimeLimitStart !== undefined) updates.discount_time_limit_start = p.discountTimeLimitStart || null
  if (p.discountTimeLimit !== undefined) updates.discount_time_limit = p.discountTimeLimit || null

  const { data, error } = await supabase
    .from("table_service_items")
    .update(updates)
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  // Sync or clear any associated LTO row based on updated values.
  await syncTableServiceLtoFromRow(data)
  res.json(rowToTableItem(data))
})

router.delete("/:id", async (req, res) => {
  const { error } = await supabase
    .from("table_service_items")
    .delete()
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  // Remove any matching LTO row for this table item.
  await supabase.from("table_service_lto").delete().eq("id", req.params.id).eq("venue_id", VENUE_ID)
  res.status(204).send()
})

export default router
