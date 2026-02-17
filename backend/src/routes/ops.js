import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canAccessOps } from "../services/permissions.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireOps = requirePermission(canAccessOps)

const VENUE_ID = "default"

router.get("/revenue", requireOps, async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from("revenue_goals")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .eq("goal_date", dateStr)
    .single()

  if (error && error.code !== "PGRST116") {
    res.status(500).json({ error: error.message })
    return
  }
  const goalAmount = data ? Number(data.goal_amount) : 10000
  const currentAmount = data ? Number(data.current_amount) : 0
  const comparisonPrevious = data?.comparison_previous_amount != null ? Number(data.comparison_previous_amount) : null
  const comparisonLabel = data?.comparison_label ?? "vs last Saturday"
  const changeRate =
    comparisonPrevious != null && comparisonPrevious > 0
      ? ((currentAmount - comparisonPrevious) / comparisonPrevious) * 100
      : 0

  res.json({
    goalDate: dateStr,
    goalAmount,
    currentAmount,
    remainingToGoal: Math.max(0, goalAmount - currentAmount),
    comparisonLabel,
    changeRate: Math.round(changeRate * 100) / 100,
    comparisonPreviousAmount: comparisonPrevious ?? undefined,
  })
})

const UpdateRevenueSchema = z.object({
  date: z.string().optional(),
  goalAmount: z.number().optional(),
  currentAmount: z.number().optional(),
  comparisonPreviousAmount: z.number().optional(),
  comparisonLabel: z.string().optional(),
})

router.patch("/revenue", requireOps, async (req, res) => {
  const parsed = UpdateRevenueSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const dateStr = parsed.data.date ?? new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase
    .from("revenue_goals")
    .select("goal_amount, current_amount, comparison_previous_amount, comparison_label")
    .eq("venue_id", VENUE_ID)
    .eq("goal_date", dateStr)
    .single()

  const updates = {
    venue_id: VENUE_ID,
    goal_date: dateStr,
    goal_amount: parsed.data.goalAmount ?? (existing ? Number(existing.goal_amount) : 10000),
    current_amount: parsed.data.currentAmount ?? (existing ? Number(existing.current_amount) : 0),
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.comparisonPreviousAmount != null)
    updates.comparison_previous_amount = parsed.data.comparisonPreviousAmount
  else if (existing?.comparison_previous_amount != null)
    updates.comparison_previous_amount = existing.comparison_previous_amount
  if (parsed.data.comparisonLabel != null) updates.comparison_label = parsed.data.comparisonLabel
  else if (existing?.comparison_label != null) updates.comparison_label = existing.comparison_label

  const { data, error } = await supabase
    .from("revenue_goals")
    .upsert(updates, { onConflict: "venue_id,goal_date" })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({
    goalDate: data.goal_date,
    goalAmount: Number(data.goal_amount),
    currentAmount: Number(data.current_amount),
    remainingToGoal: Math.max(0, Number(data.goal_amount) - Number(data.current_amount)),
    comparisonLabel: data.comparison_label ?? undefined,
    changeRate:
      data.comparison_previous_amount != null && Number(data.comparison_previous_amount) > 0
        ? Math.round(
            ((Number(data.current_amount) - Number(data.comparison_previous_amount)) /
              Number(data.comparison_previous_amount)) *
              10000
          ) / 100
        : 0,
  })
})

export default router
