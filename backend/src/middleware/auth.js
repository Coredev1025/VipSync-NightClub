import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "vipsync-dev-secret-change-in-production"

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET)
    } catch {
      // ignore
    }
  }
  next()
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}
