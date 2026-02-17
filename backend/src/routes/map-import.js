import { Router } from "express"
import { authMiddleware } from "../middleware/auth.js"
import { requirePermission } from "../middleware/require-permission.js"
import { canEditMapTables } from "../services/permissions.js"

const router = Router()
router.use(authMiddleware)
const requireEditMap = requirePermission(canEditMapTables)

/**
 * PDF table import — stub implementation.
 * Accepts multipart/form-data with a "file" field (PDF).
 * TODO: Integrate real PDF parsing (e.g. pdf-parse, pdfjs-dist, or external service)
 * to extract table positions/numbers from floor plan or menu PDFs.
 * For now returns a placeholder result; frontend can still call and show "imported" state.
 */
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
