import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") })

import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.js"
import bottlesRoutes from "./routes/bottles.js"
import vibeRoutes from "./routes/vibe.js"
import tablesRoutes from "./routes/tables.js"
import profileRoutes from "./routes/profile.js"
import chatsRoutes from "./routes/chats.js"
import contactsRoutes from "./routes/contacts.js"
import opsRoutes from "./routes/ops.js"
import guestRoutes from "./routes/guest.js"
import barLtoRoutes from "./routes/bar-lto.js"
import mapImportRoutes from "./routes/map-import.js"
import menuRoutes from "./routes/menu.js"
import vipTablesRoutes from "./routes/vip-tables.js"
import liveFeedRoutes from "./routes/live-feed.js"
import staffRoutes from "./routes/staff.js"
import pushRoutes from "./routes/push.js"

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const connectionState = {
  lastRequestAt: null,
  requestCount: 0,
  startedAt: new Date().toISOString(),
}

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.use((req, _res, next) => {
  connectionState.lastRequestAt = new Date().toISOString()
  connectionState.requestCount += 1
  try {
    const bodyPreview = req.body && Object.keys(req.body).length ? JSON.stringify(req.body).slice(0, 200) : ""
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}${bodyPreview ? ` — body: ${bodyPreview}` : ""}`)
  } catch (err) {
  }
  next()
})

app.use("/api/auth", authRoutes)
app.use("/api/bottles", bottlesRoutes)
app.use("/api/vibe", vibeRoutes)
app.use("/api/tables", tablesRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/chats", chatsRoutes)
app.use("/api/contacts", contactsRoutes)
app.use("/api/ops", opsRoutes)
app.use("/api/guest", guestRoutes)
app.use("/api/bar-lto", barLtoRoutes)
app.use("/api/map", mapImportRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/vip-tables", vipTablesRoutes)
app.use("/api/live-feed", liveFeedRoutes)
app.use("/api/staff", staffRoutes)
app.use("/api/push", pushRoutes)

app.get("/", (_req, res) => {
  res.json({ api: "vipsync", version: "1.0.0", health: "/health" })
})

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.get("/connection", (_req, res) => {
  res.json({
    ok: true,
    backend: "vipsync",
    startedAt: connectionState.startedAt,
    lastRequestAt: connectionState.lastRequestAt,
    requestCount: connectionState.requestCount,
    message: connectionState.lastRequestAt
      ? `Last request at ${connectionState.lastRequestAt} (${connectionState.requestCount} total since startup).`
      : "No requests yet.",
  })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

const HOST = process.env.HOST || "0.0.0.0"
app.listen(PORT, HOST, () => {
  console.log(`VIPsync API listening on http://${HOST}:${PORT}`)
  console.log(`Connection state: GET http://${HOST}:${PORT}/connection`)
})
