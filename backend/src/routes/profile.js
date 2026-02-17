import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)

const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  picture: z.string().optional(),
  mode: z.enum(["pro", "user"]).optional(),
  pro_role: z.enum(["promoter", "door", "manager", "owner"]).optional(),
  settings_account: z.record(z.unknown()).optional(),
  settings_notifications: z.record(z.unknown()).optional(),
  settings_privacy: z.record(z.unknown()).optional(),
  settings_club: z.record(z.unknown()).optional(),
})

router.get("/", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.json({
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    picture: data.picture,
    mode: data.mode,
    pro_role: data.pro_role,
    settings_account: data.settings_account ?? undefined,
    settings_notifications: data.settings_notifications ?? undefined,
    settings_privacy: data.settings_privacy ?? undefined,
    settings_club: data.settings_club ?? undefined,
  })
})

router.patch("/", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const parsed = UpdateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const updates = {}
  if (p.name != null) updates.name = p.name
  if (p.email != null) updates.email = p.email
  if (p.phone != null) updates.phone = p.phone
  if (p.picture != null) updates.picture = p.picture
  if (p.mode != null) updates.mode = p.mode
  if (p.pro_role != null) updates.pro_role = p.pro_role
  if (p.settings_account != null) updates.settings_account = p.settings_account
  if (p.settings_notifications != null) updates.settings_notifications = p.settings_notifications
  if (p.settings_privacy != null) updates.settings_privacy = p.settings_privacy
  if (p.settings_club != null) updates.settings_club = p.settings_club
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    picture: data.picture,
    mode: data.mode,
    pro_role: data.pro_role,
    settings_account: data.settings_account ?? undefined,
    settings_notifications: data.settings_notifications ?? undefined,
    settings_privacy: data.settings_privacy ?? undefined,
    settings_club: data.settings_club ?? undefined,
  })
})

export default router
