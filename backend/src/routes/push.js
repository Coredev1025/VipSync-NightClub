import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canSendPush } from "../services/permissions.js"
import { sendToTokens, isFcmConfigured } from "../services/fcm.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireSendPush = requirePermission(canSendPush)

const RegisterSchema = z.object({
  token: z.string().min(1, "token is required"),
  platform: z.enum(["android", "ios"]).optional(),
})

/**
 * POST /api/push/register
 * Register FCM device token for the current user.
 * Body: { token: string, platform?: 'android' | 'ios' }
 */
router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message ?? "Invalid body"
    res.status(400).json({ error: msg })
    return
  }
  const { token, platform } = parsed.data
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        user_id: userId,
        token: token.trim(),
        platform: platform ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" }
    )

  if (error) {
    console.warn("[Push] Register token failed:", error.message)
    res.status(500).json({ error: "Failed to register token" })
    return
  }

  res.status(204).send()
})

const SendAllSchema = z.object({
  title: z.string().min(1, "title is required"),
  body: z.string().optional(),
  data: z.record(z.string()).optional(),
})

/**
 * POST /api/push/send-all
 * Send push notification to all registered users. Manager/Owner only.
 * Body: { title: string, body?: string, data?: Record<string, string> }
 */
router.post("/send-all", requireSendPush, async (req, res) => {
  const parsed = SendAllSchema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message ?? "Invalid body"
    res.status(400).json({ error: msg })
    return
  }
  const { title, body, data } = parsed.data

  if (!isFcmConfigured()) {
    res.status(503).json({
      error: "FCM not configured",
      hint: "Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS in backend .env",
    })
    return
  }

  const { data: rows, error } = await supabase
    .from("push_tokens")
    .select("token, platform")

  if (error) {
    res.status(500).json({ error: "Failed to fetch tokens" })
    return
  }

  // Prefer Android FCM tokens; iOS APNs tokens may not work with firebase-admin
  const tokens = (rows ?? [])
    .map((r) => r.token)
    .filter((t) => t && typeof t === "string")

  if (tokens.length === 0) {
    res.json({ successCount: 0, failureCount: 0, message: "No registered devices" })
    return
  }

  const result = await sendToTokens(tokens, { title, body, data })

  res.json({
    successCount: result.successCount,
    failureCount: result.failureCount,
    totalDevices: tokens.length,
  })
})

export default router
