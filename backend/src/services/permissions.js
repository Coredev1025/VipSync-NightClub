
export function canManageClubSettings(role) {
  return role === "owner" || role === "manager"
}

export function canAccessOps(role) {
  return role === "owner" || role === "manager"
}

export function canEditMapTables(role) {
  return role !== "door"
}

export function canEditTableGirl(role) {
  return role === "manager" || role === "owner"
}

export function canManageVibeEvents(role) {
  return role === "manager" || role === "owner"
}

export function canViewLiveFeed(role) {
  return canAccessOps(role)
}

export function canManageLiveFeed(role) {
  return role === "manager" || role === "owner"
}

export function canManageBottlesAndStock(role) {
  return role === "manager" || role === "owner"
}

export function canSendPush(role) {
  return role === "manager" || role === "owner"
}

export function getProRoleFromPayload(proRole) {
  if (!proRole) return undefined
  const r = proRole.toLowerCase()
  if (r === "promoter" || r === "door" || r === "manager" || r === "owner") return r
  return undefined
}
