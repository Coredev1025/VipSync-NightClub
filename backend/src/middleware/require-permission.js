import { getProRoleFromPayload } from "../services/permissions.js"

export function requirePermission(check) {
  return (req, res, next) => {
    const role = getProRoleFromPayload(req.user?.proRole)
    if (!req.user?.sub) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }
    if (!check(role)) {
      res.status(403).json({ error: "Forbidden: insufficient role" })
      return
    }
    next()
  }
}
