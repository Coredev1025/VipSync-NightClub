import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canManageBottlesAndStock } from "../services/permissions.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireManageBottles = requirePermission(canManageBottlesAndStock)

const CreateBottleSchema = z.object({
  name: z.string().min(1),
  price: z.number(),
  stock: z.number(),
  imageKey: z.string().optional(),
  imageUri: z.string().optional(),
})

const UpdateBottleSchema = CreateBottleSchema.partial()

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("bottles").select("*").order("created_at", { ascending: false })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  const bottles = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    stock: r.stock,
    createdAt: r.created_at,
    imageKey: r.image_key ?? undefined,
    imageUri: r.image_uri ?? undefined,
  }))
  res.json({ bottles })
})

router.post("/", requireManageBottles, async (req, res) => {
  const parsed = CreateBottleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() })
    return
  }
  const { data, error } = await supabase
    .from("bottles")
    .insert({
      name: parsed.data.name,
      price: parsed.data.price,
      stock: parsed.data.stock,
      image_key: parsed.data.imageKey ?? null,
      image_uri: parsed.data.imageUri ?? null,
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
    price: data.price,
    stock: data.stock,
    createdAt: data.created_at,
    imageKey: data.image_key ?? undefined,
    imageUri: data.image_uri ?? undefined,
  })
})

router.patch("/:id", requireManageBottles, async (req, res) => {
  const parsed = UpdateBottleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const updates = {}
  if (parsed.data.name != null) updates.name = parsed.data.name
  if (parsed.data.price != null) updates.price = parsed.data.price
  if (parsed.data.stock != null) updates.stock = parsed.data.stock
  if (parsed.data.imageKey != null) updates.image_key = parsed.data.imageKey
  if (parsed.data.imageUri != null) updates.image_uri = parsed.data.imageUri
  const { data, error } = await supabase.from("bottles").update(updates).eq("id", req.params.id).select().single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.json({
    id: data.id,
    name: data.name,
    price: data.price,
    stock: data.stock,
    createdAt: data.created_at,
    imageKey: data.image_key ?? undefined,
    imageUri: data.image_uri ?? undefined,
  })
})

router.delete("/:id", requireManageBottles, async (req, res) => {
  const { error } = await supabase.from("bottles").delete().eq("id", req.params.id)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
