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
  const { data: goalRow, error } = await supabase
    .from("revenue_goals")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .eq("goal_date", dateStr)
    .single()

  if (error && error.code !== "PGRST116") {
    res.status(500).json({ error: error.message })
    return
  }
  const goalAmount = goalRow ? Number(goalRow.goal_amount) : 10000
  const comparisonPrevious = goalRow?.comparison_previous_amount != null ? Number(goalRow.comparison_previous_amount) : null
  const comparisonLabel = goalRow?.comparison_label ?? "vs last Saturday"

  // Current revenue = sum of (spend + pending_spend) from map_tables so add-bottle reflects immediately
  const { data: tables, error: tablesError } = await supabase
    .from("map_tables")
    .select("spend, pending_spend")
    .eq("venue_id", VENUE_ID)
  if (tablesError) {
    res.status(500).json({ error: tablesError.message })
    return
  }
  let currentAmount = 0
  for (const row of tables ?? []) {
    const spend = typeof row.spend === "number" && !Number.isNaN(Number(row.spend)) ? Number(row.spend) : 0
    const pending = typeof row.pending_spend === "number" && !Number.isNaN(Number(row.pending_spend)) ? Number(row.pending_spend) : 0
    currentAmount += spend + pending
  }

  const changeRate =
    comparisonPrevious != null && comparisonPrevious > 0
      ? ((currentAmount - comparisonPrevious) / comparisonPrevious) * 100
      : 0

  res.json({
    goalDate: dateStr,
    goalAmount,
    currentAmount: Math.round(currentAmount),
    remainingToGoal: Math.max(0, goalAmount - currentAmount),
    comparisonLabel,
    changeRate: Math.round(changeRate * 100) / 100,
    comparisonPreviousAmount: comparisonPrevious ?? undefined,
  })
})

router.get("/quick-stats", requireOps, async (_req, res) => {
  const now = new Date()

  const { data: tables, error: tablesError } = await supabase
    .from("map_tables")
    .select("status, current_guests, spend, pending_spend, created_at")
    .eq("venue_id", VENUE_ID)

  if (tablesError) {
    res.status(500).json({ error: tablesError.message })
    return
  }

  let totalGuests = 0
  let totalSpend = 0
  let occupiedCount = 0
  let tablesSold = 0
  let totalStayMinutes = 0

  for (const row of tables ?? []) {
    const guests =
      typeof row.current_guests === "number" && !Number.isNaN(row.current_guests)
        ? row.current_guests
        : 0
    const spend =
      typeof row.spend === "number" && !Number.isNaN(Number(row.spend))
        ? Number(row.spend)
        : 0
    const pending =
      typeof row.pending_spend === "number" && !Number.isNaN(Number(row.pending_spend))
        ? Number(row.pending_spend)
        : 0

    totalGuests += guests
    totalSpend += spend + pending

    if (row.status === "occupied" || row.status === "booked") {
      occupiedCount += 1
      tablesSold += 1

      if (row.created_at) {
        const createdAt = new Date(row.created_at)
        if (!Number.isNaN(createdAt.getTime())) {
          const diffMinutes = Math.max(
            0,
            (now.getTime() - createdAt.getTime()) / 60000
          )
          totalStayMinutes += diffMinutes
        }
      }
    }
  }

  const avgStayMinutes =
    occupiedCount > 0 ? totalStayMinutes / occupiedCount : 0
  const avgSpendPerGuest =
    totalGuests > 0 ? totalSpend / totalGuests : 0

  let bottlesSold = 0
  const { data: bottles, error: bottlesError } = await supabase
    .from("bottles")
    .select("price")

  if (!bottlesError && bottles && bottles.length > 0) {
    const prices = bottles
      .map((b) =>
        typeof b.price === "number" && !Number.isNaN(Number(b.price))
          ? Number(b.price)
          : null
      )
      .filter((v) => v != null)

    if (prices.length > 0) {
      const avgBottlePrice =
        prices.reduce((sum, v) => sum + (v ?? 0), 0) / prices.length
      if (avgBottlePrice > 0) {
        bottlesSold = Math.round(totalSpend / avgBottlePrice)
      }
    }
  }

  res.json({
    totalGuests,
    tablesSold,
    bottlesSold,
    avgStayMinutes: Math.round(avgStayMinutes * 10) / 10,
    avgSpendPerGuest: Math.round(avgSpendPerGuest),
    totalSpend,
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
