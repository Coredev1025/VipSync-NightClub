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

function chatRowToItem(r, lastMessage, unread = 0, otherParticipantProfileId = null) {
  return {
    id: r.id,
    name: r.name ?? "Chat",
    avatar: r.avatar ?? undefined,
    lastMessage: lastMessage?.msg ?? "",
    time: lastMessage?.time ?? new Date().toISOString(),
    unread,
    isGroup: r.is_group ?? false,
    seen: unread === 0,
    otherParticipantProfileId: otherParticipantProfileId ?? undefined,
  }
}

/** Returns participant row if user is in chat (or chat creator for backward compat); otherwise null. */
async function getParticipantOrCreator(chatId, userId) {
  const { data: participant } = await supabase
    .from("chat_participants")
    .select("id, last_read_at")
    .eq("chat_id", chatId)
    .eq("profile_id", userId)
    .single()
  if (participant) return { participant, lastReadAt: participant.last_read_at ?? null }

  const { data: chat } = await supabase.from("chats").select("created_by").eq("id", chatId).single()
  if (chat?.created_by === userId) return { participant: { id: "creator" }, lastReadAt: null }
  return null
}

/** Ensures user can access chat; returns 403 if not. Returns participant info if allowed. */
async function ensureCanAccessChat(req, res) {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return null
  }
  const info = await getParticipantOrCreator(req.params.id, userId)
  if (!info) {
    res.status(403).json({ error: "Not a participant of this chat" })
    return null
  }
  return info
}

// GET /api/chats — list chats for current user (participant or creator), with last message and unread count
router.get("/", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const { data: participantRows } = await supabase
    .from("chat_participants")
    .select("chat_id, last_read_at")
    .eq("profile_id", userId)

  const chatIdsFromParticipants = (participantRows ?? []).map((r) => r.chat_id)
  const lastReadByChatId = Object.fromEntries(
    (participantRows ?? []).map((r) => [r.chat_id, r.last_read_at ?? null])
  )

  const { data: createdChats } = await supabase
    .from("chats")
    .select("id")
    .eq("created_by", userId)
  const createdIds = new Set((createdChats ?? []).map((c) => c.id))
  const allChatIds = [...new Set([...chatIdsFromParticipants, ...createdIds])]
  if (allChatIds.length === 0) {
    res.json({ chats: [] })
    return
  }

  const { data: chats, error: chatsErr } = await supabase
    .from("chats")
    .select("id, name, avatar, is_group, created_at, updated_at")
    .in("id", allChatIds)
    .order("updated_at", { ascending: false })

  if (chatsErr) {
    res.status(500).json({ error: chatsErr.message })
    return
  }

  const result = []
  for (const c of chats ?? []) {
    const lastReadAt = lastReadByChatId[c.id] ?? null

    const { data: last } = await supabase
      .from("chat_messages")
      .select("msg, created_at")
      .eq("chat_id", c.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let unread = 0
    if (lastReadAt) {
      const { count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("chat_id", c.id)
        .gt("created_at", lastReadAt)
        .neq("sender_id", userId)
      unread = count ?? 0
    } else {
      const { count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("chat_id", c.id)
        .neq("sender_id", userId)
      unread = count ?? 0
    }

    let otherParticipantProfileId = null
    if (!c.is_group) {
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("profile_id")
        .eq("chat_id", c.id)
      const profileIds = (participants ?? []).map((p) => p.profile_id).filter(Boolean)
      const other = profileIds.find((id) => id !== userId)
      if (other) otherParticipantProfileId = other
    }

    result.push(
      chatRowToItem(
        { ...c, is_group: c.is_group },
        last ? { msg: last.msg, time: last.created_at } : undefined,
        unread,
        otherParticipantProfileId
      )
    )
  }
  res.json({ chats: result })
})

// POST /api/chats — create chat and add creator + memberIds to chat_participants
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

  const memberIds = [...new Set([userId, ...(parsed.data.memberIds ?? [])])]
  await supabase.from("chat_participants").insert(
    memberIds.map((profile_id) => ({
      chat_id: data.id,
      profile_id,
    }))
  )
  res.status(201).json(chatRowToItem(data))
})

router.get("/:id/messages", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const access = await ensureCanAccessChat(req, res)
  if (!access) return

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100)
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)

  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("id, msg, created_at, sender_id, sender, role, me")
    .eq("chat_id", req.params.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  const ordered = (rows ?? []).reverse()
  const messages = ordered.map((r) => {
    const isMe = r.sender_id ? r.sender_id === userId : r.me ?? false
    return {
      id: r.id,
      msg: r.msg,
      time: r.created_at,
      me: isMe,
      sender_id: r.sender_id ?? undefined,
      sender: r.sender ?? undefined,
      role: r.role ?? undefined,
    }
  })

  const { count } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", req.params.id)

  res.json({ messages, total: count ?? messages.length })
})

router.post("/:id/messages", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const access = await ensureCanAccessChat(req, res)
  if (!access) return

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
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const access = await ensureCanAccessChat(req, res)
  if (!access) return

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
    .eq("sender_id", userId)
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
    me: data.sender_id ? data.sender_id === userId : data.me ?? false,
    sender_id: data.sender_id ?? undefined,
    sender: data.sender ?? undefined,
    role: data.role ?? undefined,
  })
})

router.delete("/:id/messages", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const access = await ensureCanAccessChat(req, res)
  if (!access) return

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("chat_id", req.params.id)

  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }

  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", req.params.id)
  res.status(204).send()
})

router.delete("/:id/messages/:msgId", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const access = await ensureCanAccessChat(req, res)
  if (!access) return

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", req.params.msgId)
    .eq("chat_id", req.params.id)
    .eq("sender_id", userId)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", req.params.id)
  res.status(204).send()
})

router.post("/:id/read", async (req, res) => {
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const access = await getParticipantOrCreator(req.params.id, userId)
  if (!access) {
    res.status(403).json({ error: "Not a participant of this chat" })
    return
  }
  const { error } = await supabase
    .from("chat_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("chat_id", req.params.id)
    .eq("profile_id", userId)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

router.patch("/:id", async (req, res) => {
  const access = await ensureCanAccessChat(req, res)
  if (!access) return

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

  const userId = req.user?.sub
  const participantInfo = await getParticipantOrCreator(data.id, userId)
  let unread = 0
  if (participantInfo?.lastReadAt) {
    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("chat_id", data.id)
      .gt("created_at", participantInfo.lastReadAt)
      .neq("sender_id", userId)
    unread = count ?? 0
  }
  res.json(
    chatRowToItem(
      { ...data, is_group: data.is_group },
      last ? { msg: last.msg, time: last.created_at } : undefined,
      unread
    )
  )
})

router.delete("/:id", async (req, res) => {
  const access = await ensureCanAccessChat(req, res)
  if (!access) return

  const { error } = await supabase.from("chats").delete().eq("id", req.params.id)
  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message })
    return
  }
  res.status(204).send()
})

export default router
