import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)

const CreateContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  status: z.string().optional(),
})
const UpdateContactSchema = CreateContactSchema.partial()

function rowToContact(r) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    avatar: r.avatar ?? undefined,
    status: r.status ?? "active",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

router.get("/", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("owner_id", userId)
    .order("name", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ contacts: (data ?? []).map(rowToContact) })
})

router.post("/", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const parsed = CreateContactSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      owner_id: userId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      avatar: parsed.data.avatar ?? null,
      status: parsed.data.status ?? "active",
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json(rowToContact(data))
})

router.patch("/:id", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const parsed = UpdateContactSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const updates = { updated_at: new Date().toISOString() }
  if (parsed.data.name != null) updates.name = parsed.data.name
  if (parsed.data.phone != null) updates.phone = parsed.data.phone
  if (parsed.data.avatar != null) updates.avatar = parsed.data.avatar
  if (parsed.data.status != null) updates.status = parsed.data.status

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", req.params.id)
    .eq("owner_id", userId)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.json(rowToContact(data))
})

router.delete("/:id", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", req.params.id)
    .eq("owner_id", userId)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
