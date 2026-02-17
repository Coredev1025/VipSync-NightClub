import { Router } from "express"
import jwt from "jsonwebtoken"
import { supabase } from "../supabase.js"
import { signToken } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? ""

const SupabaseBodySchema = z.object({
  access_token: z.string().min(1),
  mode: z.enum(["pro", "user"]).optional(),
  proRole: z.enum(["promoter", "door", "manager", "owner"]).optional(),
})

/** Exchange Supabase session JWT for backend JWT. Used by app after Supabase OAuth sign-in. */
router.post("/supabase", async (req, res) => {
  console.log("[Auth] POST /supabase — token exchange request received")
  const parsed = SupabaseBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "access_token required" })
    return
  }
  let { access_token, mode: bodyMode, proRole: bodyProRole } = parsed.data
  access_token = typeof access_token === "string" ? access_token.trim() : ""
  if (!access_token) {
    res.status(400).json({ error: "access_token required" })
    return
  }
  console.log("[Auth] Received token from frontend (length:", access_token.length, ")")
  if (!SUPABASE_JWT_SECRET) {
    res.status(503).json({ error: "SUPABASE_JWT_SECRET not configured" })
    return
  }
  let decoded
  try {
    decoded = jwt.verify(access_token, SUPABASE_JWT_SECRET, { algorithms: ["HS256"] })
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth] Supabase token verify failed:", err?.message ?? err)
    }
    res.status(401).json({
      error: "Invalid or expired Supabase token",
      hint: "Ensure backend .env SUPABASE_JWT_SECRET matches Supabase Dashboard → Project Settings → API → JWT Secret (not the anon key).",
    })
    return
  }
  if (!decoded?.sub) {
    res.status(401).json({ error: "Invalid Supabase token payload" })
    return
  }
  // Supabase JWT: email at top level; name/picture often in user_metadata (e.g. Google OAuth)
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
  const proRole = (bodyProRole ?? existing?.pro_role) ?? "promoter"

  if (existing) {
    await supabase
      .from("profiles")
      .update({
        email,
        name,
        picture,
        mode,
        pro_role: proRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", decoded.sub)
  } else {
    await supabase.from("profiles").insert({
      id: decoded.sub,
      email,
      name,
      picture,
      mode,
      pro_role: proRole,
    })
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
  res.json({ user: { id: decoded.sub, email, name, picture, mode, proRole }, accessToken: backendToken })
})

export default router
