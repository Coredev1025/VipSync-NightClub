import { Router } from "express"
import { jwtVerify, createRemoteJWKSet } from "jose"
import { supabase } from "../supabase.js"
import { signToken } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ""

let supabaseJwks = null
function getSupabaseJwks() {
  if (!supabaseJwks && SUPABASE_URL) {
    supabaseJwks = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  }
  return supabaseJwks
}

router.get("/config", (_req, res) => {
  res.json({
    providers: {
      google: Boolean(GOOGLE_CLIENT_ID),
    },
    redirectUrlHint: "vipsyncappmobile://auth/callback",
  })
})

const SupabaseBodySchema = z.object({
  access_token: z.string().min(1, "access_token is required"),
  mode: z.enum(["pro", "user"]).optional(),
  proRole: z.enum(["promoter", "door", "manager", "owner", "guest"]).optional(),
  pro_role: z.enum(["promoter", "door", "manager", "owner", "guest"]).optional(),
})

router.post("/supabase", async (req, res) => {
  console.log("[Auth] POST /api/auth/supabase — token exchange")
  const parsed = SupabaseBodySchema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message ?? "access_token required"
    res.status(400).json({ error: msg })
    return
  }
  let { access_token, mode: bodyMode, proRole: bodyProRole, pro_role: bodyProRoleSnake } = parsed.data
  access_token = typeof access_token === "string" ? access_token.trim() : ""
  if (!access_token) {
    res.status(400).json({ error: "access_token required" })
    return
  }
  const bodyProRoleResolved = bodyProRole ?? bodyProRoleSnake
  console.log("[Auth] Received token from frontend (length:", access_token.length, ")")
  if (!SUPABASE_URL) {
    res.status(503).json({
      error: "SUPABASE_URL not configured",
      hint: "Add SUPABASE_URL to backend .env (used to verify Supabase Auth JWTs via JWKS).",
    })
    return
  }
  let decoded
  try {
    const { payload } = await jwtVerify(access_token, getSupabaseJwks())
    decoded = payload
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth] Supabase token verify failed:", err?.message ?? err)
    }
    res.status(401).json({
      error: "Invalid or expired Supabase token",
      hint: "Supabase Auth uses ES256 signing; backend verifies via JWKS at SUPABASE_URL/auth/v1/.well-known/jwks.json",
    })
    return
  }
  if (!decoded?.sub) {
    res.status(401).json({ error: "Invalid Supabase token payload" })
    return
  }
  // Supabase JWT: email at top level; name/picture often in user_metadata (OAuth/magic link)
  const userMeta = decoded.user_metadata ?? {}
  const email = decoded.email ?? userMeta.email ?? undefined
  const name = decoded.name ?? userMeta.name ?? userMeta.full_name ?? undefined
  const picture = decoded.picture ?? userMeta.picture ?? userMeta.avatar_url ?? userMeta.image ?? undefined
  console.log("[Auth] Token verified for user:", decoded.sub, "email:", email ?? "(none)")
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, mode, pro_role")
    .eq("id", decoded.sub)
    .single()

  const mode = (bodyMode ?? existing?.mode) ?? "pro"
  const proRole = (bodyProRoleResolved ?? existing?.pro_role) ?? "promoter"

  const profileRow = {
    email,
    name,
    picture,
    mode,
    pro_role: proRole,
    updated_at: new Date().toISOString(),
  }
  if (existing) {
    const { error: updateErr } = await supabase
      .from("profiles")
      .update(profileRow)
      .eq("id", decoded.sub)
    if (updateErr) {
      console.warn("[Auth] Profile update failed:", updateErr.message)
      res.status(500).json({ error: "Profile update failed", hint: updateErr.message })
      return
    }
  } else {
    const { error: insertErr } = await supabase.from("profiles").insert({
      id: decoded.sub,
      ...profileRow,
    })
    if (insertErr) {
      console.warn("[Auth] Profile insert failed:", insertErr.message)
      res.status(500).json({ error: "Profile insert failed", hint: insertErr.message })
      return
    }
  }
  const jwtPayload = {
    sub: decoded.sub,
    email,
    name,
    picture,
    mode,
    proRole,
  }
  const backendToken = signToken(jwtPayload)
  console.log("[Auth] Google sign-in successful — user:", decoded.sub, "email:", email ?? "(none)", "mode:", mode)
  res.json({ user: { id: decoded.sub, email, name, picture, mode, proRole }, accessToken: backendToken })
})

export default router
