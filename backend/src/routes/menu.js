import { Router } from "express"
import tableMenuRoutes from "./table-menu.js"
import barMenuRoutes from "./bar-menu.js"

const router = Router()
router.use("/table", tableMenuRoutes)
router.use("/bar", barMenuRoutes)

export default router
