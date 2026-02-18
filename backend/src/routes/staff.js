import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"

const router = Router()
router.use(authMiddleware)

const VENUE_ID = "default"

/** GET /api/staff?role=promoter|bottle_girl
 * Returns list of staff for dropdowns. Promoters from profiles; bottle girls from venue_staff.
 */
router.get("/", async (req, res) => {
  const role = req.query.role
  if (role === "promoter") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("pro_role", "promoter")
      .not("name", "is", null)
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    const list = (data ?? []).map((r) => ({
      id: r.id,
      name: (r.name || "").trim() || "Unnamed",
      role: "promoter",
      avatar: "",
      isOnline: false,
      tablesAssigned: 0,
    }))
    return res.json({ staff: list })
  }
  if (role === "bottle_girl") {
    const { data, error } = await supabase
      .from("venue_staff")
      .select("id, name")
      .eq("venue_id", VENUE_ID)
      .eq("role", "bottle_girl")
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    const list = (data ?? []).map((r) => ({
      id: r.id,
      name: (r.name || "").trim() || "Unnamed",
      role: "bottle girl",
      avatar: "",
      isOnline: false,
      tablesAssigned: 0,
    }))
    return res.json({ staff: list })
  }
  res.status(400).json({ error: "Query role must be 'promoter' or 'bottle_girl'" })
})

export default router
