import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canManageClubSettings } from "../services/permissions.js"
import { sendToTokens } from "../services/fcm.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireManageClub = requirePermission(canManageClubSettings)

const RegisterTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.string().optional(),
})

router.post("/register", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const parsed = RegisterTokenSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Token required" })
    return
  }
  const { data, error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        user_id: userId,
        token: parsed.data.token,
        platform: parsed.data.platform ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" }
    )
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json({ ok: true, id: data.id })
})

const SendToAllSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  data: z.record(z.string()).optional(),
})

router.post("/send-all", requireManageClub, async (req, res) => {
  const parsed = SendToAllSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Title required" })
    return
  }
  const { data: rows } = await supabase.from("push_tokens").select("token")
  const tokens = (rows ?? []).map((r) => r.token).filter(Boolean)
  const { sent, failed } = await sendToTokens(
    tokens,
    parsed.data.title,
    parsed.data.body ?? "",
    parsed.data.data
  )
  res.json({ ok: true, sent, failed, total: tokens.length })
})

export default router
