import { Router } from "express"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canEditMapTables } from "../services/permissions.js"

const router = Router()
router.use(authMiddleware)
const requireEditMap = requirePermission(canEditMapTables)

router.post("/pdf", requireEditMap, async (req, res) => {
  const tablesExtracted = []

  res.status(202).json({
    ok: true,
    message: "PDF import received (stub). Real parsing TODO.",
    tablesExtracted: tablesExtracted.length,
    tables: tablesExtracted,
  })
})

export default router
