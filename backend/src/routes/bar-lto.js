import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const VENUE_ID = "default"

const CreateLtoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  menuItems: z.array(z.unknown()).optional(),
})
const UpdateLtoSchema = CreateLtoSchema.partial()

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("bar_lto")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .order("start_date", { ascending: false })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  const now = new Date().toISOString().slice(0, 10)
  res.json({
    items: (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      startDate: r.start_date,
      endDate: r.end_date,
      menuItems: r.menu_items ?? [],
      active: r.start_date <= now && r.end_date >= now,
    })),
  })
})

router.post("/", async (req, res) => {
  const parsed = CreateLtoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const { data, error } = await supabase
    .from("bar_lto")
    .insert({
      venue_id: VENUE_ID,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      menu_items: parsed.data.menuItems ?? [],
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json({
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    startDate: data.start_date,
    endDate: data.end_date,
    menuItems: data.menu_items ?? [],
  })
})

router.patch("/:id", async (req, res) => {
  const parsed = UpdateLtoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const updates = { updated_at: new Date().toISOString() }
  if (parsed.data.name != null) updates.name = parsed.data.name
  if (parsed.data.description != null) updates.description = parsed.data.description
  if (parsed.data.startDate != null) updates.start_date = parsed.data.startDate
  if (parsed.data.endDate != null) updates.end_date = parsed.data.endDate
  if (parsed.data.menuItems != null) updates.menu_items = parsed.data.menuItems

  const { data, error } = await supabase
    .from("bar_lto")
    .update(updates)
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.json({
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    startDate: data.start_date,
    endDate: data.end_date,
    menuItems: data.menu_items ?? [],
  })
})

router.delete("/:id", async (req, res) => {
  const { error } = await supabase
    .from("bar_lto")
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
