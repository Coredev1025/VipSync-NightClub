import { Router } from "express"
import { supabase } from "../supabase.js"
import { authMiddleware } from "../middleware/auth.js"
import { z } from "zod"

const router = Router()
router.use(authMiddleware)

const CreateChatSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  isGroup: z.boolean().optional(),
  memberIds: z.array(z.string()).optional(),
})

const UpdateChatSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  isGroup: z.boolean().optional(),
})

const SendMessageSchema = z.object({
  msg: z.string().min(1),
  me: z.boolean().optional(),
  sender: z.string().optional(),
  role: z.string().optional(),
})

const UpdateMessageSchema = z.object({
  msg: z.string().min(1).optional(),
  me: z.boolean().optional(),
  sender: z.string().optional(),
  role: z.string().optional(),
})

function chatRowToItem(r, lastMessage, unread = 0) {
  return {
    id: r.id,
    name: r.name ?? "Chat",
    avatar: r.avatar ?? undefined,
    phone: r.phone ?? undefined,
    lastMessage: lastMessage?.msg ?? "",
    time: lastMessage?.time ?? new Date().toISOString(),
    unread,
    isGroup: r.is_group ?? false,
    seen: unread === 0,
  }
}

router.get("/", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { data: chats, error: chatsErr } = await supabase
    .from("chats")
    .select("id, name, avatar, phone, is_group, created_at")
    .order("updated_at", { ascending: false })
  if (chatsErr) {
    res.status(500).json({ error: chatsErr.message })
    return
  }
  const result = []
  for (const c of chats ?? []) {
    const { data: last } = await supabase
      .from("chat_messages")
      .select("msg, created_at")
      .eq("chat_id", c.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    result.push(
      chatRowToItem(
        { ...c, is_group: c.is_group },
        last ? { msg: last.msg, time: last.created_at } : undefined,
        0
      )
    )
  }
  res.json({ chats: result })
})

router.post("/", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const parsed = CreateChatSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const { data, error } = await supabase
    .from("chats")
    .insert({
      name: parsed.data.name,
      avatar: parsed.data.avatar ?? null,
      phone: parsed.data.phone ?? null,
      is_group: parsed.data.isGroup ?? false,
      created_by: userId,
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json(chatRowToItem(data))
})

router.get("/:id/messages", async (req, res) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, msg, created_at, me, sender, role")
    .eq("chat_id", req.params.id)
    .order("created_at", { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  const messages = (data ?? []).map((r) => ({
    id: r.id,
    msg: r.msg,
    time: r.created_at,
    me: r.me ?? false,
    sender: r.sender ?? undefined,
    role: r.role ?? undefined,
  }))
  res.json({ messages })
})

router.post("/:id/messages", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const parsed = SendMessageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: req.params.id,
      msg: parsed.data.msg,
      me: parsed.data.me ?? true,
      sender: parsed.data.sender ?? null,
      role: parsed.data.role ?? null,
      sender_id: userId,
    })
    .select()
    .single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", req.params.id)
  res.status(201).json({
    id: data.id,
    msg: data.msg,
    time: data.created_at,
    me: data.me,
    sender: data.sender ?? undefined,
    role: data.role ?? undefined,
  })
})

router.patch("/:id/messages/:msgId", async (req, res) => {
  const parsed = UpdateMessageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const updates = {}
  if (p.msg != null) updates.msg = p.msg
  if (p.me != null) updates.me = p.me
  if (p.sender != null) updates.sender = p.sender
  if (p.role != null) updates.role = p.role
  const { data, error } = await supabase
    .from("chat_messages")
    .update(updates)
    .eq("id", req.params.msgId)
    .eq("chat_id", req.params.id)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", req.params.id)
  res.json({
    id: data.id,
    msg: data.msg,
    time: data.created_at,
    me: data.me,
    sender: data.sender ?? undefined,
    role: data.role ?? undefined,
  })
})

router.delete("/:id/messages/:msgId", async (req, res) => {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", req.params.msgId)
    .eq("chat_id", req.params.id)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", req.params.id)
  res.status(204).send()
})

router.patch("/:id", async (req, res) => {
  const parsed = UpdateChatSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" })
    return
  }
  const p = parsed.data
  const updates = { updated_at: new Date().toISOString() }
  if (p.name != null) updates.name = p.name
  if (p.avatar != null) updates.avatar = p.avatar
  if (p.phone != null) updates.phone = p.phone
  if (p.isGroup != null) updates.is_group = p.isGroup
  const { data, error } = await supabase
    .from("chats")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single()
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  const { data: last } = await supabase
    .from("chat_messages")
    .select("msg, created_at")
    .eq("chat_id", data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  res.json(
    chatRowToItem(
      { ...data, is_group: data.is_group },
      last ? { msg: last.msg, time: last.created_at } : undefined,
      0
    )
  )
})

router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("chats").delete().eq("id", req.params.id)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
