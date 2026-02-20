import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canManageVibeEvents } from "../services/permissions.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)
const requireManageVibeEvents = requirePermission(canManageVibeEvents)

const VibeSchema = z.object({
  djName: z.string(),
  djStatus: z.enum(["ON DECKS", "OFF DECKS", "SCHEDULED", "BREAK"]),
  genres: z.string(),
  djInitials: z.string(),
  scheduledTime: z.string().optional(),
})

const VibeEventSchema = z.object({
  djName: z.string(),
  date: z.string(),
  time: z.string(),
  genres: z.string(),
  status: z.enum(["upcoming", "live"]),
})

const VENUE_ID = "default"

function computeInitials(name) {
  if (!name) return "DJ"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

async function setCurrentVibeFromEvent(eventRow) {
  const initials = computeInitials(eventRow.dj_name)
  const { error } = await supabase
    .from("vibe")
    .upsert(
      {
        venue_id: VENUE_ID,
        dj_name: eventRow.dj_name,
        dj_status: "ON DECKS",
        genres: eventRow.genres,
        dj_initials: initials,
        scheduled_time: null,
        current_event_id: eventRow.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "venue_id" }
    )
  if (error) {
    throw error
  }
}

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("vibe").select("*").eq("venue_id", VENUE_ID).maybeSingle()
  if (error && error.code !== "PGRST116") {
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.json({
      djName: "DJ KHALED",
      djStatus: "ON DECKS",
      genres: "Deep House • Techno",
      djInitials: "DK",
      scheduledTime: undefined,
    })
    return
  }
  let currentEvent = null
  if (data.current_event_id) {
    const { data: ev, error: evError } = await supabase
      .from("vibe_events")
      .select("*")
      .eq("id", data.current_event_id)
      .eq("venue_id", VENUE_ID)
      .maybeSingle()
    if (!evError && ev) {
      currentEvent = ev
    }
  }
  const base = {
    djName: data.dj_name,
    djStatus: data.dj_status,
    genres: data.genres,
    djInitials: data.dj_initials,
    scheduledTime: data.scheduled_time ?? undefined,
  }
  if (currentEvent) {
    base.djName = currentEvent.dj_name
    base.genres = currentEvent.genres
  }
  res.json(base)
})

router.patch("/", async (req, res) => {
  const parsed = VibeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const { error } = await supabase
    .from("vibe")
    .upsert(
      {
        venue_id: VENUE_ID,
        dj_name: parsed.data.djName,
        dj_status: parsed.data.djStatus,
        genres: parsed.data.genres,
        dj_initials: parsed.data.djInitials,
        scheduled_time: parsed.data.scheduledTime ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "venue_id" }
    )
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ ok: true })
})

router.get("/events", async (req, res) => {
  const { data, error } = await supabase
    .from("vibe_events")
    .select("*")
    .eq("venue_id", VENUE_ID)
    .order("created_at", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  const events = (data ?? []).map((r) => ({
    id: r.id,
    djName: r.dj_name,
    date: r.date,
    time: r.time,
    genres: r.genres,
    status: r.status,
  }))
  res.json({ events })
})

router.post("/events", requireManageVibeEvents, async (req, res) => {
  const parsed = VibeEventSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const { data, error } = await supabase
    .from("vibe_events")
    .insert({
      venue_id: VENUE_ID,
      dj_name: parsed.data.djName,
      date: parsed.data.date,
      time: parsed.data.time,
      genres: parsed.data.genres,
      status: parsed.data.status,
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  if (data && data.status === "live") {
    try {
      await setCurrentVibeFromEvent(data)
    } catch (e) {
      console.error("Failed to set current vibe from new event", e)
    }
  }
  res.status(201).json({
    id: data.id,
    djName: data.dj_name,
    date: data.date,
    time: data.time,
    genres: data.genres,
    status: data.status,
  })
})

router.patch("/events/:id", requireManageVibeEvents, async (req, res) => {
  const parsed = VibeEventSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const updates = {}
  if (parsed.data.djName != null) updates.dj_name = parsed.data.djName
  if (parsed.data.date != null) updates.date = parsed.data.date
  if (parsed.data.time != null) updates.time = parsed.data.time
  if (parsed.data.genres != null) updates.genres = parsed.data.genres
  if (parsed.data.status != null) updates.status = parsed.data.status
  const { data, error } = await supabase
    .from("vibe_events")
    .update(updates)
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  if (data) {
    if (data.status === "live") {
      try {
        await setCurrentVibeFromEvent(data)
      } catch (e) {
        console.error("Failed to set current vibe from updated event", e)
      }
    } else {
      try {
        await supabase
          .from("vibe")
          .update({ current_event_id: null, updated_at: new Date().toISOString() })
          .eq("venue_id", VENUE_ID)
          .eq("current_event_id", data.id)
      } catch (e) {
        console.error("Failed to clear current_event_id on vibe", e)
      }
    }
  }
  res.json({
    id: data.id,
    djName: data.dj_name,
    date: data.date,
    time: data.time,
    genres: data.genres,
    status: data.status,
  })
})

router.delete("/events/:id", requireManageVibeEvents, async (req, res) => {
  const { error } = await supabase
    .from("vibe_events")
    .delete()
    .eq("id", req.params.id)
    .eq("venue_id", VENUE_ID)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
